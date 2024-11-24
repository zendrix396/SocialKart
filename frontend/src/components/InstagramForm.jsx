import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import { FiLink, FiShoppingCart } from "react-icons/fi";
import ProductForm from "./ProductForm";
import { brownPaper } from "react-syntax-highlighter/dist/cjs/styles/hljs";

function InstagramForm({ onSubmit }) {
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState("instagram");
  const [showDevelopmentMessage, setShowDevelopmentMessage] = useState(false);
  const [productName, setProductName] = useState("");
  

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (mode === "youtube") {
      setShowDevelopmentMessage(true);
      return;
    }
    setShowDevelopmentMessage(false);
    onSubmit({ type: "url", data: url });
  };

  const handleProductSubmit = (e) => {
    e.preventDefault(); // Add this to prevent form reload
    onSubmit({ type: "product", data: productName });
  };
  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <div className="flex flex-col items-center space-y-4 mb-6">
        <div className="flex space-x-4 justify-center">
          <button
            onClick={() => {
              setMode("instagram");
              setShowDevelopmentMessage(false);
              setUrl("");
            }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
              mode === "instagram"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FaInstagram className="text-xl" />
            <span>Instagram</span>
          </button>
          <button
            onClick={() => {
              setMode("youtube");
              setShowDevelopmentMessage(true);
              setUrl("");
            }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
              mode === "youtube"
                ? "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FaYoutube className="text-xl" />
            <span>YouTube</span>
          </button>
          <button
            onClick={() => {
              setMode("product");
              setShowDevelopmentMessage(true); // Show message when switching to product mode
              setUrl("");
            }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
              mode === "product"
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FiShoppingCart className="text-xl" />
            <span>Product Search</span>
          </button>
        </div>
      </div>

      {/* Development Message */}
      {showDevelopmentMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded"
        >
          {mode === "youtube"
            ? "YouTube integration is coming soon! Please use Instagram URL for now."
            : "This feature is currently under development. Please try using the Instagram URL option instead."}
        </motion.div>
      )}

      {/* Form Content */}
      {mode === "product" ? (
        <motion.form
  onSubmit={handleProductSubmit} // Updated to use the new handler
  className="space-y-6"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <FiShoppingCart className="mr-2" />
              Product Name
            </label>

            <div className="relative">
              <motion.div
                className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 
                     rounded-xl blur opacity-75 transition-opacity duration-300 ${
                       isFocused ? "opacity-100" : "opacity-0"
                     }`}
                animate={{ opacity: isFocused ? 0.75 : 0 }}
              />

              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                required
                placeholder="Enter product name..."
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
               bg-gradient-to-r from-blue-500 to-indigo-500 
               hover:from-blue-600 hover:to-indigo-600
               text-white font-medium py-3 px-6 rounded-lg
               transform transition-all duration-200
               hover:scale-[1.02] active:scale-[0.98]
               shadow-md hover:shadow-lg
               disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!productName}
          >
            <span>Search Product</span>
          </motion.button>
        </motion.form>
      ) : (
        <motion.form
          onSubmit={handleUrlSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <FiLink className="mr-2" />
              {mode === "youtube" ? "YouTube Video URL" : "Instagram Post URL"}
            </label>

            <div className="relative">
              <motion.div
                className={`absolute -inset-0.5 bg-gradient-to-r ${
                  mode === "youtube"
                    ? "from-red-500 to-red-600"
                    : "from-purple-500 to-pink-500"
                } rounded-xl blur opacity-75 transition-opacity duration-300 ${
                  isFocused ? "opacity-100" : "opacity-0"
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
                placeholder={
                  mode === "youtube"
                    ? "https://youtube.com/watch?v=..."
                    : "https://instagram.com/p/..."
                }
                className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                         placeholder-gray-400 relative transition-all duration-300
                         shadow-sm"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            className={`w-full flex items-center justify-center space-x-2 
                     bg-gradient-to-r ${
                       mode === "youtube"
                         ? "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                         : "from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                     }
                     text-white font-medium py-3 px-6 rounded-lg
                     transform transition-all duration-200
                     hover:scale-[1.02] active:scale-[0.98]
                     shadow-md hover:shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!url}
          >
            <span>Generate Listing</span>
          </motion.button>
        </motion.form>
      )}
    </div>
  );
}

export default InstagramForm;
