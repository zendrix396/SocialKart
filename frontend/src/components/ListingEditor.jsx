import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiEye } from 'react-icons/fi';
import { storage, StorageKeys } from '../utils/storage';

function ListingEditor() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [availableImages, setAvailableImages] = useState([]); // Add this state
  const maxImages = 5;

  useEffect(() => {
    try {
      const storedContent = storage.get(StorageKeys.LISTING_CONTENT);
      const storedImages = storage.get(StorageKeys.LISTING_IMAGES);

      if (!storedContent || !storedContent.requestId) {
        navigate('/');
        return;
      }

      setContent({
        ...storedContent.structured_content,
        price: storedContent.structured_content.price || 'XX.XX' 
      });
      setAvailableImages(storedImages || []);
      setSelectedImages([]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      navigate('/');
    }
  }, [navigate]);

  const handleSave = () => {
    try {
      storage.set(StorageKeys.LISTING_CONTENT, {
        structured_content: content,
        requestId: requestId
      });
      storage.set(StorageKeys.LISTING_IMAGES, selectedImages);

      navigate(`/preview/${requestId}`);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving changes. Please try again.');
    }
  };

  if (loading || !content) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-4xl mx-auto p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Product Listing</h2>
        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-yellow-800">Important Notes:</h3>
          <ul className="list-disc list-inside text-yellow-700">
            <li>Avoid making medical claims</li>
            <li>Use factual, verifiable information only</li>
            <li>Follow Amazon's restricted keywords policy</li>
            <li>Maintain professional language</li>
          </ul>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">Product Title</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => setContent({...content, title: e.target.value})}
          maxLength={200}
          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-800"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">Price</label>
        <div className="flex items-center">
          <span className="text-gray-700 mr-2">$</span>
          <input
            type="text"
            value={content.price}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, '');
              setContent({...content, price: value});
            }}
            placeholder="XX.XX"
            className="w-32 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-800"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">Key Features</label>
        {content.key_features.map((feature, index) => (
          <input
            key={index}
            type="text"
            value={feature}
            onChange={(e) => {
              const newFeatures = [...content.key_features];
              newFeatures[index] = e.target.value;
              setContent({...content, key_features: newFeatures});
            }}
            className="w-full p-2 rounded-lg border border-gray-300 mb-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-800"
          />
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
        <textarea
          value={content.description}
          onChange={(e) => setContent({...content, description: e.target.value})}
          rows={6}
          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-800"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">Technical Details</label>
        {Object.entries(content.technical_details).map(([key, value], index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={key}
              onChange={(e) => {
                const newDetails = { ...content.technical_details };
                const oldValue = newDetails[key];
                delete newDetails[key];
                newDetails[e.target.value] = oldValue;
                setContent({ ...content, technical_details: newDetails });
              }}
              className="w-1/3 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-800"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const newDetails = { ...content.technical_details };
                newDetails[key] = e.target.value;
                setContent({ ...content, technical_details: newDetails });
              }}
              className="w-2/3 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-800"
            />
          </div>
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">Search Terms</label>
        {content.search_terms.map((term, index) => (
          <input
            key={index}
            type="text"
            value={term}
            onChange={(e) => {
              const newTerms = [...content.search_terms];
              newTerms[index] = e.target.value;
              setContent({...content, search_terms: newTerms});
            }}
            className="w-full p-2 rounded-lg border border-gray-300 mb-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-800"
          />
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Select Images (max {maxImages})
        </label>
        <div className="grid grid-cols-4 gap-4">
          {availableImages.map((img, index) => (
            <motion.div
              key={index}
              className={`relative cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow
                ${selectedImages.includes(img) ? 'ring-2 ring-blue-500' : ''}`}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                if (selectedImages.includes(img)) {
                  setSelectedImages(selectedImages.filter(i => i !== img));
                } else if (selectedImages.length < maxImages) {
                  setSelectedImages([...selectedImages, img]);
                }
              }}
            >
              <img
                src={`data:image/png;base64,${img}`}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {selectedImages.includes(img) && (
                <motion.div 
                  className="absolute top-2 right-2 bg-blue-500 rounded-full p-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <FiCheck className="text-white" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button
        onClick={handleSave}
        className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium
                   hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg
                   flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FiEye className="mr-2" />
        Preview Listing
      </motion.button>
    </motion.div>
  );
}

export default ListingEditor;