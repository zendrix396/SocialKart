import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiEye, FiEdit2, FiDollarSign, FiList, FiTag, FiImage, FiInfo, FiBox } from 'react-icons/fi';
import { storage, StorageKeys } from '../utils/storage';
function EditableField({ label, icon: Icon, value, onChange, type = "text", placeholder = "", className = "", multiline = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleBlur = () => {
    if (!isEditing) return;
    setIsEditing(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Icon className="text-gray-500 mr-2" />
          <label className="text-sm font-medium text-gray-700">{label}</label>
        </div>
        <button
          onClick={handleEditClick}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FiEdit2 className={`w-4 h-4 ${isEditing ? 'text-blue-500' : 'text-gray-400'}`} />
        </button>
      </div>
      
      {multiline ? (
        <textarea
          ref={inputRef}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={6}
          disabled={!isEditing}
          className={`w-full p-3 rounded-lg border transition-all duration-200
            ${isEditing 
              ? 'border-blue-400 ring-2 ring-blue-400 bg-white' 
              : 'border-gray-200 bg-gray-50 cursor-default'
            } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            disabled:opacity-75 disabled:cursor-not-allowed`}
        />
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={!isEditing}
          className={`w-full p-3 rounded-lg border transition-all duration-200
            ${isEditing 
              ? 'border-blue-400 ring-2 ring-blue-400 bg-white' 
              : 'border-gray-200 bg-gray-50 cursor-default'
            } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            disabled:opacity-75 disabled:cursor-not-allowed`}
        />
      )}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-2 right-0 bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-md"
        >
          Editing...
        </motion.div>
      )}
    </div>
  );
}

function EditableFeature({ feature, onChange, index }) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className="relative group">
      <div className="flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={feature}
          onChange={onChange}
          disabled={!isEditing}
          className={`w-full p-3 rounded-lg border transition-all duration-200
            ${isEditing 
              ? 'border-blue-400 ring-2 ring-blue-400 bg-white' 
              : 'border-gray-200 bg-gray-50 cursor-default'
            } disabled:opacity-75 disabled:cursor-not-allowed`}
          placeholder={`Feature ${index + 1}`}
        />
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute right-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FiEdit2 className={`w-4 h-4 ${isEditing ? 'text-blue-500' : 'text-gray-400'}`} />
        </button>
      </div>
    </div>
  );
}

function EditableTechnicalDetail({ keyName, value, onKeyChange, onValueChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const keyInputRef = useRef(null);

  useEffect(() => {
    if (isEditing && keyInputRef.current) {
      keyInputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className="flex gap-3 group relative">
      <input
        ref={keyInputRef}
        type="text"
        value={keyName}
        onChange={onKeyChange}
        disabled={!isEditing}
        className={`w-1/3 p-3 rounded-lg border transition-all duration-200
          ${isEditing 
            ? 'border-blue-400 ring-2 ring-blue-400 bg-white' 
            : 'border-gray-200 bg-gray-50 cursor-default'
          } disabled:opacity-75 disabled:cursor-not-allowed`}
        placeholder="Specification"
      />
      <input
        type="text"
        value={value}
        onChange={onValueChange}
        disabled={!isEditing}
        className={`flex-1 p-3 rounded-lg border transition-all duration-200
          ${isEditing 
            ? 'border-blue-400 ring-2 ring-blue-400 bg-white' 
            : 'border-gray-200 bg-gray-50 cursor-default'
          } disabled:opacity-75 disabled:cursor-not-allowed`}
        placeholder="Value"
      />
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="absolute right-2 top-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <FiEdit2 className={`w-4 h-4 ${isEditing ? 'text-blue-500' : 'text-gray-400'}`} />
      </button>
    </div>
  );
}

function ListingEditor() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [availableImages, setAvailableImages] = useState([]);
  const maxSelectableImages = 30; // Allow up to 30 images to be selected

  useEffect(() => {
    try {
      const decodedData = JSON.parse(atob(requestId));
      
      const { structured_content, images } = decodedData;

      if (!structured_content) {
        navigate('/');
        return;
      }

      setContent({
        title: structured_content.product_name || '',
        description: structured_content.description || '',
        key_features: structured_content.key_features || [],
        details: structured_content.technical_details || structured_content.service_details || structured_content.nutritional_info || {},
        target_audience: structured_content.target_audience || '',
        seo_keywords: structured_content.seo_keywords || [],
        price: structured_content.price || 'XXXX.XX'
      });
      
      // The images are now full URLs from the backend
      setAvailableImages(images || []);
      // Pre-select the top 5 images by default for convenience
      setSelectedImages(images.slice(0, 5) || []);
      setLoading(false);

    } catch (error) {
      console.error('Error loading data:', error);
      navigate('/');
    }
  }, [navigate, requestId]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-4xl mx-auto p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Edit Product Listing</h2>
        <motion.div 
          className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 p-6 rounded-xl shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start space-x-3">
            <FiInfo className="text-yellow-800 text-xl mt-1" />
            <div>
              <h3 className="font-bold text-yellow-800 mb-2">Listing Guidelines</h3>
              <ul className="space-y-2 text-yellow-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Click the edit icon to modify any field
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Avoid making medical claims
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Use factual, verifiable information
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Follow Amazon's restricted keywords policy
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Title Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <EditableField
            label="Product Title"
            icon={FiBox}
            value={content.title}
            onChange={(e) => setContent({...content, title: e.target.value})}
            placeholder="Enter product title..."
          />
        </div>

        {/* Price Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
  <EditableField
    label="Price (₹)"  // Changed from "Price"
    icon={FiDollarSign}  // You might want to import a Rupee icon instead
    value={content.price}
    onChange={(e) => {
      // Remove any non-numeric characters except decimal point
      const value = e.target.value.replace(/[^0-9.]/g, '');
      setContent({...content, price: value});
    }}
    placeholder="XXXX.XX"  // Changed from XX.XX
    type="text"
    className="max-w-xs"
  />
</div>

        {/* Key Features Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FiList className="text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-800">Key Features</h3>
            </div>
          </div>
          <div className="space-y-3">
            {content.key_features.map((feature, index) => (
              <EditableFeature
                key={index}
                feature={feature}
                index={index}
                onChange={(e) => {
                  const newFeatures = [...content.key_features];
                  newFeatures[index] = e.target.value;
                  setContent({...content, key_features: newFeatures});
                }}
              />
            ))}
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <EditableField
            label="Description"
            icon={FiInfo}
            value={content.description}
            onChange={(e) => setContent({...content, description: e.target.value})}
            multiline={true}
            placeholder="Enter product description..."
          />
        </div>

        {/* Technical Details Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FiTag className="text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-800">Technical Details</h3>
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(content.details || {}).map(([key, value], index) => (
              <EditableTechnicalDetail
                key={index}
                keyName={key}
                value={value}
                onKeyChange={(e) => {
                  const newDetails = { ...content.details };
                  const oldValue = newDetails[key];
                  delete newDetails[key];
                  newDetails[e.target.value] = oldValue;
                  setContent({ ...content, details: newDetails });
                }}
                onValueChange={(e) => {
                  const newDetails = { ...content.details };
                  newDetails[key] = e.target.value;
                  setContent({ ...content, details: newDetails });
                }}
              />
            ))}
          </div>
        </div>

        {/* Images Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FiImage className="text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-800">Product Images</h3>
            </div>
            <span className="text-sm text-gray-500">
              Selected: {selectedImages.length}/{maxSelectableImages} (from {availableImages.length} available)
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availableImages.map((imgSrc, index) => (
              <motion.div
                key={index}
                className={`relative cursor-pointer rounded-xl overflow-hidden shadow-md 
                           hover:shadow-lg transition-all duration-200
                           ${selectedImages.includes(imgSrc) ? 'ring-2 ring-blue-500' : ''}`}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  if (selectedImages.includes(imgSrc)) {
                    setSelectedImages(selectedImages.filter(i => i !== imgSrc));
                  } else if (selectedImages.length < maxSelectableImages) {
                    setSelectedImages([...selectedImages, imgSrc]);
                  }
                }}
              >
                <img
                  src={`http://localhost:5000${imgSrc}`}
                  alt={`Product ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                {selectedImages.includes(imgSrc) && (
                  <motion.div 
                    className="absolute top-2 right-2 bg-blue-500 rounded-full p-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <FiCheck className="text-white w-4 h-4" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Preview Button */}
        <motion.button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white 
                     px-8 py-4 rounded-xl font-medium shadow-md hover:shadow-lg
                     flex items-center justify-center space-x-2 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiEye className="text-xl" />
          <span>Preview Listing</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default ListingEditor;