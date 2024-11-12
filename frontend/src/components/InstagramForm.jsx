import React, { useState } from 'react';

function InstagramForm({ onProcess }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onProcess(url);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Instagram Post URL:
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{ width: '300px', marginLeft: '10px' }}
        />
      </label>
      <button type="submit" style={{ marginLeft: '10px' }}>Generate</button>
    </form>
  );
}

export default InstagramForm;