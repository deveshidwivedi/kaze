import React from 'react';

const LoadingIndicator = () => {
  return (
    <div className="message assistant">
      <div className="loading">
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>考えています...</span>
      </div>
    </div>
  );
};

export default LoadingIndicator;
