import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Unicode-safe base64 encoding
const unicodeBase64Encode = (str) => {
  // Convert string to UTF-8 bytes, then to base64
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
};

function ResultsDisplay({ data, backendUrl }) {
  if (!data) {
    return null;
  }
  
  if (data.error) {
    return (
      <div className="mt-8 p-4 bg-red-100 text-red-700 rounded-lg">
        <p className="font-bold">An error occurred:</p>
        <p>{data.error}</p>
      </div>
    );
  }

  const { structured_content = {}, images = [] } = data || {};
  
  return (
    <motion.div 
      className="mt-8 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3 className="text-2xl font-bold text-gray-800">Generated Listing</h3>
      
      {/* Image Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
        {images && images.map((imgSrc, index) => (
          <motion.div
            key={index}
            className="rounded-lg overflow-hidden shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            <img src={`${backendUrl}${imgSrc}`} alt={`Product ${index + 1}`} className="w-full h-full object-cover"/>
          </motion.div>
        ))}
      </div>

      {/* Structured Content */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h4 className="text-xl font-semibold mb-2">{structured_content.product_name || 'Untitled Product'}</h4>
        <p className="text-gray-600 mb-4">{structured_content.description || ''}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-semibold text-gray-700">Key Features:</h5>
            <ul className="list-disc list-inside text-gray-600">
              {structured_content.key_features && structured_content.key_features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-gray-700">SEO Keywords:</h5>
            <div className="flex flex-wrap gap-2 mt-2">
              {structured_content.seo_keywords && structured_content.seo_keywords.map((keyword, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <Link 
        to={`/edit/${unicodeBase64Encode(JSON.stringify(data))}`}
        className="block w-full text-center bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors"
      >
        Edit & Refine Listing
      </Link>
    </motion.div>
  );
}

export default ResultsDisplay;