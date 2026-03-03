import { useState, useEffect, useRef } from 'react';

const PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" ' +
  'viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23E8EEF8"/%3E%3Ctext ' +
  'x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" ' +
  'font-size="14" fill="%23003DA5"%3EDVA%3C/text%3E%3C/svg%3E';

export default function LazyImage({ src, alt, className = '', fallback = PLACEHOLDER }) {
  const containerRef = useRef(null);
  const timeoutRef  = useRef(null);

  const [inView,  setInView]  = useState(false);
  const [imgSrc,  setImgSrc]  = useState(null);   // null = pas encore chargé
  const [loaded,  setLoaded]  = useState(false);

  // ── 1. Intersection Observer : déclenche le chargement à l'entrée du viewport ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // rootMargin="200px" : précharge l'image 200px avant qu'elle soit visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── 2. Chargement réel de l'image une fois dans le viewport ──────────────────
  useEffect(() => {
    if (!inView) return;

    clearTimeout(timeoutRef.current);

    if (!src) {
      // Pas d'URL → fallback immédiat, pas de skeleton
      setImgSrc(fallback);
      setLoaded(true);
      return;
    }

    // Vraie URL → skeleton pendant le chargement
    setImgSrc(src);
    setLoaded(false);

    // Si l'image ne répond pas dans les 5s → fallback
    timeoutRef.current = setTimeout(() => {
      setImgSrc(fallback);
      setLoaded(true);
    }, 5000);

    return () => clearTimeout(timeoutRef.current);
  }, [inView, src]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {/* Skeleton : visible tant que l'image n'est pas prête */}
      {!loaded && <div className="absolute inset-0 skeleton" />}

      {/* Image : rendue uniquement quand imgSrc est défini (après entrée viewport) */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          onLoad={() => { clearTimeout(timeoutRef.current); setLoaded(true); }}
          onError={() => { clearTimeout(timeoutRef.current); setImgSrc(fallback); setLoaded(true); }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
