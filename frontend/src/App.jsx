import React, { useState } from 'react';
import InstagramForm from './components/InstagramForm';
import ResultsDisplay from './components/ResultsDisplay';

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
    <div style={{ padding: '20px' }}>
      <h1>Instagram Video Processor</h1>
      <InstagramForm onProcess={handleProcess} />
      {loading && <p>Processing...</p>}
      {results && <ResultsDisplay data={results} />}
    </div>
  );
}

export default App;