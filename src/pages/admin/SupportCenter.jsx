import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  getAdminAllSupportTickets, 
  updateSupportTicketStatus, 
  getAdminAllFeatureRequests, 
  updateFeatureRequestStatus 
} from '../../services/dbEngine';

const SupportCenter = () => {
  const [activeSubTab, setActiveSubTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adminNote, setAdminNote] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeSubTab === 'tickets') {
        const ticketList = await getAdminAllSupportTickets();
        setTickets(ticketList);
      } else {
        const featureList = await getAdminAllFeatureRequests();
        setFeatures(featureList);
      }
    } catch (e) {
      toast.error('Failed to load platform data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const handleUpdateTicket = async (ticketId, status) => {
    const note = adminNote[ticketId] || '';
    try {
      const ok = await updateSupportTicketStatus(ticketId, status, note);
      if (ok) {
        toast.success(`Ticket status updated to ${status}`);
        loadData();
      } else {
        toast.error('Failed to update ticket');
      }
    } catch (e) {
      toast.error('Error updating ticket status');
    }
  };

  const handleUpdateFeature = async (requestId, status) => {
    const note = adminNote[requestId] || '';
    try {
      const ok = await updateFeatureRequestStatus(requestId, status, note);
      if (ok) {
        toast.success(`Feature request status updated to ${status}`);
        loadData();
      } else {
        toast.error('Failed to update feature request');
      }
    } catch (e) {
      toast.error('Error updating feature status');
    }
  };

  const handleNoteChange = (id, value) => {
    setAdminNote(prev => ({ ...prev, [id]: value }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <MessageSquare className="w-6 h-6 mr-3 text-pink-500" /> Support & Feature Triage
          </h2>
          <p className="text-slate-400 text-sm mt-1">Review user bug reports, support tickets, and feature suggestions.</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 p-1.5 bg-slate-800/50 rounded-2xl border border-slate-700/50 w-fit">
          <button
            onClick={() => setActiveSubTab('tickets')}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
              activeSubTab === 'tickets' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Support Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveSubTab('features')}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
              activeSubTab === 'features' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Feature Suggestions ({features.length})
          </button>
        </div>
        {activeSubTab === 'tickets' && tickets.length > 0 && (
          <input
            type="text"
            placeholder="Search by email, message, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800/60 text-white border border-slate-700/50 rounded-xl px-4 py-2 text-xs w-full sm:w-72 focus:outline-none focus:border-pink-500 transition-all placeholder-slate-500 font-semibold"
          />
        )}
      </div>

      {/* List Container */}
      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 font-bold animate-pulse text-xs">Loading items...</div>
        ) : activeSubTab === 'tickets' ? (
          <div className="space-y-4">
            <h3 className="text-white font-bold mb-2">User Support Queue</h3>
            {(() => {
              const filteredTickets = tickets.filter(t => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();
                return (t.message?.toLowerCase().includes(term) || '') ||
                       (t.userEmail?.toLowerCase().includes(term) || '') ||
                       (t.userId?.toLowerCase().includes(term) || '') ||
                       (t.issueType?.toLowerCase().includes(term) || '');
              });
              return filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div key={ticket.id} className="p-5 bg-[#0f172a] rounded-2xl border border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                        ticket.issueType === 'Bug' ? 'bg-rose-500/10 text-rose-400' :
                        ticket.issueType === 'Billing' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {ticket.issueType || 'General'}
                      </span>
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                        ticket.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' : 'bg-slate-700/30 text-slate-400'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-white text-sm font-semibold whitespace-pre-wrap">{ticket.message}</p>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p><strong>From User ID:</strong> {ticket.userId}</p>
                      <p><strong>User Email:</strong> <span className="select-all text-pink-400">{ticket.userEmail}</span></p>
                      {ticket.userPhone && <p><strong>User Phone:</strong> <span className="select-all text-pink-400">{ticket.userPhone}</span></p>}
                    </div>

                    {ticket.screenshotBase64 && (
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Attached Screenshot:</span>
                        <img 
                          src={ticket.screenshotBase64} 
                          alt="Screenshot" 
                          className="max-h-40 rounded-xl border border-slate-700/80 hover:max-h-none transition-all cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Reply Input */}
                  <div className="pt-3 border-t border-slate-800/60 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Admin Note / Response</label>
                      <textarea
                        rows="2"
                        value={adminNote[ticket.id] || ticket.adminNote || ''}
                        onChange={(e) => handleNoteChange(ticket.id, e.target.value)}
                        placeholder="Add internal resolution notes or email response record..."
                        className="w-full bg-slate-800/40 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-pink-500 transition-colors resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdateTicket(ticket.id, 'Open')}
                        className="px-3.5 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" /> Save Note
                      </button>
                      <button
                        onClick={() => handleUpdateTicket(ticket.id, 'Closed')}
                        className="px-3.5 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve & Close
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 font-bold text-xs">{searchTerm ? 'No tickets match your search.' : 'No active support tickets in the queue.'}</div>
            )})()}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-white font-bold mb-2">Feature Request Board</h3>
            {features.length > 0 ? (
              features.map((feature) => (
                <div key={feature.id} className="p-5 bg-[#0f172a] rounded-2xl border border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                        feature.priority === 'High' ? 'bg-rose-500/10 text-rose-400' :
                        feature.priority === 'Low' ? 'bg-slate-700 text-slate-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {feature.priority} Priority
                      </span>
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                        feature.status === 'New' ? 'bg-blue-500/10 text-blue-400' :
                        feature.status === 'Planned' ? 'bg-amber-500/10 text-amber-400' :
                        feature.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {feature.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">{new Date(feature.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-white text-sm font-black">{feature.title}</h4>
                    <p className="text-slate-300 text-xs font-semibold whitespace-pre-wrap">{feature.description}</p>
                    <div className="text-[10px] text-slate-400 space-y-0.5 pt-1.5">
                      <p><strong>Business Type:</strong> {feature.businessType}</p>
                      <p><strong>Requestor:</strong> <span className="select-all text-pink-400">{feature.userEmail}</span></p>
                    </div>
                  </div>

                  {/* Actions & Notes */}
                  <div className="pt-3 border-t border-slate-800/60 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Admin Note / Decision Rationale</label>
                      <textarea
                        rows="2"
                        value={adminNote[feature.id] || feature.adminNote || ''}
                        onChange={(e) => handleNoteChange(feature.id, e.target.value)}
                        placeholder="Add notes about roadmap integration, feasibility, or rejection reasons..."
                        className="w-full bg-slate-800/40 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-pink-500 transition-colors resize-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => handleUpdateFeature(feature.id, 'Planned')}
                        className="px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-500/20 transition-colors"
                      >
                        📅 Mark Planned
                      </button>
                      <button
                        onClick={() => handleUpdateFeature(feature.id, 'Done')}
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-colors"
                      >
                        ✓ Mark Completed
                      </button>
                      <button
                        onClick={() => handleUpdateFeature(feature.id, 'Rejected')}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-xl hover:bg-rose-500/20 transition-colors"
                      >
                        ✗ Reject Request
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 font-bold text-xs">No active feature suggestions submitted yet.</div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SupportCenter;
