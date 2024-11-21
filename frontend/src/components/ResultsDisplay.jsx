import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { storage, StorageKeys } from '../utils/storage';

function ResultsDisplay({ data, requestId }) {
  const navigate = useNavigate();

  const handleProceed = () => {
    try {
      storage.set(StorageKeys.LISTING_CONTENT, {
        structured_content: data.structured_content,
        raw_content: data.raw_content,
        requestId: requestId
      });
      
      storage.set(StorageKeys.LISTING_IMAGES, data.images);
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
        className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center shadow-sm"
      >
        <FiAlertCircle className="text-red-500 text-xl mr-3 flex-shrink-0" />
        <span className="text-red-600">Error: {data.error}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"
        >
          <FiCheckCircle className="text-3xl text-green-500" />
        </motion.div>

        <h3 className="text-2xl font-semibold text-gray-800 mb-3">
          Content Generated Successfully!
        </h3>
        
        <p className="text-gray-600 mb-6">
          Your Amazon listing content is ready for editing and customization.
          Click below to proceed to the editor.
        </p>

        <motion.button
          onClick={handleProceed}
          className="flex items-center justify-center space-x-2 mx-auto px-8 py-3 
                     bg-gradient-to-r from-blue-500 to-blue-600 
                     hover:from-blue-600 hover:to-blue-700
                     rounded-lg text-white font-medium 
                     transition-all duration-200
                     shadow-md hover:shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiEdit2 className="text-xl" />
          <span>Proceed to Edit Listing</span>
        </motion.button>

        <div className="mt-6 text-sm text-gray-500 text-center">
          You can customize all aspects of your listing in the next step
        </div>
      </div>

      {/* Optional: Additional Information Cards */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <motion.div 
          className="p-4 bg-blue-50 rounded-lg border border-blue-100"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="font-medium text-blue-800 mb-2">Next Steps</h4>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• Review product details</li>
            <li>• Customize descriptions</li>
            <li>• Select product images</li>
          </ul>
        </motion.div>

        <motion.div 
          className="p-4 bg-purple-50 rounded-lg border border-purple-100"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="font-medium text-purple-800 mb-2">Available Features</h4>
          <ul className="text-sm text-purple-600 space-y-1">
            <li>• Rich text editor</li>
            <li>• Image management</li>
            <li>• Preview functionality</li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ResultsDisplay;