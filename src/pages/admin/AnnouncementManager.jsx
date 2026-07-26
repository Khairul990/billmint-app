import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, AlertTriangle, Info, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminEngine } from '../../services/adminEngine';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea, Label } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info', // 'info', 'warning', 'maintenance', 'update'
    active: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await adminEngine.getAnnouncements();
      setAnnouncements(list);
    } catch (e) {
      toast.error('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }
    
    try {
      const ann = await adminEngine.createAnnouncement(
        formData.title,
        formData.message,
        formData.type,
        formData.active,
        formData.startDate,
        formData.endDate
      );
      if (ann) {
        toast.success('Announcement published!');
        setIsCreating(false);
        setFormData({
          title: '',
          message: '',
          type: 'info',
          active: true,
          startDate: new Date().toISOString().split('T')[0],
          endDate: ''
        });
        loadData();
      }
    } catch (e) {
      toast.error('Error creating announcement');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await adminEngine.toggleAnnouncement(id, !currentStatus);
      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadData();
    } catch (e) {
      toast.error('Error toggling announcement status');
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'maintenance': return <ShieldAlert className="w-5 h-5 text-theme-danger" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-theme-warning" />;
      case 'update': return <Megaphone className="w-5 h-5 text-theme-success" />;
      default: return <Info className="w-5 h-5 text-theme-accent" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <Megaphone className="w-8 h-8 mr-3 text-theme-accent" /> Announcements
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Broadcast messages to all users or trigger global maintenance mode.</p>
        </div>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          variant={isCreating ? 'outline' : 'primary'}
          leftIcon={isCreating ? null : Plus}
        >
          {isCreating ? 'Cancel' : 'New Broadcast'}
        </Button>
      </div>

      {isCreating && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
          <Card className="border-theme-accent/30 shadow-glass">
            <CardContent className="p-6">
              <h3 className="font-bold text-theme-primary mb-6">Create New Broadcast</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label>Title</Label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Scheduled Maintenance"
                  />
                </div>
                <div>
                  <Label>Broadcast Type</Label>
                  <Select
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="info">Info / News</option>
                    <option value="update">Platform Update</option>
                    <option value="warning">Warning / Alert</option>
                    <option value="maintenance">Global Maintenance (Locks App)</option>
                  </Select>
                </div>
              </div>
              
              <div className="mb-6">
                <Label>Message Body</Label>
                <Textarea
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  placeholder="Enter the broadcast message..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-8">
                <Switch 
                  checked={formData.active} 
                  onChange={(val) => setFormData({...formData, active: val})}
                />
                <span className="text-sm font-bold text-theme-primary">Activate Immediately</span>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleCreate} variant="primary">
                  Publish Broadcast
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <Card className="flex justify-center p-12 border-transparent">
            <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
          </Card>
        ) : announcements.length === 0 ? (
          <Card className="text-center p-12 border-transparent shadow-glass">
            <Megaphone className="w-12 h-12 text-theme-muted mx-auto mb-4" />
            <p className="text-theme-secondary font-bold">No broadcasts yet</p>
          </Card>
        ) : (
          announcements.map((ann) => (
            <Card key={ann.id} className="border-transparent flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-5 hover:bg-theme-surface-hover transition-colors">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  ann.type === 'maintenance' ? 'bg-theme-danger/10' : 
                  ann.type === 'warning' ? 'bg-theme-warning/10' : 
                  ann.type === 'update' ? 'bg-theme-success/10' : 'bg-theme-accent/10'
                }`}>
                  {getIconForType(ann.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-theme-primary text-base">{ann.title}</h3>
                    <Badge variant={ann.active ? 'success' : 'outline'}>
                      {ann.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-theme-secondary text-sm font-semibold mb-2">{ann.message}</p>
                  <p className="text-[10px] text-theme-muted font-bold">
                    Start: {ann.startDate || 'N/A'} {ann.endDate && ` • End: ${ann.endDate}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => handleToggleActive(ann.id, ann.active)}
                  variant={ann.active ? 'outline' : 'primary'}
                  className={ann.active ? '' : 'bg-theme-success border-theme-success'}
                  size="sm"
                >
                  {ann.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default memo(AnnouncementManager);
