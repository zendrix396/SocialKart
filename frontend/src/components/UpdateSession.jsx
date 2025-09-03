import React, { useState } from 'react';
import { motion } from 'framer-motion';

function UpdateSession({ backendUrl = '' }) {
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const apiBase = (backendUrl || '').replace(/\/$/, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      setStatus('error');
      setMessage('Please enter a valid sessionId.');
      return;
    }
    setStatus('loading');
    setMessage('Updating session...');
    try {
      const res = await fetch(`${apiBase || ''}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.trim() })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setStatus('success');
      setMessage('Instagram session cookie updated successfully.');
    } catch (err) {
      setStatus('error');
      setMessage(err?.message || 'Failed to update session.');
    }
  };

  let bannerClass = 'bg-blue-50 border-blue-200 text-blue-700';
  let bannerText = message || 'Enter your Instagram sessionId cookie and update the backend.';
  if (status === 'success') bannerClass = 'bg-green-50 border-green-200 text-green-700';
  if (status === 'error') bannerClass = 'bg-red-50 border-red-200 text-red-700';

  return (
    <motion.div
      className="max-w-2xl mx-auto p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Update Instagram Session</h2>

      <div className={`mb-6 border-l-4 p-4 rounded-lg ${bannerClass}`}>
        <p className="text-sm font-medium">{bannerText}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">sessionId</label>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="paste your Instagram session cookie here"
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-60"
          >
            {status === 'loading' ? 'Updating…' : 'Update Session'}
          </button>
          <button
            type="button"
            onClick={() => { setSessionId(''); setStatus('idle'); setMessage(''); }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg"
          >
            Clear
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export default UpdateSession;


