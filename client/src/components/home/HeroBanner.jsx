import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'Pièces de Frein de Qualité',
    subtitle: 'Plaquettes, disques, étriers — Marques Brembo, Bosch, EBC',
    cta: 'Voir les freins',
    link: '/catalogue?category=freins',
    bg: 'from-dva-blue to-dva-blue-dark',
    badge: 'Jusqu\'à -25%',
  },
  {
    id: 2,
    title: 'Pneus Toutes Saisons',
    subtitle: 'Michelin, Continental, Bridgestone — Livraison express',
    cta: 'Choisir mes pneus',
    link: '/catalogue?category=pneus',
    bg: 'from-gray-900 to-dva-blue-dark',
    badge: 'Meilleur prix',
  },
  {
    id: 3,
    title: 'Huiles & Filtres Premium',
    subtitle: 'Castrol, Total, Mann Filter — Compatibilité garantie',
    cta: 'Découvrir',
    link: '/catalogue?category=filtres',
    bg: 'from-dva-blue-dark to-slate-800',
    badge: 'Nouveauté',
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrent((c) => (c + 1) % SLIDES.length);

  const slide = SLIDES[current];

  return (
    <div className={`relative bg-gradient-to-r ${slide.bg} text-white overflow-hidden`} style={{ minHeight: '320px' }}>
      {/* Contenu */}
      <div className="container-main py-16 md:py-24 relative z-10">
        <div className="max-w-xl">
          <span className="inline-block bg-dva-red text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
            {slide.badge}
          </span>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">{slide.title}</h1>
          <p className="text-blue-200 text-lg mb-8">{slide.subtitle}</p>
          <div className="flex gap-4 flex-wrap">
            <Link to={slide.link} className="btn-primary text-base px-8 py-3">
              {slide.cta}
            </Link>
            <Link to="/catalogue" className="border-2 border-white text-white font-semibold px-8 py-3 rounded-md hover:bg-white hover:text-dva-blue transition-colors">
              Tout le catalogue
            </Link>
          </div>
        </div>
      </div>

      {/* Motif décoratif */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 hidden md:block">
        <svg viewBox="0 0 400 300" className="w-full h-full" fill="none">
          <circle cx="300" cy="150" r="200" stroke="white" strokeWidth="2" />
          <circle cx="300" cy="150" r="150" stroke="white" strokeWidth="2" />
          <circle cx="300" cy="150" r="100" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      {/* Barre rouge décorative */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-dva-red" />

      {/* Contrôles */}
      <button onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Points de navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-dva-red w-6' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
