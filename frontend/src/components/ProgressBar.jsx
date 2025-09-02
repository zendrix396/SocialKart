import React from 'react';
import { motion } from 'framer-motion';

function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      <motion.div
        className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </div>
  );
}

export default ProgressBar;