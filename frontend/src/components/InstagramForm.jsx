import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLink, FiArrowRight } from 'react-icons/fi';

function InstagramForm({ onSubmit }) {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(url);
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-2">
        <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center">
          <FiLink className="mr-2" />
          Instagram Post URL
        </label>
        
        <div className="relative">
          <motion.div
            className={`absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-blue-400 to-yellow-500 rounded-xl blur opacity-75 transition-opacity duration-300 ${
              isFocused ? 'opacity-100' : 'opacity-0'
            }`}
            animate={{ opacity: isFocused ? 0.75 : 0 }}
          />
          
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required
            placeholder="https://instagram.com/p/..."
            className="block w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-blue-400 
                     placeholder-gray-500 relative transition-all duration-300
                     backdrop-blur-sm"
          />
        </div>
      </div>

      <motion.button
        type="submit"
        className="w-full flex items-center justify-center space-x-2 
                   bg-gradient-to-r from-blue-500 to-blue-600 
                   hover:from-blue-600 hover:to-blue-700
                   text-white font-medium py-3 px-6 rounded-lg
                   transform transition-all duration-200
                   hover:scale-[1.02] active:scale-[0.98]
                   shadow-lg hover:shadow-xl
                   disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={!url}
      >
        <span>Generate Listing</span>
        <FiArrowRight className="ml-2" />
      </motion.button>

      {/* Optional: URL Preview */}
      {url && (
        <motion.div 
          className="text-sm text-gray-400 truncate px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Processing: {url}
        </motion.div>
      )}
    </motion.form>
  );
}

export default InstagramForm;