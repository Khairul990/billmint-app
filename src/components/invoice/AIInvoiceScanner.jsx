import React, { useState, useRef } from 'react';
import { Sparkles, UploadCloud, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useInvoice } from '../../context/InvoiceContext';
import { toast } from 'react-hot-toast';
import { settingsEngine } from '../../services/settingsEngine';

const AIInvoiceScanner = () => {
  const { updateInvoice } = useInvoice();
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);

  const handleScanClick = () => {
    setIsOpen(true);
  };

  const processImage = async (file) => {
    try {
      setIsScanning(true);
      const settings = await settingsEngine.getSettings();
      const apiKey = settings?.geminiApiKey;
      
      if (!apiKey) {
        toast.error('Gemini API Key missing! Please configure it in Settings > AI & Bot.');
        setIsScanning(false);
        return;
      }

      // 1. Convert File to Base64
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // extract the base64 string without the prefix
          const b64 = reader.result.split(',')[1];
          resolve(b64);
        };
        reader.readAsDataURL(file);
      });

      // 2. Call Gemini API
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [
          {
            parts: [
              { text: "Analyze this image of a bill/receipt. Return a JSON object with the following schema exactly (no markdown formatting, just pure JSON). Schema: { \"customerName\": string, \"customerPhone\": string, \"items\": [{ \"description\": string, \"qty\": number, \"rate\": number }] }. If a field is not found, leave it blank." },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64Data
                }
              }
            ]
          }
        ]
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Clean markdown code blocks if any
      const cleanedText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let parsedObj;
      try {
        parsedObj = JSON.parse(cleanedText);
      } catch (e) {
        console.error('Failed to parse Gemini output:', cleanedText);
        throw new Error('AI returned invalid format.', { cause: e });
      }

      // 3. Populate Context
      if (parsedObj) {
        if (parsedObj.customerName) updateInvoice('customerName', parsedObj.customerName);
        if (parsedObj.customerPhone) updateInvoice('customerPhone', parsedObj.customerPhone);
        
        if (parsedObj.items && Array.isArray(parsedObj.items) && parsedObj.items.length > 0) {
          // map to our invoice item structure
          const formattedItems = parsedObj.items.map(item => ({
            description: item.description || 'Scanned Item',
            qty: parseFloat(item.qty) || 1,
            rate: parseFloat(item.rate) || 0,
            amount: (parseFloat(item.qty) || 1) * (parseFloat(item.rate) || 0)
          }));
          updateInvoice('items', formattedItems);
        }
        
        toast.success('Bill successfully scanned and populated!');
        setIsOpen(false);
      } else {
        throw new Error('No data extracted.');
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to scan bill: ' + err.message);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  return (
    <>
      <button
        onClick={handleScanClick}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 transition-all border border-purple-200 dark:border-purple-800"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">AI Scan</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-theme-card dark:bg-theme-card w-full max-w-md rounded-3xl p-6 shadow-2xl border border-theme-border-soft relative animate-scaleUp">
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6 mt-2">
              <div className="w-16 h-16 bg-[image:var(--accent-gradient)] rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-glow">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-theme-primary">AI Bill Scanner</h2>
              <p className="text-xs text-theme-muted mt-2 px-4">Upload a photo of a physical bill or receipt. Our AI will automatically extract items, prices, and customer info.</p>
            </div>

            {isScanning ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="w-10 h-10 text-theme-accent animate-spin" />
                <p className="text-sm font-bold text-theme-accent animate-pulse">Analyzing document via Gemini AI...</p>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-theme-border-soft hover:border-theme-accent bg-theme-surface/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-10 h-10 text-theme-muted mb-3" />
                <span className="font-bold text-theme-primary text-sm">Click to Upload Image</span>
                <span className="text-[10px] text-theme-muted mt-1">Supports JPG, PNG, WEBP</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIInvoiceScanner;
