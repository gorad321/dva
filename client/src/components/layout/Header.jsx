/**
 * DVA - En-tête principal (Header)
 * Design : fond bleu foncé, logo blanc, navigation, icônes panier/compte
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, ChevronDown, LogOut, Package, Car, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import SearchBar from './SearchBar';
import MobileMenu from './MobileMenu';
import axiosClient from '../../api/axiosClient';

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axiosClient.get('/categories')
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40">
      {/* Bandeau supérieur */}
      <div className="bg-dva-blue text-white text-xs py-1 text-center hidden md:block">
        Pièces de froid auto neuves et d'occasions &nbsp;|&nbsp; Paiement sécurisé
      </div>

      {/* Barre principale */}
      <div className="bg-dva-blue-light shadow-md">
        <div className="container-main flex items-center gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="lago_bi.png"
              alt="DVA"
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Barre de recherche (desktop) */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <SearchBar />
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Compte utilisateur */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 text-white hover:text-blue-200 transition-colors px-2 py-1 rounded"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:block text-sm font-medium">{user.first_name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl w-48 py-1 z-50 animate-fade-in">
                    <Link
                      to="/mon-compte"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-dva-blue-muted hover:text-dva-blue"
                    >
                      <Package className="w-4 h-4" />
                      Mon compte
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50"
                      >
                        <Shield className="w-4 h-4" />
                        Administration
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-dva-red"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/connexion"
                className="flex items-center gap-1.5 text-white hover:text-blue-200 transition-colors px-2 py-1"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:block text-sm font-medium">Connexion</span>
              </Link>
            )}

            {/* Panier */}
            <Link
              to="/panier"
              className="relative flex items-center gap-1.5 text-white hover:text-blue-200 transition-colors px-2 py-1"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:block text-sm font-medium">Panier</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-dva-red text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Bouton menu mobile */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white p-1"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Barre de recherche mobile */}
        <div className="md:hidden pb-3 px-4">
          <SearchBar />
        </div>
      </div>

      {/* Barre de navigation catégories (desktop) */}
      <nav className="bg-dva-blue-dark hidden md:block">
        <div className="container-main flex items-center gap-0">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalogue?category=${cat.slug}`}
              className="text-blue-100 hover:text-white hover:bg-dva-blue text-sm font-medium px-4 py-2.5 transition-colors whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            to="/recherche-vehicule"
            className="text-blue-100 hover:text-white hover:bg-dva-blue text-sm font-medium px-4 py-2.5 transition-colors flex items-center gap-1.5"
          >
            <Car className="w-4 h-4" /> Mon véhicule
          </Link>
          <Link
            to="/catalogue"
            className="text-blue-100 hover:text-white hover:bg-dva-blue text-sm font-medium px-4 py-2.5 transition-colors ml-auto"
          >
            Tous les produits →
          </Link>
        </div>
      </nav>

      {/* Fermer le menu utilisateur en cliquant ailleurs */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}

      {/* Menu mobile */}
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} />
    </header>
  );
}
