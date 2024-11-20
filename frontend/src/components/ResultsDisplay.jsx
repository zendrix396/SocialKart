import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit2, FiAlertCircle } from 'react-icons/fi';
import { storage, StorageKeys } from '../utils/storage';

function ResultsDisplay({ data, requestId }) {
  const navigate = useNavigate();

  const handleProceed = () => {
    try {
      // Store all necessary data
      storage.set(StorageKeys.LISTING_CONTENT, {
        structured_content: data.structured_content,
        raw_content: data.raw_content,
        requestId: requestId  // Store the requestId
      });
      
      storage.set(StorageKeys.LISTING_IMAGES, data.images);
      
      // Navigate with the requestId
      navigate(`/edit/${requestId}`);
    } catch (error) {
      console.error('Error storing data:', error);
      alert('Error storing data. Please try again.');
    }
  };

  if (!data) {
    return null;
  }

  if (data.error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center"
      >
        <FiAlertCircle className="text-red-500 text-xl mr-3" />
        <span className="text-red-300">Error: {data.error}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 text-center"
    >
      <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-green-400 mb-3">
          Content Generated Successfully!
        </h3>
        <p className="text-gray-300 mb-4">
          Your Amazon listing content is ready for editing and customization.
        </p>
        <button
          onClick={handleProceed}
          className="flex items-center justify-center space-x-2 mx-auto px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors"
        >
          <FiEdit2 className="text-xl" />
          <span>Proceed to Edit Listing</span>
        </button>
      </div>
    </motion.div>
  );
}

export default ResultsDisplay;