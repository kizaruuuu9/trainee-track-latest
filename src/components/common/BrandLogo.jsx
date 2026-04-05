import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * BrandLogo component that renders the official TraineeTrack logo
 * with a fallback to the "TT" text representation if the image fails to load.
 */
export default function BrandLogo({ 
  src, 
  alt = 'TraineeTrack Logo', 
  className = '', 
  style = {},
  fallbackClassName = '',
  fallbackStyle = {},
  size = 40
}) {
  const { appMetadata } = useApp();
  const [error, setError] = useState(false);
  const logoSrc = src || appMetadata?.logoUrl || '/traineetrack_logo.svg';

  if (error) {
    return (
      <div 
        className={fallbackClassName} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontWeight: 800,
          ...fallbackStyle 
        }}
      >
        TT
      </div>
    );
  }

  return (
    <img 
      src={logoSrc} 
      alt={alt} 
      className={className}
      style={{ 
        width: size, 
        height: size, 
        objectFit: 'contain',
        ...style 
      }}
      onError={() => setError(true)}
    />
  );
}
