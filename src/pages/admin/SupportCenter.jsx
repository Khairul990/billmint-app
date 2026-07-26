import { useState, useEffect, memo } from 'react';
import { CheckCircle2, Clock, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminEngine } from '../../services/adminEngine';

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
        const ticketList = await adminEngine.getSupportTickets();
        setTickets(ticketList);
      } else {
        const featureList = await adminEngine.getFeatureRequests();
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
      const ok = await adminEngine.updateSupportTicket(ticketId, status, note);
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
      const ok = await adminEngine.updateFeatureRequest(requestId, status, note);
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-theme-accent" /> Support & Feature Triage
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Review user bug reports, support tickets, and feature suggestions.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-theme-surface-elevated p-2 rounded-xl border border-theme-border-soft">
        <div className="flex gap-2">
          <Button
            variant={activeSubTab === 'tickets' ? 'primary' : 'ghost'}
            onClick={() => setActiveSubTab('tickets')}
            className={activeSubTab === 'tickets' ? 'shadow-glass' : ''}
            size="sm"
          >
            Support Tickets ({tickets.length})
          </Button>
          <Button
            variant={activeSubTab === 'features' ? 'primary' : 'ghost'}
            onClick={() => setActiveSubTab('features')}
            className={activeSubTab === 'features' ? 'shadow-glass' : ''}
            size="sm"
          >
            Feature Suggestions ({features.length})
          </Button>
        </div>
        {activeSubTab === 'tickets' && tickets.length > 0 && (
          <div className="w-full sm:w-72">
            <Input
              icon={Search}
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <Card className="border-transparent">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
            </div>
          ) : activeSubTab === 'tickets' ? (
            <div className="space-y-4">
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
                    <div key={ticket.id} className="p-5 bg-theme-surface-hover rounded-2xl border border-theme-border-soft space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border-soft pb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            ticket.issueType === 'Bug' ? 'danger' :
                            ticket.issueType === 'Billing' ? 'warning' : 'primary'
                          }>
                            {ticket.issueType || 'General'}
                          </Badge>
                          <Badge variant={ticket.status === 'Open' ? 'success' : 'outline'}>
                            {ticket.status}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-theme-muted font-bold">{new Date(ticket.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-theme-primary text-sm font-semibold whitespace-pre-wrap">{ticket.message}</p>
                        <div className="text-xs text-theme-secondary space-y-1">
                          <p><strong>From User ID:</strong> {ticket.userId}</p>
                          <p><strong>User Email:</strong> <span className="select-all text-theme-accent">{ticket.userEmail}</span></p>
                          {ticket.userPhone && <p><strong>User Phone:</strong> <span className="select-all text-theme-accent">{ticket.userPhone}</span></p>}
                        </div>

                        {ticket.screenshotBase64 && (
                          <div className="pt-2">
                            <span className="text-[10px] text-theme-muted font-bold block mb-1">Attached Screenshot:</span>
                            <img 
                              src={ticket.screenshotBase64} 
                              alt="Screenshot" 
                              className="max-h-40 rounded-xl border border-theme-border-soft hover:max-h-none transition-all cursor-pointer shadow-sm"
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-theme-border-soft space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-theme-muted mb-1.5">Admin Note / Response</label>
                          <textarea
                            rows="2"
                            value={adminNote[ticket.id] || ticket.adminNote || ''}
                            onChange={(e) => handleNoteChange(ticket.id, e.target.value)}
                            placeholder="Add internal resolution notes or email response record..."
                            className="w-full bg-theme-main border border-theme-border-soft rounded-xl p-3 text-theme-primary text-xs focus:outline-none focus:border-theme-accent transition-colors resize-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleUpdateTicket(ticket.id, 'Open')}
                            variant="outline"
                            size="sm"
                            leftIcon={Clock}
                          >
                            Save Note
                          </Button>
                          <Button
                            onClick={() => handleUpdateTicket(ticket.id, 'Closed')}
                            variant="outline"
                            className="border-theme-success text-theme-success hover:bg-theme-success/10"
                            size="sm"
                            leftIcon={CheckCircle2}
                          >
                            Resolve & Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-theme-muted font-bold text-xs">{searchTerm ? 'No tickets match your search.' : 'No active support tickets in the queue.'}</div>
                )})()}
            </div>
          ) : (
            <div className="space-y-4">
              {features.length > 0 ? (
                features.map((feature) => (
                  <div key={feature.id} className="p-5 bg-theme-surface-hover rounded-2xl border border-theme-border-soft space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border-soft pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          feature.priority === 'High' ? 'danger' :
                          feature.priority === 'Low' ? 'outline' : 'primary'
                        }>
                          {feature.priority} Priority
                        </Badge>
                        <Badge variant={
                          feature.status === 'New' ? 'primary' :
                          feature.status === 'Planned' ? 'warning' :
                          feature.status === 'Done' ? 'success' : 'danger'
                        }>
                          {feature.status}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-theme-muted font-bold">{new Date(feature.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-theme-primary text-sm font-black">{feature.title}</h4>
                      <p className="text-theme-secondary text-xs font-semibold whitespace-pre-wrap">{feature.description}</p>
                      <div className="text-[10px] text-theme-muted space-y-0.5 pt-1.5">
                        <p><strong>Business Type:</strong> {feature.businessType}</p>
                        <p><strong>Requestor:</strong> <span className="select-all text-theme-accent">{feature.userEmail}</span></p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-theme-border-soft space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-theme-muted mb-1.5">Admin Note / Decision Rationale</label>
                        <textarea
                          rows="2"
                          value={adminNote[feature.id] || feature.adminNote || ''}
                          onChange={(e) => handleNoteChange(feature.id, e.target.value)}
                          placeholder="Add notes about roadmap integration, feasibility, or rejection reasons..."
                          className="w-full bg-theme-main border border-theme-border-soft rounded-xl p-3 text-theme-primary text-xs focus:outline-none focus:border-theme-accent transition-colors resize-none"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          onClick={() => handleUpdateFeature(feature.id, 'Planned')}
                          variant="outline"
                          className="border-theme-warning text-theme-warning hover:bg-theme-warning/10"
                          size="sm"
                        >
                          📅 Mark Planned
                        </Button>
                        <Button
                          onClick={() => handleUpdateFeature(feature.id, 'Done')}
                          variant="outline"
                          className="border-theme-success text-theme-success hover:bg-theme-success/10"
                          size="sm"
                        >
                          ✓ Mark Completed
                        </Button>
                        <Button
                          onClick={() => handleUpdateFeature(feature.id, 'Rejected')}
                          variant="outline"
                          className="border-theme-danger text-theme-danger hover:bg-theme-danger/10"
                          size="sm"
                        >
                          ✗ Reject Request
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-theme-muted font-bold text-xs">No active feature suggestions submitted yet.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default memo(SupportCenter);
