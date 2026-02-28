import React from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronRight, Car, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function MobileMenu({ isOpen, onClose, categories }) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panneau latéral */}
      <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-slide-down">
        {/* En-tête */}
        <div className="bg-dva-blue flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-xl">D</span>
            <span className="text-dva-red font-black text-xl">VA</span>
            <span className="text-white text-sm ml-1">Pièces Auto</span>
          </div>
          <button onClick={onClose} className="text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Catégories</p>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalogue?category=${cat.slug}`}
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-dva-blue-muted hover:text-dva-blue border-b border-gray-50"
            >
              <span className="font-medium">{cat.name}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          ))}

          <div className="mt-4 px-4 space-y-2">
            <Link to="/catalogue" onClick={onClose} className="btn-outline w-full text-center block">
              Tous les produits
            </Link>
            <Link to="/recherche-vehicule" onClick={onClose}
              className="flex items-center justify-center gap-2 w-full text-center py-2 text-sm text-dva-blue border border-dva-blue rounded-lg hover:bg-dva-blue-muted">
              <Car className="w-4 h-4" /> Recherche par véhicule
            </Link>
          </div>
        </nav>

        {/* Actions utilisateur */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          {user ? (
            <>
              <p className="text-sm text-gray-500">Connecté en tant que <strong>{user.first_name}</strong></p>
              <Link to="/mon-compte" onClick={onClose} className="btn-secondary w-full text-center block">
                Mon compte
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-2 text-sm text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50">
                  <Shield className="w-4 h-4" /> Administration
                </Link>
              )}
              <button onClick={() => { logout(); onClose(); }} className="btn-ghost w-full">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" onClick={onClose} className="btn-secondary w-full text-center block">
                Connexion
              </Link>
              <Link to="/inscription" onClick={onClose} className="btn-outline w-full text-center block">
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
