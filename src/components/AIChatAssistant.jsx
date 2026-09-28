import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Bot, User, CheckCircle2, ChevronDown, Plus, ArrowRight, Mic } from 'lucide-react';
import { useI18n } from '../utils/i18n';
import { invoiceEngine } from '../services/invoiceEngine';
import { customerEngine } from '../services/customerEngine';
import { expenseEngine } from '../services/expenseEngine';
import { formatCurrency } from '../utils/invoiceUtils';

export const AIChatAssistant = ({ onNavigate }) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    return [{ id: 1, text: `${greeting}! 👋 I'm BillQyro AI ✨\nI can help you analyze your business, track expenses, or create bills instantly. What do you need?`, sender: 'ai', time: new Date() }];
  });
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (forcedText = null) => {
    const textToSend = forcedText || inputValue;
    if (!textToSend.trim()) return;
    
    const userMessage = { id: Date.now(), text: textToSend, sender: 'user', time: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Smart AI Logic
    const query = userMessage.text.toLowerCase();
    let responseText = "I'm still learning! Right now I can help you analyze revenue, create bills, track dues, or list top customers. Just ask!";
    let action = null;

    try {
      const invoices = await invoiceEngine.getInvoices();
      const customers = await customerEngine.getCustomers();
      
      // Basic math matching
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || inv.grandTotal || 0), 0);
      const totalDue = invoices.filter(i => i.status !== 'PAID').reduce((sum, inv) => sum + (inv.balanceDue || inv.grandTotal || 0), 0);
      const currency = invoices[0]?.currency || '₹';

      if (query.includes('revenue') || query.includes('sell') || query.includes('sale') || query.includes('cel') || query.includes('income')) {
        const today = new Date().toISOString().split('T')[0];
        const todaysInvoices = invoices.filter(i => i.date === today || (i.createdAt && new Date(i.createdAt).toISOString().split('T')[0] === today));
        const todaysSale = todaysInvoices.reduce((sum, inv) => sum + (inv.total || inv.grandTotal || 0), 0);
        
        if (query.includes('today') || query.includes('aj') || query.includes('ajke')) {
          if (todaysInvoices.length === 0) {
            responseText = `You haven't generated any sales today yet. Time to create some bills and get those numbers up! 💪`;
          } else {
            responseText = `Today's sales look great! 🌟 You generated **${formatCurrency(todaysSale, currency)}** across ${todaysInvoices.length} invoices. Keep it up!`;
          }
        } else {
          responseText = `Your total lifetime revenue is **${formatCurrency(totalRevenue, currency)}**! Your business is growing beautifully. 📈`;
        }
      } 
      else if (query.includes('best') || query.includes('top') || (query.includes('customer') && query.includes('highest'))) {
        if (customers.length === 0) {
          responseText = `You don't have any customers saved yet. Want to add one?`;
          action = () => onNavigate('customers');
        } else {
          // Calculate top customer
          const customerStats = {};
          invoices.forEach(inv => {
            if (inv.customer && inv.customer.name) {
              customerStats[inv.customer.name] = (customerStats[inv.customer.name] || 0) + (inv.total || inv.grandTotal || 0);
            }
          });
          
          let topCustomer = null;
          let maxSpent = 0;
          Object.entries(customerStats).forEach(([name, spent]) => {
            if (spent > maxSpent) {
              maxSpent = spent;
              topCustomer = name;
            }
          });

          if (topCustomer) {
            responseText = `Your top customer is **${topCustomer}**, generating **${formatCurrency(maxSpent, currency)}** in revenue! 🏆`;
          } else {
            responseText = `I couldn't calculate your top customer right now. Start making some bills!`;
          }
        }
      }
      else if (query.includes('due') || query.includes('pabo') || query.includes('baki') || query.includes('outstanding') || query.includes('unpaid')) {
        const unpaidCount = invoices.filter(i => i.status !== 'PAID').length;
        if (totalDue > 0) {
          responseText = `You have **${formatCurrency(totalDue, currency)}** tied up in **${unpaidCount} unpaid bills**. 💰\nShould I take you to the Collection Center?`;
          action = () => onNavigate('invoices');
        } else {
          responseText = `Amazing news! 🎉 You have 0 outstanding dues. Every bill has been paid!`;
        }
      }
      else if (query.includes('create') || query.includes('bill') || query.includes('invoice') || query.includes('toiri') || query.includes('new')) {
        responseText = `Sure! I can help you create a new invoice instantly. Let's head over to the studio. 🎨`;
        action = () => onNavigate('create-invoice');
      }
      else if (query.includes('customer') || query.includes('client') || query.includes('kient')) {
        responseText = `You currently have **${customers.length}** customers saved in your database. Want to manage them?`;
        action = () => onNavigate('customers');
      }
      else if (query.includes('expense') || query.includes('khoroch') || query.includes('cost')) {
        const expenses = await expenseEngine.getExpenses();
        const totalExp = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        if (totalExp > 0) {
          responseText = `You have recorded a total of **${formatCurrency(totalExp, currency)}** in business expenses. 💸`;
          action = () => onNavigate('expenses');
        } else {
          responseText = `You haven't recorded any expenses yet! Keeping costs at zero, impressive! 🚀`;
        }
      }
      else if (query.includes('celebrate') || query.includes('confetti') || query.includes('party')) {
        responseText = `Woohoo! Let's celebrate your business success! 🎉✨🎊`;
        action = () => {
          import('canvas-confetti').then(confetti => {
             confetti.default({ particleCount: 200, spread: 160, origin: { y: 0.6 } });
          });
        };
      }
      else if (query.includes('hello') || query.includes('hi ') || query.includes('hey')) {
        responseText = `Hello! 👋 I'm BillQyro AI, your smartest business companion. Ask me about your revenue, dues, or to create a bill!`;
      }
      else {
        responseText = `I understand you want to "${userMessage.text}". As an AI, I am constantly being upgraded to handle complex commands.\n\nTry asking me:\n• "What is my total revenue?"\n• "How much is due?"\n• "Who is my best customer?"\n• "Create a bill"`;
      }
    } catch (e) {
      responseText = "Oops! I encountered an error checking your business data. Ensure you have some invoices created.";
      console.error("AI Error:", e);
    }

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: responseText, sender: 'ai', time: new Date(), action }]);
    }, 1500);
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input is not supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Works for Bengali-English mix often if browser supports
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      // Auto send after speaking
      setTimeout(() => {
        handleSend(transcript);
      }, 500);
    };
    
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-[9900] w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center text-white cursor-pointer transition-all ${isOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'}`}
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[80vh] rounded-[2rem] border border-white/60 shadow-[0_24px_64px_-12px_rgba(11,143,120,0.2),0_0_40px_rgba(255,255,255,0.9)] bg-gradient-to-b from-white/95 via-theme-surface/90 to-emerald-50/90 backdrop-blur-3xl ring-1 ring-white dark:bg-gradient-to-b dark:from-[#0B1220]/95 dark:to-[#0B1220]/90 dark:border-emerald-500/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-theme-border-soft/60 bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 relative">
                  <Bot className="w-6 h-6" />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-[#0B1220] rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-theme-primary text-sm">BillQyro AI</h3>
                  <span className="text-[10px] text-theme-accent font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Smart Assistant
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-theme-surface hover:bg-rose-500/10 hover:text-rose-500 border border-theme-border-soft flex items-center justify-center transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={chatRef} className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 ${
                    msg.sender === 'user' 
                      ? 'bg-theme-accent text-white rounded-tr-sm shadow-md' 
                      : 'bg-white dark:bg-theme-surface border border-theme-border-soft text-theme-primary rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.sender === 'ai' && (
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="w-3 h-3 text-theme-accent" />
                        <span className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">AI</span>
                      </div>
                    )}
                    <p 
                      className="text-sm whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                    />
                    
                    {msg.action && (
                      <button 
                        onClick={() => { msg.action(); setIsOpen(false); }}
                        className="mt-3 w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-emerald-500/20"
                      >
                        Action Required <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-theme-surface border border-theme-border-soft rounded-2xl rounded-tl-sm p-4 flex gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-theme-accent/60 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-theme-accent/60 rounded-full animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 bg-theme-accent/60 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies Area */}
            {!isTyping && (
              <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
                {["Today's Sales", "Total Due", "Top Customer", "Expenses"].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-theme-surface hover:bg-theme-accent/10 border border-theme-border-soft text-[11px] font-bold text-theme-muted hover:text-theme-accent transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-theme-surface/50 border-t border-theme-border-soft/60 shrink-0">
              <div className="relative flex items-center gap-2">
                <button
                  onClick={toggleVoice}
                  className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
                      : 'bg-theme-surface hover:bg-rose-500/10 text-theme-muted hover:text-rose-500 border border-theme-border-soft'
                  }`}
                  title="Speak to AI"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isListening ? "Listening..." : "Ask me anything..."}
                    className="w-full bg-white dark:bg-[#0B1220] border border-theme-border-soft rounded-2xl py-3.5 pl-4 pr-12 text-sm text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent shadow-inner transition-all placeholder:text-theme-muted/50"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim() || isTyping}
                    className="absolute right-1.5 w-10 h-10 bg-theme-accent text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-3">
                <span className="text-[10px] text-theme-muted font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Powered by BillQyro AI
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
