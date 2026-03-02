import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide';
    if (!form.password) errs.password = 'Mot de passe requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setGlobalError(err.response?.data?.error?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOMeta title="Connexion" description="Connectez-vous à votre compte DVA Auto" />
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src="/logo-dva.jpg" alt="DVA Auto" className="h-20 w-auto object-contain mx-auto" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">Connexion à votre compte</h1>
            <p className="text-gray-500 mt-1">Accédez à vos commandes et votre historique</p>
          </div>

          {/* Formulaire */}
          <div className="bg-white rounded-2xl shadow-card p-8">
            {globalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm">
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors((er) => ({ ...er, email: '' })); }}
                error={errors.email}
                placeholder="votre@email.com"
                autoComplete="email"
                required
              />

              <div className="relative">
                <Input
                  label="Mot de passe"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setErrors((er) => ({ ...er, password: '' })); }}
                  error={errors.password}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                <LogIn className="w-4 h-4" /> Se connecter
              </Button>

              <div className="text-center">
                <Link to="/mot-de-passe-oublie" className="text-sm text-gray-500 hover:text-dva-blue">
                  Mot de passe oublié ?
                </Link>
              </div>
            </form>
          </div>

          <p className="text-center text-sm text-gray-600 mt-5">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-dva-blue font-medium hover:underline">Créer un compte</Link>
          </p>
        </div>
      </div>
    </>
  );
}
