import React from 'react';
import { Link } from 'react-router-dom';
import { Disc, Filter, Circle, Zap, Droplets, Settings } from 'lucide-react';

const CATEGORIES = [
  { name: 'Freins', slug: 'freins', icon: Disc, color: 'bg-red-50 text-dva-red', desc: 'Plaquettes, disques, étriers' },
  { name: 'Filtres', slug: 'filtres', icon: Filter, color: 'bg-blue-50 text-dva-blue', desc: 'Huile, air, habitacle' },
  { name: 'Pneus', slug: 'pneus', icon: Circle, color: 'bg-gray-50 text-gray-700', desc: 'Été, hiver, toutes saisons' },
  { name: 'Batteries', slug: 'batteries', icon: Zap, color: 'bg-yellow-50 text-yellow-700', desc: 'Standard, AGM, EFB' },
  { name: 'Huiles & Liquides', slug: 'huiles-liquides', icon: Droplets, color: 'bg-green-50 text-green-700', desc: 'Moteur, frein, refroidissement' },
  { name: 'Allumage', slug: 'allumage-distribution', icon: Settings, color: 'bg-purple-50 text-purple-700', desc: 'Bougies, bobines, distribution' },
];

export default function CategoryGrid() {
  return (
    <section className="py-10">
      <div className="container-main">
        <h2 className="section-title mb-2">Nos Catégories</h2>
        <p className="text-gray-500 mb-6">Trouvez rapidement la pièce qu'il vous faut</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(({ name, slug, icon: Icon, color, desc }) => (
            <Link
              key={slug}
              to={`/catalogue?category=${slug}`}
              className="group bg-white rounded-xl p-5 text-center shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 border border-gray-100"
            >
              <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7" />
              </div>
              <p className="font-semibold text-gray-800 text-sm">{name}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
