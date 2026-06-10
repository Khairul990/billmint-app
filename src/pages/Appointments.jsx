import React from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Calendar } from 'lucide-react';

const Appointments = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-24 h-24 bg-theme-accent/10 text-theme-accent rounded-[2rem] flex items-center justify-center mb-6"
      >
        <Calendar className="w-12 h-12" />
      </motion.div>
      <h1 className="text-3xl md:text-4xl font-black text-theme-primary mb-4 tracking-tight">Appointments Module</h1>
      <p className="text-sm font-bold text-theme-muted max-w-md">
        This is a placeholder for the Appointments and Scheduling module.
        In the future, you will be able to manage patient visits, bookings, and calendars here.
      </p>
    </div>
  );
};

export default Appointments;
