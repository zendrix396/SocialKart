import React, { useState, useEffect, useRef } from 'react';
import { SocialPlatform, BackendResult } from '../types';
import { io, Socket } from 'socket.io-client';
import Button from './ui/Button';
import { Instagram, Youtube, Search, CheckCircle, Copy, AlertCircle, Image } from 'lucide-react';

const SOCKET_URL = 'http://localhost:5000';

const ListingGenerator: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ message: string; percent: number } | null>(null);
  const [result, setResult] = useState<BackendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => { return () => { socketRef.current?.disconnect(); }; }, []);

  const handleGenerate = async () => {
    if (!url.trim()) { setError('Enter a URL'); return; }
    setLoading(true); setError(null); setResult(null);
    setProgress({ message: 'Connecting...', percent: 5 });
    const socket = io(SOCKET_URL, { transports: ['polling'] });
    socketRef.current = socket;
    socket.on('connect', () => { setProgress({ message: 'Connected', percent: 10 }); socket.emit('start_processing', { url }); });
    socket.on('progress', (d: { data: string; progress: number }) => setProgress({ message: d.data, percent: d.progress }));
    socket.on('result', (d: BackendResult) => { setResult(d); setLoading(false); setProgress(null); socket.disconnect(); });
    socket.on('error', (d: { error: string }) => { setError(d.error || 'Failed'); setLoading(false); setProgress(null); socket.disconnect(); });
    socket.on('connect_error', () => { setError('Backend not running on port 5000'); setLoading(false); setProgress(null); socket.disconnect(); });
  };

  const sc = result?.structured_content;
  return (
    <div className="w-full max-w-5xl mx-auto px-6">
      <div className="bg-black border border-zinc-800">
        <div className="flex border-b border-zinc-800">
          <button className="flex items-center gap-2 px-6 py-4 text-sm text-green-400 border-b-2 border-green-500">
            <Instagram className="w-4 h-4" /> Instagram
          </button>
          <button className="flex items-center gap-2 px-6 py-4 text-sm text-zinc-600">
            <Youtube className="w-4 h-4" /> YouTube (Soon)
          </button>
        </div>
        <div className="p-8">
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://instagram.com/p/..."
            className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-3 mb-4" />
          <Button onClick={handleGenerate} isLoading={loading}>Generate</Button>
          {progress && <div className="mt-4"><div className="flex justify-between text-xs text-zinc-400 mb-1"><span>{progress.message}</span><span>{progress.percent}%</span></div><div className="w-full bg-zinc-900 h-2"><div className="bg-green-500 h-full transition-all" style={{ width: `${progress.percent}%` }} /></div></div>}
          {error && <div className="mt-4 flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}
        </div>
      </div>
      {result && sc && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <h3 className="font-bold mb-4">{sc.product_name}</h3>
            <p className="text-sm text-zinc-400">{sc.description}</p>
            {sc.key_features?.length > 0 && <ul className="mt-3 space-y-1">{sc.key_features.map((f, i) => <li key={i} className="text-sm text-zinc-300">- {f}</li>)}</ul>}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <h4 className="font-bold mb-2">Images</h4>
            {result.images.length > 0 ? <img src={`${SOCKET_URL}${result.images[0]}`} alt="Frame" className="w-full" /> : <p className="text-zinc-500 text-sm">No frames</p>}
          </div>
        </div>
      )}
    </div>
  );
};
export default ListingGenerator;