/**
 * DVA - Application principale avec routes React Router
 */
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Spinner from './components/common/Spinner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Lazy loading des pages
const HomePage              = lazy(() => import('./pages/HomePage'));
const CatalogPage           = lazy(() => import('./pages/CatalogPage'));
const ProductPage           = lazy(() => import('./pages/ProductPage'));
const CartPage              = lazy(() => import('./pages/CartPage'));
const CheckoutPage          = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const LoginPage             = lazy(() => import('./pages/LoginPage'));
const RegisterPage          = lazy(() => import('./pages/RegisterPage'));
const AccountPage           = lazy(() => import('./pages/AccountPage'));
const ForgotPasswordPage    = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage     = lazy(() => import('./pages/ResetPasswordPage'));
const VehicleSearchPage     = lazy(() => import('./pages/VehicleSearchPage'));
const AdminPage             = lazy(() => import('./pages/AdminPage'));
const InfoPage              = lazy(() => import('./pages/InfoPage'));

const PageSpinner = () => (
  <div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>
);

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>;
  if (user) return <Navigate to="/mon-compte" replace />;
  return children;
}

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdmin && <Header />}
      <main className="flex-1">
        <Suspense fallback={<PageSpinner />}>
          <Routes>
              {/* Publiques */}
              <Route path="/"                       element={<HomePage />} />
              <Route path="/catalogue"              element={<CatalogPage />} />
              <Route path="/produit/:slug"           element={<ProductPage />} />
              <Route path="/panier"                  element={<CartPage />} />
              <Route path="/recherche-vehicule"      element={<VehicleSearchPage />} />
              <Route path="/informations/:slug"      element={<InfoPage />} />

              {/* Checkout — accessible invités et connectés */}
              <Route path="/commande" element={<CheckoutPage />} />
              <Route path="/commande/confirmation/:id" element={<OrderConfirmationPage />} />

              {/* Protégées client */}
              <Route path="/mon-compte" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

              {/* Invité */}
              <Route path="/connexion"   element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/inscription" element={<GuestRoute><RegisterPage /></GuestRoute>} />
              <Route path="/mot-de-passe-oublie" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
              <Route path="/reinitialisation-mot-de-passe/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

              {/* Admin */}
              <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="/admin"   element={<AdminRoute><AdminPage /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={
                <div className="container-main py-20 text-center">
                  <h1 className="text-6xl font-bold text-dva-blue mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-8">Page introuvable</p>
                  <a href="/" className="btn-primary">Retour à l'accueil</a>
                </div>
              } />
            </Routes>
        </Suspense>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
