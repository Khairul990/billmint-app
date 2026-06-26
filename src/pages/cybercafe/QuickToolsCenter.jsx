import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Scissors, FileText, FileDown, Lock, Code, Crop } from 'lucide-react';

const TOOLS = [
  { id: 'passport-photo', name: 'Passport Photo Maker', icon: Crop, desc: 'Auto-crop and generate A4 print sheets', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'bg-remove', name: 'AI Background Remove', icon: Scissors, desc: 'One-click background removal for photos', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 'pdf-merge', name: 'PDF Merge & Split', icon: FileText, desc: 'Combine or separate PDF pages easily', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'img-compress', name: 'Image Compressor', icon: FileDown, desc: 'Reduce file size for online forms', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
];

export default function QuickToolsCenter() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-7xl mx-auto pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-theme-primary tracking-tight mb-2">Quick Tools Center</h1>
        <p className="text-theme-muted font-medium">Daily productivity utilities optimized for speed.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => alert('Tool interface launching soon...')}
            className="text-left bg-theme-card border border-theme-border-soft p-5 rounded-2xl hover:border-theme-accent hover:shadow-lg transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${tool.color}`}>
              <tool.icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-theme-primary mb-2 group-hover:text-theme-accent transition-colors">{tool.name}</h3>
            <p className="text-xs font-medium text-theme-muted leading-relaxed">{tool.desc}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
