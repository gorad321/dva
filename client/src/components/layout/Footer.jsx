import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Shield, Truck, RotateCcw, CreditCard } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dva-blue-dark text-white mt-12">
      {/* Bande de réassurance */}
      <div className="border-b border-dva-blue/40">
        <div className="container-main py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Livraison rapide', desc: 'Gratuite dès 50€' },
            { icon: Shield, title: 'Paiement sécurisé', desc: 'CB, PayPal' },
            { icon: RotateCcw, title: 'Retours 30 jours', desc: 'Sans questions' },
            { icon: CreditCard, title: 'Pièces garanties', desc: 'Qualité certifiée' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="bg-dva-blue rounded-full p-2.5 flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-blue-200 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container-main py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* À propos */}
        <div>
          <div className="flex items-center gap-1 mb-4">
            <span className="text-white font-black text-2xl">D</span>
            <span className="text-dva-red font-black text-2xl">VA</span>
            <span className="text-blue-200 text-sm ml-1">Pièces Auto</span>
          </div>
          <p className="text-blue-200 text-sm leading-relaxed">
            Votre spécialiste en pièces automobiles depuis 2010. Plus de 50 000 références disponibles pour toutes les marques.
          </p>
        </div>

        {/* Catégories */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Catégories</h3>
          <ul className="space-y-2">
            {['Freins', 'Filtres', 'Pneus', 'Batteries', 'Huiles & Liquides', 'Allumage'].map((cat) => (
              <li key={cat}>
                <Link to={`/catalogue?category=${cat.toLowerCase().replace(/ /g, '-').replace(/&/g, '').replace(/--/g, '-')}`}
                  className="text-blue-200 hover:text-white text-sm transition-colors">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Informations */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Informations</h3>
          <ul className="space-y-2">
            {[
              { label: 'Qui sommes-nous ?', to: '/' },
              { label: 'Livraison & retours', to: '/' },
              { label: 'Mentions légales', to: '/' },
              { label: 'CGV', to: '/' },
              { label: 'Politique de confidentialité', to: '/' },
            ].map(({ label, to }) => (
              <li key={label}>
                <Link to={to} className="text-blue-200 hover:text-white text-sm transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Contact</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-blue-200 text-sm">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>01 23 45 67 89</span>
            </li>
            <li className="flex items-center gap-2 text-blue-200 text-sm">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span>contact@dva-auto.fr</span>
            </li>
            <li className="flex items-start gap-2 text-blue-200 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>15 Rue de la Mécanique<br />75001 Paris</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bas du footer */}
      <div className="border-t border-dva-blue/40 py-4">
        <div className="container-main flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-blue-300 text-xs">© 2024 DVA Auto. Tous droits réservés.</p>
          <p className="text-blue-300 text-xs">Paiement sécurisé SSL · RGPD conforme</p>
        </div>
      </div>
    </footer>
  );
}
