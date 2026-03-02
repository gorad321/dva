import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Shield, Truck, RotateCcw, CreditCard } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const BADGE_ICONS = [Truck, Shield, RotateCcw, CreditCard];

const DEFAULT_FOOTER = {
  description: "Votre spécialiste en pièces automobiles neuves et d'occasion.",
  phone: '+221 77 000 00 00',
  email: 'contact@dva-auto.sn',
  address: 'Dakar, Sénégal',
  copyright: `© ${new Date().getFullYear()} DVA Auto. Tous droits réservés.`,
  badges: [
    { title: 'Livraison rapide', desc: 'Partout au Sénégal' },
    { title: 'Paiement sécurisé', desc: 'Wave, Orange Money, CB' },
    { title: 'Retours garantis', desc: 'Sous conditions' },
    { title: 'Pièces garanties', desc: 'Qualité certifiée' },
  ],
};

export default function Footer() {
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axiosClient.get('/settings/footer')
      .then((r) => { if (r.data.footer && Object.keys(r.data.footer).length) setFooter(r.data.footer); })
      .catch(() => {});
    axiosClient.get('/categories')
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-dva-blue-dark text-white mt-12">
      {/* Bande de réassurance */}
      <div className="border-b border-dva-blue/40">
        <div className="container-main py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {(footer.badges || DEFAULT_FOOTER.badges).map(({ title, desc }, i) => {
            const Icon = BADGE_ICONS[i] || Shield;
            return (
              <div key={title} className="flex items-center gap-3">
                <div className="bg-dva-blue rounded-full p-2.5 flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-blue-200 text-xs">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container-main py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* À propos */}
        <div>
          <div className="mb-4">
            <img
              src={footer.logo_url || '/lago_bi.png'}
              alt="DVA Auto"
              className="h-12 w-auto object-contain"
              onError={(e) => { e.target.src = '/lago_bi.png'; }}
            />
          </div>
          <p className="text-blue-200 text-sm leading-relaxed">{footer.description}</p>
        </div>

        {/* Catégories — chargées depuis la BDD */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Catégories</h3>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link to={`/catalogue?category=${cat.slug}`}
                  className="text-blue-200 hover:text-white text-sm transition-colors">
                  {cat.name}
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
              { label: 'Qui sommes-nous ?',          to: '/informations/qui-sommes-nous' },
              { label: 'Livraison & retours',        to: '/informations/livraison-retours' },
              { label: 'Mentions légales',           to: '/informations/mentions-legales' },
              { label: 'CGV',                        to: '/informations/cgv' },
              { label: 'Politique de confidentialité', to: '/informations/politique-confidentialite' },
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
              <span>{footer.phone}</span>
            </li>
            <li className="flex items-center gap-2 text-blue-200 text-sm">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span>{footer.email}</span>
            </li>
            <li className="flex items-start gap-2 text-blue-200 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{footer.address}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bas du footer */}
      <div className="border-t border-dva-blue/40 py-4">
        <div className="container-main flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-blue-300 text-xs">{footer.copyright}</p>
          <p className="text-blue-300 text-xs">Paiement sécurisé SSL · Wave · Orange Money</p>
        </div>
      </div>
    </footer>
  );
}
