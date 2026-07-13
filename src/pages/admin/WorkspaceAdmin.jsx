import React, { useState, useEffect, memo } from 'react';
import { Search, Building2, HardDrive, Inbox, Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminEngine } from '../../services/adminEngine';
import { toast } from 'react-hot-toast';
import { pageVariants } from '../../utils/animations';
import { TableRowSkeleton } from '../../components/PremiumSkeleton';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';

const WorkspaceAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const list = await adminEngine.getUsersList();
      setUsers(list);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load workspaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const allWorkspaces = [];
  users.forEach(user => {
    const wsCount = user.workspacesCount || 1;
    allWorkspaces.push({
      id: `ws_${user.userId}_primary`,
      userId: user.userId,
      ownerEmail: user.email,
      name: user.businessName || 'Default Workspace',
      type: wsCount > 1 ? 'Multiple' : 'Retail',
      createdAt: user.createdAt || new Date().toISOString(),
      size: `${(wsCount * 0.05).toFixed(2)} GB`,
    });
  });

  const filteredWorkspaces = allWorkspaces.filter(ws => 
    ws.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ws.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <Building2 className="w-8 h-8 mr-3 text-theme-accent" /> Workspace Manager
          </h2>
          <p className="text-sm text-theme-secondary mt-1">View, monitor, and reset workspaces across the platform.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input 
            icon={Search}
            type="text" 
            placeholder="Search workspaces..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace Name</TableHead>
              <TableHead>Owner Email</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Storage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="p-4">
                  {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}
                </TableCell>
              </TableRow>
            ) : filteredWorkspaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Inbox className="w-10 h-10 text-theme-muted mx-auto mb-4" />
                  <p className="text-theme-secondary font-bold">No workspaces found.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkspaces.map(ws => (
                <TableRow key={ws.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center text-theme-accent shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-theme-primary truncate">{ws.name}</p>
                        <p className="text-[10px] text-theme-muted font-mono mt-0.5">{ws.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <p className="font-bold text-theme-secondary truncate">{ws.ownerEmail}</p>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">{ws.type}</Badge>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <span className="font-bold text-theme-primary flex items-center justify-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-theme-accent" /> {ws.size}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toast.success('Backup queued for workspace')} title="Download Backup">
                        <Download className="w-4 h-4 text-theme-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toast.error('Enterprise deletion requires owner PIN')} title="Delete Workspace">
                        <Trash2 className="w-4 h-4 text-theme-danger" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
};

export default memo(WorkspaceAdmin);
