import React from 'react';

function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-gray-700 rounded-full h-4">
      <div
        className="bg-blue-500 h-4 rounded-full transition-all duration-500"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
}

export default ProgressBar;