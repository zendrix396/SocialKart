import React, { useState, useEffect, useRef } from 'react';
import { SocialPlatform, BackendResult } from '../types';
import { io, Socket } from 'socket.io-client';
import Button from './ui/Button';
import {
  Instagram, Youtube, Search, CheckCircle, Copy, AlertCircle,
  Image, ChevronLeft, ChevronRight, Tag, Users, Hash, Box,
  CheckCircle2, Sparkles, RefreshCw
} from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'https://socialkart.onrender.com';

const ListingGenerator: React.FC = () => {
  const [platform, setPlatform] = useState<SocialPlatform>(SocialPlatform.INSTAGRAM);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ message: string; percent: number } | null>(null);
  const [result, setResult] = useState<BackendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetch(`${SOCKET_URL}/`, { method: 'GET' })
      .then((r) => setBackendUp(r.ok))
      .catch(() => setBackendUp(false));
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress({ message: 'Connecting to backend...', percent: 5 });
    setImageIndex(0);

    const socket = io(SOCKET_URL, {
      transports: ['polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setProgress({ message: 'Connected. Starting processing...', percent: 10 });
      socket.emit('start_processing', { url });
    });

    socket.on('progress', (data: { data: string; progress: number }) => {
      setProgress({ message: data.data, percent: data.progress });
    });

    socket.on('caption_update', () => {});

    socket.on('result', (data: BackendResult) => {
      setResult(data);
      setLoading(false);
      setProgress(null);
      socket.disconnect();
    });

    socket.on('error', (data: { error: string }) => {
      setError(data.error || 'Processing failed. Please try again.');
      setLoading(false);
      setProgress(null);
      socket.disconnect();
    });

    socket.on('connect_error', () => {
      setError('Service is currently unavailable. The backend may be waking up — try again in 30 seconds.');
      setLoading(false);
      setProgress(null);
      socket.disconnect();
    });
  };

  const useExample = () => {
    setUrl('https://instagram.com/p/C_sample_post_123');
    setError(null);
  };

  const copyToClipboard = () => {
    if (!result?.structured_content) return;
    navigator.clipboard.writeText(JSON.stringify(result.structured_content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TabButton = ({ active, onClick, icon: Icon, label, disabled = false }: any) => (
    <button
      onClick={!disabled ? onClick : undefined}
      className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-r border-zinc-800 ${
        active
          ? 'text-green-400 bg-zinc-900 shadow-[inset_0_-2px_0_0_#22c55e]'
          : disabled
            ? 'text-zinc-600 bg-black/40 cursor-not-allowed'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-green-500' : ''}`} />
      {label}
      {disabled && (
        <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider text-zinc-600 font-bold border border-zinc-800 px-1 py-0.5 bg-black">
          Soon
        </span>
      )}
    </button>
  );

  const sc = result?.structured_content;
  const techDetails = sc?.technical_details && Object.keys(sc.technical_details).length > 0
    ? sc.technical_details
    : null;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {backendUp === false && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 px-5 py-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <span className="text-sm text-yellow-400 font-medium">Service Disrupted: Local Mode Active</span>
        </div>
      )}
      {/* Input Card */}
      <div className="bg-black border border-zinc-800 shadow-2xl relative backdrop-blur-sm">
        <div className="flex border-b border-zinc-800 overflow-x-auto no-scrollbar">
          <TabButton active={platform === SocialPlatform.INSTAGRAM} onClick={() => setPlatform(SocialPlatform.INSTAGRAM)} icon={Instagram} label="Instagram" />
          <TabButton active={platform === SocialPlatform.YOUTUBE} onClick={() => {}} icon={Youtube} label="YouTube" disabled={true} />
          <TabButton active={platform === SocialPlatform.SEARCH} onClick={() => {}} icon={Search} label="Search" disabled={true} />
        </div>

        <div className="p-8 space-y-8 bg-zinc-950/50">
          <div className="space-y-4">
            <label htmlFor="url-input" className="block text-xs font-mono text-green-500 uppercase tracking-widest">
              Input Source URL
            </label>
            <div className="flex flex-col sm:flex-row gap-0 shadow-lg">
              <div className="relative flex-grow group">
                <input
                  id="url-input"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={platform === SocialPlatform.INSTAGRAM ? "https://instagram.com/p/..." : "Enter URL..."}
                  className="w-full bg-black border border-zinc-700 text-white px-6 py-4 focus:outline-none focus:border-green-500 transition-colors placeholder-zinc-700 rounded-none font-mono text-sm h-14"
                />
                <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                  {url === '' && (
                    <button onClick={useExample} className="px-3 py-1 text-xs bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all uppercase tracking-wider font-semibold">
                      Paste Example
                    </button>
                  )}
                </div>
              </div>
              <Button onClick={handleGenerate} isLoading={loading} className="w-full sm:w-auto h-14 px-8 text-base font-bold tracking-wide uppercase">
                Generate
              </Button>
            </div>

            {progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>{progress.message}</span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="w-full bg-zinc-900 border border-zinc-800 h-2">
                  <div className="bg-green-500 h-full transition-all duration-500 ease-out" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Section */}
      {result && sc && (
        <div className="mt-12 animate-fade-in border-t border-zinc-800 pt-12 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <CheckCircle className="text-green-500 w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Generated Listing</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-zinc-500 uppercase">
                Expires in {Math.floor(result.expires_in_seconds / 60)}m
              </span>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors border border-zinc-800 px-3 py-1.5 bg-zinc-900/50"
              >
                {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Images */}
            <div className="bg-black border border-zinc-800">
              {result.images && result.images.length > 0 ? (
                <div className="relative">
                  <div className="w-full min-h-[500px] bg-zinc-900 flex items-center justify-center overflow-hidden">
                    <img
                      src={`${SOCKET_URL}${result.images[imageIndex]}`}
                      alt={`Frame ${imageIndex + 1}`}
                      className="max-w-full max-h-[600px] object-contain"
                    />
                  </div>
                  {result.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImageIndex((i) => (i > 0 ? i - 1 : result.images.length - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/80 border border-zinc-700 text-white p-2 hover:bg-zinc-800 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setImageIndex((i) => (i < result.images.length - 1 ? i + 1 : 0))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/80 border border-zinc-700 text-white p-2 hover:bg-zinc-800 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <div className="flex items-center justify-center gap-2 py-3 border-t border-zinc-800 bg-zinc-900/50">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase mr-2">
                      {imageIndex + 1} / {result.images.length}
                    </span>
                    {result.images.slice(0, Math.min(result.images.length, 15)).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImageIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === imageIndex ? 'bg-green-500' : 'bg-zinc-700 hover:bg-zinc-500'
                        }`}
                      />
                    ))}
                    {result.images.length > 15 && (
                      <span className="text-[10px] text-zinc-600">+{result.images.length - 15}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-zinc-900 w-full flex flex-col items-center justify-center">
                  <Image className="w-12 h-12 text-zinc-700" />
                  <span className="mt-3 text-zinc-600 text-xs uppercase tracking-widest">No frames extracted</span>
                </div>
              )}
            </div>

            {/* Right: Structured Data */}
            <div className="space-y-5">
              {/* Product Name */}
              <div className="bg-black border border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Product Name</span>
                </div>
                <h4 className="text-lg font-bold text-white leading-snug">{sc.product_name}</h4>
              </div>

              {/* Description */}
              <div className="bg-black border border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Description</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{sc.description}</p>
              </div>

              {/* Key Features */}
              {(sc.key_features?.length || 0) > 0 && (
                <div className="bg-black border border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Key Features</span>
                  </div>
                  <ul className="space-y-2">
                    {sc.key_features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300">
                        <span className="w-1 h-1 mt-2 bg-green-500 rounded-full flex-shrink-0" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Target Audience */}
              {sc.target_audience && (
                <div className="bg-black border border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Target Audience</span>
                  </div>
                  <p className="text-sm text-zinc-300">{sc.target_audience}</p>
                </div>
              )}

              {/* SEO Keywords */}
              {(sc.seo_keywords?.length || 0) > 0 && (
                <div className="bg-black border border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest">SEO Keywords</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sc.seo_keywords.map((kw, idx) => (
                      <span key={idx} className="text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 hover:border-green-500/30 transition-colors">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Details */}
              {techDetails && (
                <div className="bg-black border border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest">
                      Technical Details
                      {sc.technical_details_schema?.category && (
                        <span className="text-zinc-500 ml-2">/ {sc.technical_details_schema.category}</span>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(techDetails).map(([key, value]) => {
                      const schemaEntry = sc.technical_details_schema?.properties?.[key];
                      const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                      return (
                        <div key={key} className="flex items-start gap-3 py-1.5 border-b border-zinc-800/50 last:border-0">
                          <span className="text-[11px] font-mono text-zinc-500 uppercase min-w-[120px] flex-shrink-0 pt-0.5">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm text-zinc-300">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-zinc-800/50">
            <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">Generated by SocialKart AI Engine v1.0</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingGenerator;
