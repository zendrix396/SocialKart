import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLink } from 'react-icons/fi';
import ProductForm from './ProductForm';

function InstagramForm({ onSubmit }) {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState('url'); 

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    onSubmit({ type: 'url', data: url });
  };

  const handleProductSubmit = (productName) => {
    onSubmit({ type: 'product', data: productName });
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex space-x-4 justify-center mb-6">
        <button
          onClick={() => setMode('url')}
          className={`px-4 py-2 rounded-lg transition-all ${
            mode === 'url'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Instagram URL
        </button>
        <button
          onClick={() => setMode('product')}
          className={`px-4 py-2 rounded-lg transition-all ${
            mode === 'product'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Product Search
        </button>
      </div>

      {/* Form Content */}
      {mode === 'url' ? (
        <motion.form
          onSubmit={handleUrlSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <FiLink className="mr-2" />
              Instagram Post URL
            </label>
            
            <div className="relative">
              <motion.div
                className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 
                           rounded-xl blur opacity-75 transition-opacity duration-300 ${
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
                className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                         placeholder-gray-400 relative transition-all duration-300
                         shadow-sm"
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
                     shadow-md hover:shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!url}
          >
            <span>Generate Listing</span>
          </motion.button>
        </motion.form>
      ) : (
        <ProductForm onSubmit={handleProductSubmit} />
      )}
    </div>
  );
}

export default InstagramForm;