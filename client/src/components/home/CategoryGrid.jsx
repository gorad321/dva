import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Disc, Filter, Circle, Zap, Droplets, Settings,
  Wrench, Car, Gauge, Thermometer, Battery, Wind,
  Shield, Box, Package, Cog, Layers, Star, Tag, Bolt,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const ICON_MAP = {
  disc: Disc,
  filter: Filter,
  circle: Circle,
  zap: Zap,
  droplets: Droplets,
  settings: Settings,
  wrench: Wrench,
  car: Car,
  gauge: Gauge,
  thermometer: Thermometer,
  battery: Battery,
  wind: Wind,
  shield: Shield,
  box: Box,
  package: Package,
  cog: Cog,
  layers: Layers,
  star: Star,
  tag: Tag,
  bolt: Bolt,
};

const COLORS = [
  'bg-red-50 text-dva-red',
  'bg-blue-50 text-dva-blue',
  'bg-gray-50 text-gray-700',
  'bg-yellow-50 text-yellow-700',
  'bg-green-50 text-green-700',
  'bg-purple-50 text-purple-700',
  'bg-orange-50 text-orange-700',
  'bg-pink-50 text-pink-700',
];

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axiosClient.get('/categories')
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-10">
      <div className="container-main">
        <h2 className="section-title mb-2">Nos Catégories</h2>
        <p className="text-gray-500 mb-6">Trouvez rapidement la pièce qu'il vous faut</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => {
            const isImage = cat.icon && (cat.icon.startsWith('/uploads/') || cat.icon.startsWith('http'));
            const Icon = isImage ? null : (ICON_MAP[cat.icon] || Settings);
            const color = COLORS[i % COLORS.length];
            return (
              <Link
                key={cat.slug}
                to={`/catalogue?category=${cat.slug}`}
                className="group bg-white rounded-xl p-5 text-center shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 border border-gray-100"
              >
                <div className={`w-14 h-14 rounded-full ${isImage ? 'bg-gray-50' : color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform overflow-hidden`}>
                  {isImage
                    ? <img src={cat.icon} alt={cat.name} className="w-10 h-10 object-contain" />
                    : <Icon className="w-7 h-7" />
                  }
                </div>
                <p className="font-semibold text-gray-800 text-sm">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block line-clamp-2">{cat.description}</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
