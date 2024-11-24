import React, { useState, useEffect } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInstagram,
  FiYoutube,
  FiShoppingCart,
  FiHome,
  FiInfo,
  FiUser,
} from "react-icons/fi";
import { ListingProvider } from "./context/ListingContext";
import { BiTransfer } from "react-icons/bi";
import "./App.css";
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
            <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
              <FiUser />
              <span>Login</span>
            </button>
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
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <FiUser />
                <span>Login</span>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </nav>
  );
}
function Home({ handleProcess, loading, progress, results, requestId }) {
  return (
    <div className="space-y-8">
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
        <InstagramForm onSubmit={handleProcess} />

        {loading && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-gray-600 mb-4">{progress.current_step}</p>
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
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [progress, setProgress] = useState({
    current_step: "",
    progress: 0,
    error: null,
  });
  useEffect(() => {
    const handleBeforeUnload = async () => {
      try {
        // Reset all states first
        setResults(null);
        setLoading(false);
        setRequestId(null);
        setProgress({
          current_step: "",
          progress: 0,
          error: null,
        });

        // Then attempt cleanup
        await fetch("http://localhost:5000/cleanup", {
          method: "POST",
          keepalive: true, // This ensures the request completes even if page is unloading
        });
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
  useEffect(() => {
    let interval = null;
    if (requestId && loading) {
      interval = setInterval(async () => {
        try {
          const progressResponse = await fetch(
            `http://localhost:5000/progress/${requestId}`
          );
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
                const resultResponse = await fetch(
                  `http://localhost:5000/result/${requestId}`
                );

                if (!resultResponse.ok) {
                  throw new Error(
                    `HTTP error! status: ${resultResponse.status}`
                  );
                }

                const resultText = await resultResponse.text(); // Get raw text first
                console.log("Raw response:", resultText); // Debug log

                try {
                  const resultData = JSON.parse(resultText);
                  console.log("Parsed result data:", resultData);

                  if (resultData.error) {
                    throw new Error(resultData.error);
                  }

                  setResults(resultData);
                  setLoading(false);
                  clearInterval(interval);
                } catch (parseError) {
                  console.error("JSON parse error:", parseError);
                  throw new Error("Invalid JSON response from server");
                }
              } catch (fetchError) {
                console.error("Error fetching result:", fetchError);
                setResults({ error: fetchError.message });
                setLoading(false);
                clearInterval(interval);
              }
            }
          }
        } catch (error) {
          console.error("Error in progress check:", error);
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

  const handleProcess = async (submission) => {
    setLoading(true);
    setResults(null);
    setProgress({
      current_step: "Initializing...",
      progress: 0,
      error: null,
    });

    try {
      const endpoint =
        submission.type === "url" ? "/process" : "/process_product";
      const payload =
        submission.type === "url"
          ? { url: submission.data }
          : { product_name: submission.data };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setRequestId(data.request_id);
      } else {
        setResults({ error: data.error });
        setLoading(false);
      }
    } catch (error) {
      setResults({ error: "An error occurred while processing the request." });
      setLoading(false);
    }
  };

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
                  results={results}
                  requestId={requestId}
                />
              }
            />
            <Route path="/edit/:requestId" element={<ListingEditor />} />
            <Route path="/preview/:requestId" element={<ListingPreview />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600">Made with ❤️ by LegionVanguard</p>
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
