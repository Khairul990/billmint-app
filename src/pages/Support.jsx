import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import { LifeBuoy, ArrowLeft, Mail, MessageCircle, FileText, Check, AlertCircle, Plus, Send, Upload, Inbox, CheckCircle } from 'lucide-react';
import { authEngine } from '../services/authEngine';
import { adminEngine } from '../services/adminEngine';
import { supportEngine } from '../services/supportEngine';
import { toast } from 'react-hot-toast';

export default function Support({ onBack }) {
  const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'tickets' | 'features' | 'changelog'
  
  // Support ticket form state
  const [issueType, setIssueType] = useState('Question');
  const [ticketMsg, setTicketMsg] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [ticketScreenshot, setTicketScreenshot] = useState(null);
  const [ticketScreenshotBase64, setTicketScreenshotBase64] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [myTickets, setMyTickets] = useState([]);

  // Feature request form state
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [featurePriority, setFeaturePriority] = useState('Medium');
  const [submittingFeature, setSubmittingFeature] = useState(false);
  const [myFeatures, setMyFeatures] = useState([]);

  // Changelogs state
  const [changelogs, setChangelogs] = useState([]);
  const [loadingChangelogs, setLoadingChangelogs] = useState(false);

  // Load user email on mount
  useEffect(() => {
    const session = authEngine.getAuthSession();
    if (session?.userEmail) {
      setUserEmail(session.userEmail);
    }
  }, []);

  const fetchUserData = async () => {
    const userId = authEngine.getRealUserId() || 'local-user';
    try {
      const tickets = await supportEngine.getUserSupportTickets(userId);
      setMyTickets(tickets);
      
      const features = await supportEngine.getUserFeatureRequests(userId);
      setMyFeatures(features);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChangelogs = async () => {
    setLoadingChangelogs(true);
    try {
      const logs = await adminEngine.getAdminAllChangelogs();
      setChangelogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChangelogs(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchChangelogs();
  }, []);

  const handleScreenshotChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setTicketScreenshot(file);
      const reader = new FileReader();
      reader.onload = (event) => setTicketScreenshotBase64(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketMsg.trim()) {
      toast.error('Please write a message detailing your issue.');
      return;
    }

    setSubmittingTicket(true);
    try {
      const userId = authEngine.getRealUserId() || 'local-user';
      const email = userEmail || authEngine.getAuthSession()?.userEmail || 'local-user';
      
      await supportEngine.submitSupportTicket(userId, email, userPhone, issueType, ticketMsg, ticketScreenshotBase64);
      toast.success('Support ticket submitted successfully!');
      
      // Reset
      setTicketMsg('');
      setUserPhone('');
      setTicketScreenshot(null);
      setTicketScreenshotBase64('');
      fetchUserData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit support ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    if (!featureTitle.trim() || !featureDesc.trim()) {
      toast.error('Please fill in both the title and description.');
      return;
    }

    setSubmittingFeature(true);
    try {
      const userId = authEngine.getRealUserId() || 'local-user';
      const email = userEmail || authEngine.getAuthSession()?.userEmail || 'local-user';
      const businessType = localStorage.getItem('billqyro_business_type') || 'General';

      await supportEngine.submitFeatureRequest(userId, email, featureTitle, featureDesc, businessType, featurePriority);
      toast.success('Feature request submitted successfully!');
      
      setFeatureTitle('');
      setFeatureDesc('');
      fetchUserData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit feature request.');
    } finally {
      setSubmittingFeature(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-theme-app text-theme-primary font-sans pb-24">
      {/* Header bar */}
      <div className="bg-theme-card border-b border-theme-border-soft sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-theme-app transition-colors text-theme-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-theme-accent" /> Help & Support Center
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Support Tab Switcher */}
        <div className="flex bg-theme-surface border border-theme-border-soft rounded-2xl p-1 overflow-x-auto whitespace-nowrap scrollbar-none gap-1">
          {[
            { id: 'faq', label: 'FAQ & Quick Links' },
            { id: 'tickets', label: 'Support Tickets' },
            { id: 'features', label: 'Request Features' },
            { id: 'changelog', label: 'What\'s New' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 text-xs font-black rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-theme-card text-theme-primary shadow-sm border border-theme-border-soft/60'
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="bg-theme-warning/10 border border-theme-warning/30 rounded-2xl p-4 text-theme-warning text-sm font-semibold">
              Disclaimer: BillQyro is not legal, tax, or accounting advice. This tool is provided for your convenience only.
            </div>

            <div className="text-center py-4">
              <h2 className="text-xl font-black mb-1">How can we help you?</h2>
              <p className="text-theme-muted text-xs font-semibold">Our support team is here to assist you with any questions or issues.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="mailto:support@billqyro.com" className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium hover:shadow-premium-hover transition-all duration-300 block group">
                <div className="w-12 h-12 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Email Support</h3>
                <p className="text-sm text-theme-muted mb-4">Send us an email and we'll get back to you within 24 hours.</p>
                <span className="text-theme-accent font-bold text-sm">support@billqyro.com &rarr;</span>
              </a>

              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium hover:shadow-premium-hover transition-all duration-300 block group">
                <div className="w-12 h-12 bg-theme-success/10 text-theme-success rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Live Chat</h3>
                <p className="text-sm text-theme-muted mb-4">Chat with our support agents directly via WhatsApp.</p>
                <span className="text-theme-success font-bold text-sm">Chat Now &rarr;</span>
              </a>
            </div>

            <section className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-theme-accent" />
                <h2 className="text-lg font-black">Frequently Asked Questions</h2>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-theme-app rounded-2xl border border-theme-border-soft">
                  <h3 className="font-bold text-sm mb-1">How do I change my currency?</h3>
                  <p className="text-xs text-theme-muted">Go to Settings &gt; Business Profile, and update your currency code.</p>
                </div>
                <div className="p-4 bg-theme-app rounded-2xl border border-theme-border-soft">
                  <h3 className="font-bold text-sm mb-1">Are my invoices backed up?</h3>
                  <p className="text-xs text-theme-muted">Yes, if you have Firebase connected or use the offline-first IndexedDB system, your data is securely stored locally.</p>
                </div>
                <div className="p-4 bg-theme-app rounded-2xl border border-theme-border-soft">
                  <h3 className="font-bold text-sm mb-1">How do I export my data?</h3>
                  <p className="text-xs text-theme-muted">You can export data from the Data Management section under More Menu.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {/* Create Ticket Form */}
            <div className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
              <h3 className="text-lg font-black text-theme-primary mb-4">Submit a Support Ticket</h3>
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Issue Type</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary px-4 py-3 rounded-xl focus:outline-none focus:border-theme-accent text-sm font-semibold cursor-pointer"
                    >
                      <option value="Billing">Billing / Platform Dues</option>
                      <option value="Bug">Technical Bug / Issue</option>
                      <option value="Question">General Question</option>
                      <option value="Other">Other / Help Request</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Contact Phone (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary px-4 py-3 rounded-xl focus:outline-none focus:border-theme-accent text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Message / Issue Details</label>
                  <textarea 
                    rows="4"
                    placeholder="Describe your issue in detail so our support team can help..."
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary px-4 py-3 rounded-xl focus:outline-none focus:border-theme-accent text-sm font-semibold resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Screenshot (Optional)</label>
                  <div className="relative border border-theme-border-soft border-dashed rounded-xl p-6 text-center hover:border-theme-accent transition-colors bg-theme-surface">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleScreenshotChange(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-5 h-5 mx-auto mb-2 text-theme-muted" />
                    <span className="text-[10px] text-theme-muted font-bold block">
                      {ticketScreenshot ? ticketScreenshot.name : 'Choose screenshot image'}
                    </span>
                  </div>
                  {ticketScreenshotBase64 && (
                    <div className="mt-2.5 flex items-center gap-3 bg-theme-surface border border-theme-border-soft rounded-xl p-2">
                      <img src={ticketScreenshotBase64} alt="Screenshot preview" className="w-12 h-12 object-cover rounded-lg" />
                      <span className="text-[10px] text-theme-muted truncate max-w-[200px]">{ticketScreenshot?.name}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full h-12 bg-theme-accent text-white font-extrabold rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {submittingTicket ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>

            {/* My Tickets List */}
            <div className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
              <h3 className="text-lg font-black text-theme-primary mb-4">My Support History</h3>
              {myTickets.length === 0 ? (
                <p className="text-xs text-theme-muted font-bold italic py-4">No support tickets submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {myTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-theme-surface rounded-2xl p-4 border border-theme-border-soft/60 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            ticket.issueType === 'Bug' ? 'bg-theme-danger/10 text-theme-danger border-theme-danger/20' : 'bg-theme-accent/10 text-theme-accent border-theme-accent/20'
                          }`}>
                            {ticket.issueType}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            ticket.status === 'Open' ? 'bg-theme-warning/15 text-theme-warning border-theme-warning/20' : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-theme-primary">{ticket.message}</p>
                        <p className="text-[10px] text-theme-muted mt-2">Submitted: {new Date(ticket.createdAt).toLocaleDateString()}</p>
                        
                        {ticket.adminNote && (
                          <div className="mt-3 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                            <span className="font-extrabold block text-xs mb-1">Support Reply:</span>
                            {ticket.adminNote}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FEATURE REQUESTS */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <div className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
              <h3 className="text-lg font-black text-theme-primary mb-4">Request a Platform Feature</h3>
              <form onSubmit={handleFeatureSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Feature Title</label>
                  <input 
                    type="text"
                    placeholder="e.g. Export reports to Excel / CSV"
                    value={featureTitle}
                    onChange={(e) => setFeatureTitle(e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary px-4 py-3 rounded-xl focus:outline-none focus:border-theme-accent text-sm font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Feature Details & Description</label>
                  <textarea 
                    rows="4"
                    placeholder="Describe how this feature should work and why it is useful for your business..."
                    value={featureDesc}
                    onChange={(e) => setFeatureDesc(e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary px-4 py-3 rounded-xl focus:outline-none focus:border-theme-accent text-sm font-semibold resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Priority</label>
                  <select
                    value={featurePriority}
                    onChange={(e) => setFeaturePriority(e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary px-4 py-3 rounded-xl focus:outline-none focus:border-theme-accent text-sm font-semibold cursor-pointer"
                  >
                    <option value="Low">Low - Nice to have</option>
                    <option value="Medium">Medium - Regular feature</option>
                    <option value="High">High - Crucial addition</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submittingFeature}
                  className="w-full h-12 bg-theme-accent text-white font-extrabold rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {submittingFeature ? 'Submitting...' : 'Submit Feature Request'}
                </button>
              </form>
            </div>

            <div className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
              <h3 className="text-lg font-black text-theme-primary mb-4">My Feature Requests</h3>
              {myFeatures.length === 0 ? (
                <p className="text-xs text-theme-muted font-bold italic py-4">No feature requests submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {myFeatures.map((req) => (
                    <div key={req.id} className="bg-theme-surface rounded-2xl p-4 border border-theme-border-soft/60 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-extrabold text-sm text-theme-primary">{req.title}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            req.status === 'Done' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' : 
                            req.status === 'Planned' ? 'bg-theme-accent/15 text-theme-accent border-theme-accent/20' : 
                            req.status === 'Rejected' ? 'bg-theme-danger/15 text-theme-danger border-theme-danger/20' : 
                            'bg-theme-muted/15 text-theme-muted border-theme-muted/20'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-theme-muted font-semibold">{req.description}</p>
                        <p className="text-[9px] text-theme-muted font-mono mt-2">Priority: {req.priority}</p>
                        
                        {req.adminNote && (
                          <div className="mt-3 text-theme-accent bg-theme-accent/5 p-3 rounded-xl border border-theme-accent/10">
                            <span className="font-extrabold block text-xs mb-1">Developer Comments:</span>
                            {req.adminNote}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CHANGELOG */}
        {activeTab === 'changelog' && (
          <div className="space-y-6">
            <div className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
              <h3 className="text-lg font-black text-theme-primary mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-theme-accent" /> Release Changelog History
              </h3>

              {loadingChangelogs ? (
                <div className="flex justify-center py-6">
                  <span className="w-6 h-6 border-2 border-theme-border-strong border-t-theme-accent rounded-full animate-spin"></span>
                </div>
              ) : changelogs.length === 0 ? (
                <p className="text-xs text-theme-muted font-bold italic py-4">No release logs published yet.</p>
              ) : (
                <div className="space-y-6 relative pl-4 border-l border-theme-border-soft">
                  {changelogs.map((log) => (
                    <div key={log.id} className="relative group space-y-2">
                      {/* Timeline dot */}
                      <div className="absolute -left-[21px] top-1.5 w-3.5 h-3.5 bg-theme-card border-2 border-theme-accent rounded-full group-hover:scale-110 transition-transform"></div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-theme-accent font-mono">{log.version}</span>
                        <span className="text-[10px] text-theme-muted font-mono font-bold">{new Date(log.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                          log.type === 'fix' ? 'bg-theme-danger/10 text-theme-danger border-theme-danger/20' : 
                          log.type === 'new' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          'bg-theme-accent/10 text-theme-accent border-theme-accent/20'
                        }`}>
                          {log.type}
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-theme-primary">{log.title}</h4>
                      <div className="text-xs text-theme-muted leading-relaxed font-semibold whitespace-pre-line pl-1">
                        {log.notes}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
    </AnimatedPage>
  );
}
