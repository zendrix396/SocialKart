import React, { useState } from 'react';
import InstagramForm from './components/InstagramForm';
import ResultsDisplay from './components/ResultsDisplay';
import { motion } from 'framer-motion';
import { FiInstagram, FiShoppingCart } from 'react-icons/fi';
import { BiTransfer } from 'react-icons/bi';
import "./App.css";
function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProcess = async (url) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (response.ok) {
        setResults(data);
      } else {
        setResults({ error: data.error });
      }
    } catch (error) {
      setResults({ error: 'An error occurred while processing the request.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          <FiInstagram className="text-4xl text-pink-500" />
          <BiTransfer className="text-3xl text-blue-400 animate-pulse" />
          <FiShoppingCart className="text-4xl text-yellow-500" />
        </div>

        <motion.h1 
          className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-400 to-yellow-500"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          SocialKart
        </motion.h1>

        {/* Main Content */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-xl border border-gray-700">
          <InstagramForm onProcess={handleProcess} />
          
          {/* Loading State */}
          {loading && (
            <motion.div 
              className="flex justify-center items-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-4 text-gray-300">Processing your content...</p>
            </motion.div>
          )}

          {/* Results */}
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ResultsDisplay data={results} />
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 mt-8 text-sm">
          Made with ❤️ by LegionVanguard
        </p>
      </motion.div>
    </div>
  );
}

export default App;