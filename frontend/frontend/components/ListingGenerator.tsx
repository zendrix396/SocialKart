import React, { useState } from 'react';
import { SocialPlatform, ProductListing } from '../types';
import { generateListingFromUrl } from '../services/geminiService';
import Button from './ui/Button';
import { Instagram, Youtube, Search, CheckCircle, Copy, AlertCircle, ShoppingCart, Lock } from 'lucide-react';

const ListingGenerator: React.FC = () => {
  const [platform, setPlatform] = useState<SocialPlatform>(SocialPlatform.INSTAGRAM);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductListing | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Simulate network delay for "fetching" before calling AI
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const listing = await generateListingFromUrl(url);
      if (listing) {
        setResult(listing);
      } else {
        setError("Failed to generate listing. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const useExample = () => {
    setUrl('https://instagram.com/p/C_sample_post_123');
    setError(null);
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

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Input Card */}
      <div className="bg-black border border-zinc-800 shadow-2xl relative backdrop-blur-sm">
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-800 overflow-x-auto no-scrollbar">
          <TabButton 
            active={platform === SocialPlatform.INSTAGRAM} 
            onClick={() => setPlatform(SocialPlatform.INSTAGRAM)}
            icon={Instagram} 
            label="Instagram" 
          />
          <TabButton 
            active={platform === SocialPlatform.YOUTUBE} 
            onClick={() => {}}
            icon={Youtube} 
            label="YouTube"
            disabled={true}
          />
          <TabButton 
            active={platform === SocialPlatform.SEARCH} 
            onClick={() => {}}
            icon={Search} 
            label="Search"
            disabled={true}
          />
        </div>

        {/* Content */}
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
                    <button 
                      onClick={useExample} 
                      className="px-3 py-1 text-xs bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all uppercase tracking-wider font-semibold"
                    >
                      Paste Example
                    </button>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleGenerate} 
                isLoading={loading} 
                className="w-full sm:w-auto h-14 px-8 text-base font-bold tracking-wide uppercase"
              >
                Generate
              </Button>
            </div>
            
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
      {result && (
        <div className="mt-12 animate-fade-in border-t border-zinc-800 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-green-500/10 flex items-center justify-center border border-green-500/20">
                 <CheckCircle className="text-green-500 w-4 h-4" />
               </div>
               <h3 className="text-xl font-bold text-white tracking-tight">Generated Listing</h3>
            </div>
            <span className="text-xs font-mono text-zinc-500 uppercase">Confidence Score: 98%</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-zinc-800 bg-zinc-900/30">
            {/* Preview Card */}
            <div className="p-8 border-b lg:border-b-0 lg:border-r border-zinc-800 relative group bg-black">
              {/* Product Image Placeholder */}
              <div className="aspect-square bg-zinc-900 w-full mb-6 border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black opacity-50"></div>
                 <ShoppingCart className="w-16 h-16 text-zinc-700 relative z-10" />
                 <span className="mt-4 text-zinc-600 text-xs uppercase tracking-widest relative z-10 font-medium">Image Placeholder</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                   <h4 className="text-lg leading-snug font-semibold text-white">{result.title}</h4>
                   <span className="text-green-400 font-mono font-bold text-xl whitespace-nowrap">{result.price}</span>
                </div>
                
                <div className="flex items-center gap-1">
                   {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-sm ${i < Math.floor(result.rating) ? 'text-green-500' : 'text-zinc-800'}`}>★</span>
                   ))}
                   <span className="text-xs text-zinc-500 ml-2 font-mono">({result.rating.toFixed(1)})</span>
                </div>
                
                <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-zinc-800 pl-4">
                  {result.description}
                </p>
                
                <div className="pt-4">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Highlights</span>
                  <ul className="grid gap-2">
                    {result.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300">
                        <span className="w-1.5 h-1.5 mt-1.5 bg-green-500/50 flex-shrink-0" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                 <Button variant="outline" className="w-full text-xs uppercase tracking-wider">Copy Text</Button>
                 <Button variant="primary" className="w-full text-xs uppercase tracking-wider">Export CSV</Button>
              </div>
            </div>

            {/* JSON Data View */}
            <div className="bg-black/80 p-0 flex flex-col h-full max-h-[800px] overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 bg-zinc-900/50 border-b border-zinc-800">
                 <span className="text-xs font-mono text-zinc-400 uppercase">JSON Response</span>
                 <button className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                    <Copy className="w-3 h-3" /> Copy
                 </button>
              </div>
              <div className="p-6 overflow-auto custom-scrollbar flex-grow">
                <pre className="font-mono text-xs text-green-500/90 leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 text-center">
                <span className="text-[10px] text-zinc-600 font-mono uppercase">Generated by SocialKart AI Engine v1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingGenerator;