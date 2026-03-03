import { useState, useEffect, useRef } from 'react';

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23E8EEF8"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23003DA5"%3EDVA%3C/text%3E%3C/svg%3E';

export default function LazyImage({ src, alt, className = '', fallback = PLACEHOLDER }) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [loaded, setLoaded] = useState(false);
  const timeoutRef = useRef(null);
  const usedFallback = useRef(!src);

  // Réinitialiser quand src change
  useEffect(() => {
    usedFallback.current = !src;
    setImgSrc(src || fallback);
    setLoaded(false);

    // Timeout uniquement pour les vraies URLs (pas pour le fallback)
    if (src) {
      timeoutRef.current = setTimeout(() => {
        usedFallback.current = true;
        setImgSrc(fallback);
      }, 5000);
    }

    return () => clearTimeout(timeoutRef.current);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoad = () => {
    clearTimeout(timeoutRef.current);
    setLoaded(true);
  };

  const handleError = () => {
    clearTimeout(timeoutRef.current);
    if (!usedFallback.current) {
      usedFallback.current = true;
      setImgSrc(fallback);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {!loaded && <div className="absolute inset-0 skeleton" />}
    </div>
  );
}
