import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import InstagramForm from "./components/InstagramForm";
import ResultsDisplay from "./components/ResultsDisplay";
import ProgressBar from "./components/ProgressBar";
import ListingEditor from "./components/ListingEditor";
import ListingPreview from "./components/ListingPreview";
import UpdateSession from "./components/UpdateSession";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInstagram,
  FiYoutube,
  FiShoppingCart,
  FiHome,
  FiInfo,
  FiUser,
  FiTrash2,
} from "react-icons/fi";
import { ListingProvider } from "./context/ListingContext";
import { BiTransfer } from "react-icons/bi";
import "./App.css";
import io from "socket.io-client";
import { storage, StorageKeys } from "./utils/storage";

// Global socket instance; initialized after config loads
let socket;

function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/'); // Navigate to home page
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            onClick={handleLogoClick}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <FiShoppingCart className="text-2xl text-blue-600" />
            <span className="text-xl font-bold text-gray-800">SocialKart</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 ${
                location.pathname === "/" ? "text-blue-600" : "text-gray-600"
              } hover:text-blue-600 transition-colors`}
            >
              <FiHome />
              <span>Home</span>
            </Link>
            <Link
              to="/about"
              className={`flex items-center space-x-1 ${
                location.pathname === "/about" ? "text-blue-600" : "text-gray-600"
              } hover:text-blue-600 transition-colors`}
            >
              <FiInfo />
              <span>About</span>
            </Link>
           
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`md:hidden overflow-hidden ${isOpen ? 'border-t border-gray-200' : ''}`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              } transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <FiHome />
                <span>Home</span>
              </div>
            </Link>
            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/about"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              } transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <FiInfo />
                <span>About</span>
              </div>
            </Link>
            <Link
              to="/update"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <FiUser />
                <span>Update Session</span>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </nav>
  );
}

function ServiceStatusBanner() {
  const [status, setStatus] = useState({ state: 'loading', error: '' });

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch('https://socialkartapi.zendrix.dev', { 
          method: 'HEAD',
          mode: 'no-cors' // This allows the request to work even if CORS is not configured
        });
        // Since we're using no-cors mode, we can't check res.ok
        // If the request doesn't throw an error, we assume the server is up
        if (!cancelled) setStatus({ state: 'success', error: '' });
      } catch (e) {
        if (!cancelled) setStatus({ state: 'error', error: e?.message || 'Server unreachable' });
      }
    };
    fetchStatus();
    const id = setInterval(fetchStatus, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  let container = 'bg-blue-50 border-blue-200';
  let iconColor = 'text-blue-600';
  let textColor = 'text-blue-700';
  let label = 'Checking service status...';

  if (status.state === 'success') {
    container = 'bg-green-50 border-green-200';
    iconColor = 'text-green-600';
    textColor = 'text-green-700';
    label = 'All systems operational';
  } else if (status.state === 'error') {
    container = 'bg-red-50 border-red-200';
    iconColor = 'text-red-600';
    textColor = 'text-red-700';
    label = 'Server down';
  }

  return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      className={`${container} border-l-4 p-4 rounded-lg`}
      >
        <div className="flex">
          <div className="flex-shrink-0">
          <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
          <p className={`text-sm font-medium ${textColor}`}>
            {label}
            </p>
          </div>
        </div>
      </motion.div>
  );
}
function Home({ handleProcess, loading, progress, progressText, results, handleClear, caption }) {
  return (
    <div className="space-y-8">
      {/* Service Status Banner */}
      <ServiceStatusBanner />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h2 className="text-3xl font-bold text-gray-800">
          Transform Your Instagram Content
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Convert your Instagram posts into professional e-commerce listings
          with just one click. Our AI-powered platform makes it easy to showcase
          your products.
        </p>
      </motion.div>

      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        <InstagramForm onSubmit={handleProcess} disabled={loading} />

        {loading && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-gray-600 mb-4">{progressText}</p>
            <ProgressBar progress={progress} />
            {caption && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Original Caption</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{caption}</p>
              </div>
            )}
          </motion.div>
        )}

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Generated Listing</h3>
                <button 
                    onClick={handleClear}
                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    title="Clear results and local data"
                >
                    <FiTrash2 className="w-5 h-5" />
                </button>
            </div>
            {/* Pass the backend URL to ResultsDisplay */}
            <ResultsDisplay data={results} backendUrl={results?.backendUrl || ''} />
          </motion.div>
        )}
      </div>

      {/* Features Section */}
      {/* Features Section */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-white p-6 rounded-xl shadow-md">
  <div className="flex space-x-2 mb-4">
    <FiInstagram className="text-3xl text-pink-500" />
    <FiYoutube className="text-3xl text-red-500" />
  </div>
  <h3 className="text-xl font-semibold text-gray-800 mb-2">Social Media Integration</h3>
  <p className="text-gray-600 mb-4">Seamlessly import your content with just a URL:</p>
  
  <ul className="space-y-3 text-gray-600">
    <li className="flex items-start">
      <span className="inline-block w-2 h-2 bg-pink-500 rounded-full mt-2 mr-2"></span>
      <span>Direct import of Instagram posts, reels and carousels</span>
    </li>
    <li className="flex items-start">
      <span className="inline-block w-2 h-2 bg-pink-500 rounded-full mt-2 mr-2"></span>
      <span>Automatic extraction of product details from post captions</span>
    </li>
    <li className="flex items-start">
      <span className="inline-block w-2 h-2 bg-pink-500 rounded-full mt-2 mr-2"></span>
      <span>YouTube video integration coming soon for expanded content options</span>
    </li>
  </ul>
</div>

        <div className="bg-white p-6 rounded-xl shadow-md">
  <BiTransfer className="text-3xl text-blue-500 mb-4" />
  <h3 className="text-xl font-semibold text-gray-800 mb-2">Smart Conversion</h3>
  <p className="text-gray-600 mb-4">AI-powered content transformation for professional listings.</p>
  
  <ul className="space-y-3 text-gray-600">
    <li className="flex items-start">
      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2"></span>
      <span>Speech-to-text conversion for video content descriptions</span>
    </li>
    <li className="flex items-start">
      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2"></span>
      <span>Automatic frame extraction to identify key product images</span>
    </li>
    <li className="flex items-start">
      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2"></span>
      <span>Smart image classification and selection for marketplace listings</span>
    </li>
  </ul>
</div>

<div className="bg-white p-6 rounded-xl shadow-md">
  <FiShoppingCart className="text-3xl text-yellow-500 mb-4" />
  <h3 className="text-xl font-semibold text-gray-800 mb-2">E-commerce Ready</h3>
  <p className="text-gray-600 mb-4">Generate marketplace-ready listings instantly.</p>
  
  <ul className="space-y-3 text-gray-600">
    <li className="flex items-start">
      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2"></span>
      <span>Auto-formatted product descriptions matching Amazon's guidelines</span>
    </li>
    <li className="flex items-start">
      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2"></span>
      <span>Optimized image selection and formatting for marketplace requirements</span>
    </li>
    <li className="flex items-start">
      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2"></span>
      <span>One-click listing creation with all required product details</span>
    </li>
  </ul>
</div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const [backendUrl, setBackendUrl] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [caption, setCaption] = useState("");
  const cleanupTimerRef = useRef(null);

  // Load backend URL from public/config.json and init socket
  useEffect(() => {
    if (backendUrl) return;
    fetch('/config.json')
      .then(res => res.json())
      .then(cfg => {
        const url = (cfg.backendUrl || '').replace(/\/$/, '');
        setBackendUrl(url);
        socket = io(url || undefined);
      })
      .catch(() => {
        setBackendUrl('');
        socket = io();
      });
  }, [backendUrl]);

  const handleClear = async (idToClear) => {
    const lastRequestId = idToClear || localStorage.getItem('lastRequestId');
    if (!lastRequestId) {
        setResults(null);
        return;
    }

    try {
        if (backendUrl) {
          await fetch(`${backendUrl}/cleanup/${lastRequestId}`, { method: 'POST' });
        }
    } catch (error) {
        console.error("Failed to call cleanup endpoint:", error);
    } finally {
        localStorage.removeItem('lastRequestId');
        localStorage.removeItem('expirationTimestamp');
        setResults(null);
        try {
          storage.remove(StorageKeys.LISTING_CONTENT);
          storage.remove(StorageKeys.LISTING_IMAGES);
        } catch (e) {}
    }
  };

  const scheduleCleanup = (requestId, expirationTimestamp) => {
    clearTimeout(cleanupTimerRef.current); // Clear any existing timer

    const expirationTime = new Date(expirationTimestamp).getTime();
    const now = new Date().getTime();
    const delay = expirationTime - now;

    if (delay > 0) {
      console.log(`Scheduling cleanup for ${requestId} in ${delay / 1000} seconds.`);
      cleanupTimerRef.current = setTimeout(() => {
        console.log(`Auto-cleaning up ${requestId} as its 10-minute timer has expired.`);
        handleClear(requestId);
      }, delay);
    } else {
      // If expired, clean up immediately
      console.log(`Data for ${requestId} has already expired. Cleaning up now.`);
      handleClear(requestId);
    }
  };

  useEffect(() => {
    if (!backendUrl) return;
    // On initial load, wipe local app state and ask backend to cleanup temp files
    try {
      localStorage.removeItem('lastRequestId');
      localStorage.removeItem('expirationTimestamp');
    } catch (e) {
      console.warn('Failed to clear localStorage keys on load:', e);
    }

    fetch(`${backendUrl}/cleanup_all`, { method: 'POST' }).catch(err => {
      console.warn('cleanup_all request failed:', err);
    });

    // After cleanup, check for stored data (should be none, but keep logic safe)
    const lastRequestId = localStorage.getItem('lastRequestId');
    const expirationTimestamp = localStorage.getItem('expirationTimestamp');

    if (lastRequestId && expirationTimestamp) {
      if (new Date().getTime() > new Date(expirationTimestamp).getTime()) {
        console.log(`Previous session for ${lastRequestId} has expired. Cleaning up.`);
        handleClear(lastRequestId);
      } else {
        console.log(`Found last request ID: ${lastRequestId}. Fetching results...`);
        setLoading(true);
        fetch(`${backendUrl}/results/${lastRequestId}`)
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch results');
            return res.json();
          })
          .then(json => {
            if (!json.error) {
              const merged = { ...json, backendUrl };
              setResults(merged);
              try {
                storage.set(StorageKeys.LISTING_CONTENT, {
                  structured_content: json.structured_content,
                  requestId: json.request_id,
                  backendUrl
                });
                storage.set(StorageKeys.LISTING_IMAGES, json.images);
              } catch (e) {}
              scheduleCleanup(lastRequestId, expirationTimestamp); // Schedule cleanup for existing session
            } else {
              setResults({ error: json.error });
            }
          })
          .catch(error => {
            console.error("Failed to fetch results:", error);
            setResults({ error: "Failed to fetch results from server." });
            setLoading(false);
          });
      }
    }

    // WebSocket event listeners
    socket.on('connect', () => {
        console.log('Connected to WebSocket server!');
    });

    socket.on('progress', (data) => {
        setProgressText(data.data);
        setProgress(data.progress);
    });

    socket.on('caption_update', (data) => {
        if (data && typeof data.caption === 'string') {
          setCaption(data.caption);
        }
    });

    socket.on('result', (data) => {
        const merged = { ...data, backendUrl };
        setResults(merged);
        setProgress(100);
        setProgressText("Completed!");
        setLoading(false);
        if (data.request_id) {
            localStorage.setItem('lastRequestId', data.request_id);
            const expiresMs = (data.expires_in_seconds ?? 600) * 1000;
            const expireAt = new Date(Date.now() + expiresMs).toISOString();
            localStorage.setItem('expirationTimestamp', expireAt);
            scheduleCleanup(data.request_id, expireAt);
        }
        try {
          storage.set(StorageKeys.LISTING_CONTENT, {
            structured_content: data.structured_content,
            requestId: data.request_id,
            backendUrl
          });
          storage.set(StorageKeys.LISTING_IMAGES, data.images);
        } catch (e) {}
    });

    socket.on('error', (data) => {
        setResults({ error: data.error });
        setLoading(false);
        setProgress(0);
    });

    return () => {
        socket.off('connect');
        socket.off('progress');
        socket.off('result');
        socket.off('error');
        socket.off('caption_update');
        clearTimeout(cleanupTimerRef.current); // Clean up timer on component unmount
    };
  }, [backendUrl]);

  const handleProcess = async (submission) => {
    clearTimeout(cleanupTimerRef.current);
    setLoading(true);
    setResults(null);
    localStorage.removeItem('lastRequestId');
    localStorage.removeItem('expirationTimestamp');
    setProgress(0);
    setProgressText("Initializing... (try again if it looks stuck for more than 15 seconds!)");
    
    if (socket) {
      socket.emit('start_processing', { url: submission.data });
    }
  };
  
  // Update handleClear to not need an argument by default
  const clearCurrentResults = () => handleClear();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  handleProcess={handleProcess}
                  loading={loading}
                  progress={progress}
                  progressText={progressText}
                  results={results}
                  handleClear={clearCurrentResults}
                  caption={caption}
                />
              }
            />
            <Route path="/edit/:requestId" element={<ListingEditor />} />
            <Route path="/preview/:requestId" element={<ListingPreview />} />
            <Route path="/update" element={<UpdateSession backendUrl={backendUrl} />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600">
            Made with ❤️ by{" "}
            <a
              href="https://github.com/zendrix396"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Aditya
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Add this component
function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto text-center space-y-6"
    >
      <h2 className="text-3xl font-bold text-gray-800">About SocialKart</h2>
      <p className="text-gray-600">
        SocialKart is an innovative platform that bridges the gap between social
        media content and e-commerce listings. Our AI-powered solution helps
        creators and businesses streamline their product listing process.
      </p>
    </motion.div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ListingProvider>
        <AppContent />
      </ListingProvider>
    </BrowserRouter>
  );
}

export default App;
