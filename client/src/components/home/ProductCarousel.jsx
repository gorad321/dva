import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { productsApi } from '../../api/productsApi';
import ProductCard from '../catalog/ProductCard';
import Spinner from '../common/Spinner';

export default function ProductCarousel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState(0);
  const visible = 4; // Nombre de produits visibles (desktop)

  useEffect(() => {
    productsApi.getFeatured()
      .then((res) => setProducts(res.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="py-10">
      <div className="container-main">
        <div className="h-8 skeleton w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton rounded-xl" />)}
        </div>
      </div>
    </section>
  );

  const prev = () => setStart((s) => Math.max(0, s - 1));
  const next = () => setStart((s) => Math.min(products.length - visible, s + 1));

  return (
    <section className="py-10 bg-gray-50">
      <div className="container-main">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Produits Populaires</h2>
            <p className="text-gray-500 text-sm mt-1">Sélection de nos meilleures ventes</p>
          </div>
          <div className="flex gap-2">
            <button onClick={prev} disabled={start === 0}
              className="p-2 rounded-full border border-gray-300 hover:border-dva-blue hover:text-dva-blue disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} disabled={start >= products.length - visible}
              className="p-2 rounded-full border border-gray-300 hover:border-dva-blue hover:text-dva-blue disabled:opacity-40 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grille responsive : 1 col mobile, 2 tablette, 4 desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(start, start + visible).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
