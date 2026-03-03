import { useState, useEffect, useRef } from 'react';

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23E8EEF8"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23003DA5"%3EDVA%3C/text%3E%3C/svg%3E';

export default function LazyImage({ src, alt, className = '', fallback = PLACEHOLDER }) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [loaded, setLoaded] = useState(!src); // true immédiatement si pas de src réel
  const timeoutRef = useRef(null);

  useEffect(() => {
    clearTimeout(timeoutRef.current);

    if (!src) {
      // Pas de vraie image → afficher le fallback directement
      setImgSrc(fallback);
      setLoaded(true);
      return;
    }

    // Vraie image : afficher le skeleton pendant le chargement
    setImgSrc(src);
    setLoaded(false);

    // Si l'image ne charge pas en 5s, basculer vers le fallback
    timeoutRef.current = setTimeout(() => {
      setImgSrc(fallback);
      setLoaded(true);
    }, 5000);

    return () => clearTimeout(timeoutRef.current);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        onLoad={() => { clearTimeout(timeoutRef.current); setLoaded(true); }}
        onError={() => { clearTimeout(timeoutRef.current); setImgSrc(fallback); setLoaded(true); }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {!loaded && <div className="absolute inset-0 skeleton" />}
    </div>
  );
}
