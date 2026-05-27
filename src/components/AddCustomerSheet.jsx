import React, { useState } from 'react';
import BottomSheet from './BottomSheet';
import { Save, User, Phone, MapPin, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AddCustomerSheet = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Customer name is required.');
      return;
    }
    
    const customer = {
      id: 'cust-' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      createdAt: new Date().toISOString()
    };
    
    onSave(customer);
    toast.success('Customer added successfully!');
    
    // Reset form
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add New Customer">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-theme-muted mb-1 flex items-center gap-1">
            <User className="w-3 h-3" /> Customer Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary dark:text-theme-primary focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent outline-none transition-all"
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-theme-muted mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3" /> Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary dark:text-theme-primary focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent outline-none transition-all"
            placeholder="WhatsApp ready number"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-theme-muted mb-1 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary dark:text-theme-primary focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent outline-none transition-all"
            placeholder="client@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-theme-muted mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Billing Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows="2"
            className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary dark:text-theme-primary focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent outline-none transition-all leading-relaxed text-xs"
            placeholder="123 Street, City..."
          />
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 font-black rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all text-sm"
          >
            <Save className="w-4 h-4" /> Save Customer
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default AddCustomerSheet;
