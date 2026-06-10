import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const Orders = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-24 h-24 bg-theme-accent/10 text-theme-accent rounded-[2rem] flex items-center justify-center mb-6"
      >
        <ShoppingBag className="w-12 h-12" />
      </motion.div>
      <h1 className="text-3xl md:text-4xl font-black text-theme-primary mb-4 tracking-tight">Orders Module</h1>
      <p className="text-sm font-bold text-theme-muted max-w-md">
        This is a placeholder for the Orders Management module.
        In the future, you will be able to track incoming orders, fulfillment, and shipments here.
      </p>
    </div>
  );
};

export default Orders;
