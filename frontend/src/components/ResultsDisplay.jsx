import React from 'react';

function ResultsDisplay({ data }) {
  if (data.error) {
    return <div style={{ color: 'red' }}>Error: {data.error}</div>;
  }

  const { parsed_content, images } = data;

  return (
    <div style={{ marginTop: '20px' }}>
      <h2>Parsed Content</h2>
      <pre style={{ background: '#f0f0f0', padding: '10px' }}>
        {parsed_content}
      </pre>

      <h2>Relevant Images</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {images.map((img, index) => (
          <img
            key={index}
            src={`data:image/png;base64,${img}`}
            alt={`Relevant frame ${index + 1}`}
            style={{ width: '200px', margin: '10px' }}
          />
        ))}
      </div>
    </div>
  );
}

export default ResultsDisplay;