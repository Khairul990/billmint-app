import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, QrCode, Search, Copy, CheckCircle, Smartphone, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { customerEngine } from '../services/customerEngine';
import ClassicLoader from '../components/ClassicLoader';
import { pageVariants } from '../utils/animations';

export default function CustomerPortalConfig() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const fetched = await customerEngine.getCustomers();
        setCustomers(fetched || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  const generalPortalLink = `${window.location.origin}/customer`;
  const specificPortalLink = selectedCustomer ? `${window.location.origin}/customer/${selectedCustomer.customerId || selectedCustomer.id}` : '';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.customerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  if (loading) {
    return <div className="p-8 flex justify-center"><ClassicLoader /></div>;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      className="max-w-4xl mx-auto space-y-6 pb-20"
    >
      <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[image:var(--accent-gradient)] rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-theme-primary tracking-tight">Customer Portal</h1>
            <p className="text-theme-muted font-medium text-sm">Manage access and share secure portal links with your customers.</p>
          </div>
        </div>

        {/* General Portal Link */}
        <div className="bg-theme-surface rounded-2xl border border-theme-border-soft p-5 mb-8">
          <h3 className="text-sm font-bold text-theme-primary mb-1">General Portal Link</h3>
          <p className="text-xs text-theme-muted mb-4">Share this universal link on your website or social media. Customers will need to enter their Customer ID and Phone Number to verify.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-theme-main border border-theme-border-soft rounded-xl px-4 py-3 font-mono text-sm text-theme-primary flex items-center overflow-x-auto whitespace-nowrap">
              {generalPortalLink}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(generalPortalLink)}
                className="flex items-center gap-2 px-4 py-3 bg-theme-surface hover:bg-theme-accent/10 border border-theme-border-soft rounded-xl font-bold transition-colors whitespace-nowrap"
              >
                {copiedLink ? <CheckCircle className="w-4 h-4 text-theme-success" /> : <Copy className="w-4 h-4" />}
                Copy
              </button>
              <a
                href={generalPortalLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center px-4 py-3 bg-[image:var(--accent-gradient)] hover:opacity-90 text-white rounded-xl font-bold transition-colors shadow-lg"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Specific Customer Portal */}
        <h3 className="text-lg font-black text-theme-primary mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-theme-accent" /> Generate Direct Customer Link
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer Selection */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                placeholder="Search by name, ID or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-theme-accent"
              />
            </div>
            
            <div className="bg-theme-surface border border-theme-border-soft rounded-xl overflow-y-auto max-h-[300px]">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-theme-muted text-sm font-bold">No customers found.</div>
              ) : (
                filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`w-full text-left p-4 border-b border-theme-border-soft last:border-0 hover:bg-theme-accent/5 transition-colors flex justify-between items-center ${selectedCustomer?.id === customer.id ? 'bg-theme-accent/10 border-l-4 border-l-theme-accent' : ''}`}
                  >
                    <div>
                      <div className="font-bold text-theme-primary">{customer.name}</div>
                      <div className="text-xs text-theme-muted font-mono">{customer.customerId || customer.id}</div>
                    </div>
                    {selectedCustomer?.id === customer.id && <CheckCircle className="w-5 h-5 text-theme-accent" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Direct Link & QR Code */}
          <div>
            {selectedCustomer ? (
              <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-6 h-full flex flex-col items-center text-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 inline-block">
                  <QRCodeSVG 
                    value={specificPortalLink} 
                    size={160}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: "/billqyro-icon.png",
                      x: undefined,
                      y: undefined,
                      height: 32,
                      width: 32,
                      excavate: true,
                    }}
                  />
                </div>
                
                <h4 className="font-black text-theme-primary mb-1">{selectedCustomer.name}</h4>
                <p className="text-xs text-theme-muted font-mono mb-6">{selectedCustomer.customerId || selectedCustomer.id}</p>
                
                <div className="w-full bg-theme-main border border-theme-border-soft rounded-xl px-3 py-2 font-mono text-xs text-theme-muted truncate mb-4">
                  {specificPortalLink}
                </div>
                
                <div className="flex gap-2 w-full mt-auto">
                  <button
                    onClick={() => copyToClipboard(specificPortalLink)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-theme-main hover:bg-theme-accent/10 border border-theme-border-soft text-theme-primary rounded-xl font-bold transition-all"
                  >
                    <Copy className="w-4 h-4" /> Copy Link
                  </button>
                  <a
                    href={specificPortalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[image:var(--accent-gradient)] hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" /> Open
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-theme-surface border border-theme-border-soft border-dashed rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center opacity-70">
                <QrCode className="w-12 h-12 text-theme-muted mb-4" />
                <h4 className="font-bold text-theme-primary mb-2">Select a Customer</h4>
                <p className="text-xs text-theme-muted">Select a customer from the list to generate their direct portal link and QR code.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
