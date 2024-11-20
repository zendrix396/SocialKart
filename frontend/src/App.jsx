import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import InstagramForm from './components/InstagramForm';
import ResultsDisplay from './components/ResultsDisplay';
import ProgressBar from './components/ProgressBar';
import ListingEditor from './components/ListingEditor';
import ListingPreview from './components/ListingPreview';
import { motion } from 'framer-motion';
import { FiInstagram, FiShoppingCart } from 'react-icons/fi';
import { ListingProvider } from './context/ListingContext';
import { BiTransfer } from 'react-icons/bi';
import "./App.css";

// Home component that includes the form and progress
function Home({ handleProcess, loading, progress, results, requestId }) {
  return (
    <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-xl border border-gray-700">
      <InstagramForm onSubmit={handleProcess} />

      {loading && (
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-gray-300 mb-4">{progress.current_step}</p>
          <ProgressBar progress={progress.progress} />
        </motion.div>
      )}

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ResultsDisplay data={results} requestId={requestId} />
        </motion.div>
      )}
    </div>
  );
}


function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [progress, setProgress] = useState({
    current_step: '',
    progress: 0,
    error: null
  });

  useEffect(() => {
    let interval = null;
    if (requestId && loading) {
      interval = setInterval(async () => {
        try {
          const progressResponse = await fetch(`http://localhost:5000/progress/${requestId}`);
          const progressData = await progressResponse.json();
          
          if (progressData.error) {
            setProgress({ ...progressData, error: progressData.error });
            setLoading(false);
            clearInterval(interval);
          } else {
            setProgress(progressData);
            
            // Check if processing is complete
            if (progressData.progress === 100 && progressData.result_ready) {
              try {
                const resultResponse = await fetch(`http://localhost:5000/result/${requestId}`);
                
                if (!resultResponse.ok) {
                  throw new Error(`HTTP error! status: ${resultResponse.status}`);
                }
                
                const resultText = await resultResponse.text(); // Get raw text first
                console.log('Raw response:', resultText); // Debug log
                
                try {
                  const resultData = JSON.parse(resultText);
                  console.log('Parsed result data:', resultData);
                  
                  if (resultData.error) {
                    throw new Error(resultData.error);
                  }
                  
                  setResults(resultData);
                  setLoading(false);
                  clearInterval(interval);
                } catch (parseError) {
                  console.error('JSON parse error:', parseError);
                  throw new Error('Invalid JSON response from server');
                }
              } catch (fetchError) {
                console.error('Error fetching result:', fetchError);
                setResults({ error: fetchError.message });
                setLoading(false);
                clearInterval(interval);
              }
            }
          }
        } catch (error) {
          console.error('Error in progress check:', error);
          setLoading(false);
          clearInterval(interval);
        }
      }, 1000);
    }
  
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [requestId, loading]); // Added loading to dependencies

  const handleProcess = async (url) => {
    setLoading(true);
    setResults(null);
    setProgress({
      current_step: 'Initializing...',
      progress: 0,
      error: null
    });

    try {
      const response = await fetch('http://localhost:5000/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (response.ok) {
        setRequestId(data.request_id);
      } else {
        setResults({ error: data.error });
        setLoading(false);
      }
    } catch (error) {
      setResults({ error: 'An error occurred while processing the request.' });
      setLoading(false);
    }
  };

  return (
    <ListingProvider>
      <BrowserRouter>
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

            {/* Routes */}
            <Routes>
              <Route 
                path="/" 
                element={
                  <Home 
                    handleProcess={handleProcess}
                    loading={loading}
                    progress={progress}
                    results={results}
                    requestId={requestId}
                  />
                } 
              />
              <Route path="/edit/:requestId" element={<ListingEditor />} />
              <Route path="/preview/:requestId" element={<ListingPreview />} />
            </Routes>

            {/* Footer */}
            <p className="text-center text-gray-400 mt-8 text-sm">
              Made with ❤️ by LegionVanguard
            </p>
          </motion.div>
        </div>
      </BrowserRouter>
    </ListingProvider>
  );
}

export default App;