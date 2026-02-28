import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Truck } from 'lucide-react';

export default function PromoSection() {
  return (
    <section className="py-6">
      <div className="container-main grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bannière promo 1 */}
        <div className="bg-dva-red rounded-xl p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Code promo</span>
            </div>
            <h3 className="text-2xl font-black mb-1">10% sur votre 1ère commande</h3>
            <p className="text-red-100 text-sm mb-4">Utilisez le code <strong className="bg-white/20 px-2 py-0.5 rounded">BIENVENUE10</strong></p>
            <Link to="/catalogue" className="bg-white text-dva-red font-bold px-5 py-2 rounded-md text-sm hover:bg-red-50 transition-colors inline-block">
              En profiter
            </Link>
          </div>
          <div className="text-white/20 hidden sm:block">
            <Tag className="w-20 h-20" />
          </div>
        </div>

        {/* Bannière promo 2 */}
        <div className="bg-dva-blue rounded-xl p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Livraison offerte</span>
            </div>
            <h3 className="text-2xl font-black mb-1">Gratuite dès 50€ d'achat</h3>
            <p className="text-blue-200 text-sm mb-4">Expédition en 24h pour les commandes passées avant 15h</p>
            <Link to="/catalogue" className="bg-white text-dva-blue font-bold px-5 py-2 rounded-md text-sm hover:bg-blue-50 transition-colors inline-block">
              Voir le catalogue
            </Link>
          </div>
          <div className="text-white/20 hidden sm:block">
            <Truck className="w-20 h-20" />
          </div>
        </div>
      </div>
    </section>
  );
}
