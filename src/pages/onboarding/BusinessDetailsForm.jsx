import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { Upload, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BusinessDetailsForm = () => {
  const { onboardingData, updateData, nextStep, prevStep } = useOnboarding();
  const [formData, setFormData] = useState(onboardingData.businessDetails);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setFormData({ ...formData, logoUrl: event.target.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.businessName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    updateData('businessDetails', formData);
    nextStep();
  };

  return (
    <div className="flex items-center justify-center p-4">
      <motion.div className="max-w-3xl w-full bg-theme-card border border-theme-border-soft rounded-3xl shadow-premium p-6 md:p-10">
        <div className="mb-8">
          <span className="text-[10px] bg-theme-accent/10 text-theme-accent px-3 py-1 rounded-full uppercase tracking-wider font-extrabold mb-3 inline-block">Step 2 of 5</span>
          <h2 className="text-2xl font-black text-theme-primary">Tell us about your business</h2>
          <p className="text-sm font-semibold text-theme-muted mt-1">This information will appear on your invoices.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Shop or Company Name"
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">Your Full Name</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">Phone Number *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Primary Contact Number"
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">WhatsApp (Optional)</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="Same as phone if left blank"
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">Business Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Full address for invoice"
                rows="2"
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">Experience Level *</label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold"
              >
                <option value="beginner">Beginner (নতুন - "First time using")</option>
                <option value="intermediate">Intermediate (মধ্যম - "I know a bit")</option>
                <option value="expert">Expert (এক্সপার্ট - "I know everything")</option>
              </select>
            </div>

            {/* Logo Upload */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">Shop Logo (Optional)</label>
              {!formData.logoUrl ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${isDragging ? 'border-theme-accent bg-theme-accent/5' : 'border-theme-border-soft bg-theme-surface'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleLogoUpload(e); }}
                >
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload className="w-6 h-6 text-theme-muted mx-auto mb-2" />
                  <span className="text-xs font-bold text-theme-muted">Drag & drop logo, or click to upload</span>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-theme-surface p-3 rounded-xl border border-theme-border-soft">
                  <img src={formData.logoUrl} alt="Logo" className="h-12 w-auto object-contain rounded-lg bg-white p-1" />
                  <span className="text-xs font-bold text-theme-muted flex-1">Logo Uploaded</span>
                  <button type="button" onClick={() => setFormData({ ...formData, logoUrl: '' })} className="text-red-500 text-xs font-bold uppercase hover:underline">Remove</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-theme-border-soft mt-6">
            <button type="button" onClick={prevStep} className="px-6 py-3 rounded-xl font-bold text-theme-muted bg-theme-surface hover:bg-theme-app dark:hover:bg-theme-surface transition-colors flex items-center gap-2 text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button type="submit" className="px-8 py-3 rounded-xl font-black text-white bg-[image:var(--accent-gradient)] shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2 text-sm uppercase tracking-wider">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default BusinessDetailsForm;
