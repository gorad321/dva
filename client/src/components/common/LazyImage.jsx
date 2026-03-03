import { useState, useEffect, useRef } from 'react';

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23E8EEF8"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23003DA5"%3EDVA%3C/text%3E%3C/svg%3E';

export default function LazyImage({ src, alt, className = '', fallback = PLACEHOLDER }) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  // Si src change (ex: navigation), réinitialiser
  useEffect(() => {
    setImgSrc(src || fallback);
    setLoaded(false);
  }, [src, fallback]);

  // Timeout : si l'image ne charge pas en 6s, utiliser le placeholder
  useEffect(() => {
    if (loaded) return;
    timerRef.current = setTimeout(() => {
      setImgSrc(fallback);
    }, 6000);
    return () => clearTimeout(timerRef.current);
  }, [imgSrc, loaded, fallback]);

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => {
          clearTimeout(timerRef.current);
          setLoaded(true);
        }}
        onError={() => {
          clearTimeout(timerRef.current);
          if (imgSrc !== fallback) setImgSrc(fallback);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {!loaded && <div className="absolute inset-0 skeleton" />}
    </div>
  );
}
