import { useState, useRef, useEffect } from 'react';

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23E8EEF8"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23003DA5"%3EChargement...%3C/text%3E%3C/svg%3E';

/**
 * Image avec lazy loading via IntersectionObserver
 */
export default function LazyImage({ src, alt, className = '', fallback = PLACEHOLDER }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Précharger 100px avant d'entrer dans le viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`overflow-hidden bg-dva-blue-muted ${className}`}>
      {inView && (
        <img
          src={error ? fallback : src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {(!inView || !loaded) && !error && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="skeleton w-full h-full absolute inset-0" />
        </div>
      )}
    </div>
  );
}
