import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { templates } from './TemplateConfigs';

const TemplateGallery = ({ selectedTemplate, onSelectTemplate }) => {
  return (
    <div className="bg-theme-surface border border-theme-border-soft p-4 md:p-6 rounded-2xl mb-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-black text-theme-primary uppercase tracking-widest mb-1">0. Choose Template</h3>
        <p className="text-xs text-theme-secondary font-medium">Select a premium design for your invoice layout.</p>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
        {templates.map(template => {
          const isSelected = selectedTemplate === template.id;
          return (
            <motion.div 
              key={template.id}
              whileHover={{ y: -2 }}
              onClick={() => onSelectTemplate(template.id)}
              className={`min-w-[140px] max-w-[140px] rounded-xl cursor-pointer transition-all border-2 relative overflow-hidden flex flex-col bg-theme-main ${
                isSelected 
                  ? 'border-theme-accent shadow-premium-sm ring-2 ring-theme-accent/20' 
                  : 'border-theme-border-soft hover:border-theme-accent/50'
              }`}
            >
              <div className="h-[180px] bg-theme-surface-hover border-b border-theme-border-soft flex items-center justify-center p-2 relative">
                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-contain drop-shadow-sm opacity-90" />
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-theme-accent text-white flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="p-3 text-center bg-theme-surface/50 backdrop-blur-sm flex-1 flex items-center justify-center">
                <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-theme-accent' : 'text-theme-secondary'}`}>
                  {template.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateGallery;
