import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Truck } from 'lucide-react';

function AnimatedCard({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      {children}
    </div>
  );
}

export default function PromoSection() {
  return (
    <section className="py-6">
      <div className="container-main grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Bannière promo 1 */}
        <AnimatedCard delay={0}>
          <div className="bg-dva-red rounded-xl p-6 text-white flex items-center justify-between overflow-hidden relative">
            {/* Cercle décoratif animé */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full animate-pulse" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Code promo</span>
              </div>
              <h3 className="text-2xl font-black mb-1">10% sur votre 1ère commande</h3>
              <p className="text-red-100 text-sm mb-4">
                Utilisez le code <strong className="bg-white/20 px-2 py-0.5 rounded">BIENVENUE10</strong>
              </p>
              <Link to="/catalogue"
                className="bg-white text-dva-red font-bold px-5 py-2 rounded-md text-sm hover:bg-red-50 transition-colors inline-block hover:scale-105 transform duration-200">
                En profiter
              </Link>
            </div>
            <div className="text-white/20 hidden sm:block animate-bounce">
              <Tag className="w-20 h-20" />
            </div>
          </div>
        </AnimatedCard>

        {/* Bannière promo 2 */}
        <AnimatedCard delay={150}>
          <div className="bg-dva-blue-light rounded-xl p-6 text-white flex items-center justify-between overflow-hidden relative">
            {/* Cercle décoratif animé */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full animate-pulse" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Livraison rapide</span>
              </div>
              <h3 className="text-2xl font-black mb-1">Expédition en 24h</h3>
              <p className="text-blue-200 text-sm mb-4">Pour les commandes passées avant 15h</p>
              <Link to="/catalogue"
                className="bg-white text-dva-blue font-bold px-5 py-2 rounded-md text-sm hover:bg-blue-50 transition-colors inline-block hover:scale-105 transform duration-200">
                Voir le catalogue
              </Link>
            </div>
            <div className="text-white/20 hidden sm:block animate-bounce" style={{ animationDelay: '0.3s' }}>
              <Truck className="w-20 h-20" />
            </div>
          </div>
        </AnimatedCard>

      </div>
    </section>
  );
}
