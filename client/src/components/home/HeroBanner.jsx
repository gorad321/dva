import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const DEFAULT_SLIDES = [
  { id: 1, title: 'Pièces de Frein de Qualité', subtitle: 'Plaquettes, disques, étriers — Marques Brembo, Bosch, EBC', cta: 'Voir les freins', link: '/catalogue?category=freins', bg: 'linear-gradient(135deg, #003DA5, #002880)', badge: "Jusqu'à -25%" },
  { id: 2, title: 'Pneus Toutes Saisons', subtitle: 'Michelin, Continental, Bridgestone — Livraison express', cta: 'Choisir mes pneus', link: '/catalogue?category=pneus', bg: 'linear-gradient(135deg, #111827, #002880)', badge: 'Meilleur prix' },
  { id: 3, title: 'Huiles & Filtres Premium', subtitle: 'Castrol, Total, Mann Filter — Compatibilité garantie', cta: 'Découvrir', link: '/catalogue?category=filtres', bg: 'linear-gradient(135deg, #002880, #1e293b)', badge: 'Nouveauté' },
];

export default function HeroBanner() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    axiosClient.get('/settings/hero')
      .then((r) => { if (r.data.slides?.length) setSlides(r.data.slides); })
      .catch(() => {});
  }, []);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5500);
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const goTo = (idx) => { setCurrent(idx); resetTimer(); };
  const goPrev = () => goTo((current - 1 + slides.length) % slides.length);
  const goNext = () => goTo((current + 1) % slides.length);

  return (
    <div className="relative overflow-hidden" style={{ minHeight: '340px' }}>

      {/* Toutes les slides empilées — fade via opacity */}
      {slides.map((slide, i) => (
        <div
          key={slide.id ?? i}
          className="absolute inset-0 text-white"
          style={{
            background: slide.bg,
            opacity: i === current ? 1 : 0,
            transition: 'opacity 800ms ease-in-out',
            zIndex: i === current ? 1 : 0,
            pointerEvents: i === current ? 'auto' : 'none',
          }}
        >
          {/* Motif décoratif */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 hidden md:block pointer-events-none">
            <svg viewBox="0 0 400 300" className="w-full h-full" fill="none">
              <circle cx="300" cy="150" r="200" stroke="white" strokeWidth="1.5" />
              <circle cx="300" cy="150" r="140" stroke="white" strokeWidth="1.5" />
              <circle cx="300" cy="150" r="80"  stroke="white" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Barre rouge */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-dva-red" />

          {/* Contenu */}
          <div className="container-main py-16 md:py-24 relative z-10 h-full flex items-center">
            <div
              style={{
                maxWidth: '36rem',
                opacity: i === current ? 1 : 0,
                transform: i === current ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 600ms ease 300ms, transform 600ms ease 300ms',
              }}
            >
              {slide.badge && (
                <span className="inline-block bg-dva-red text-white text-xs font-bold px-3 py-1 rounded-full mb-4 shadow">
                  {slide.badge}
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 drop-shadow-sm">
                {slide.title}
              </h1>
              <p className="text-blue-200 text-lg mb-8 leading-relaxed">{slide.subtitle}</p>
              <div className="flex gap-4 flex-wrap">
                {slide.link && (
                  <Link to={slide.link} className="btn-primary text-base px-8 py-3 shadow-lg">
                    {slide.cta || 'Découvrir'}
                  </Link>
                )}
                <Link to="/catalogue"
                  className="border-2 border-white/80 text-white font-semibold px-8 py-3 rounded-md hover:bg-white hover:text-dva-blue transition-all duration-200">
                  Tout le catalogue
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Placeholder hauteur */}
      <div className="invisible pointer-events-none relative z-0">
        <div className="container-main py-16 md:py-24">
          <div style={{ maxWidth: '36rem' }}>
            <span className="inline-block text-xs px-3 py-1 mb-4">badge</span>
            <h1 className="text-3xl md:text-5xl font-black mb-4">Titre du slide</h1>
            <p className="text-lg mb-8">Sous-titre descriptif</p>
            <div className="flex gap-4"><span className="px-8 py-3">CTA</span></div>
          </div>
        </div>
      </div>

      {/* Flèche gauche */}
      <button onClick={goPrev} aria-label="Précédent"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/25 hover:bg-black/45 text-white rounded-full p-2.5 backdrop-blur-sm transition-all duration-200 hover:scale-110">
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Flèche droite */}
      <button onClick={goNext} aria-label="Suivant"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/25 hover:bg-black/45 text-white rounded-full p-2.5 backdrop-blur-sm transition-all duration-200 hover:scale-110">
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicateurs */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
        {slides.map((_, i) => (
          <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? 'bg-dva-red w-7 h-2.5 shadow' : 'bg-white/50 hover:bg-white/80 w-2.5 h-2.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
