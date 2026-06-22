import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const StaggerList = ({ items, renderItem, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {items.map((item, index) => (
        <motion.div key={item.id ?? index} variants={staggerItem}>
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StaggerList;
