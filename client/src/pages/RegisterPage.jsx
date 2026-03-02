import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Check } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8 caractères minimum', ok: password.length >= 8 },
    { label: 'Une majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Un chiffre', ok: /[0-9]/.test(password) },
  ];
  return (
    <div className="mt-1 space-y-1">
      {checks.map(({ label, ok }) => (
        <div key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
          <Check className={`w-3 h-3 ${ok ? 'text-green-500' : 'text-gray-300'}`} />
          {label}
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Prénom requis';
    if (!form.last_name.trim()) errs.last_name = 'Nom requis';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide';
    if (form.password.length < 8) errs.password = 'Minimum 8 caractères';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Le mot de passe doit contenir une majuscule';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Le mot de passe doit contenir un chiffre';
    if (form.password !== form.confirm_password) errs.confirm_password = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ first_name: form.first_name, last_name: form.last_name, email: form.email, password: form.password });
      navigate('/mon-compte');
    } catch (err) {
      setGlobalError(err.response?.data?.error?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOMeta title="Créer un compte" description="Créez votre compte DVA Auto et accédez à toutes nos fonctionnalités" />
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src="/logo-dva.jpg" alt="DVA Auto" className="h-20 w-auto object-contain mx-auto" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">Créer un compte</h1>
            <p className="text-gray-500 mt-1">Rejoignez des milliers de clients satisfaits</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8">
            {globalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm">{globalError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom" value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} error={errors.first_name} autoComplete="given-name" required />
                <Input label="Nom" value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} error={errors.last_name} autoComplete="family-name" required />
              </div>
              <Input label="Email" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} error={errors.email} placeholder="votre@email.com" autoComplete="email" required />

              <div>
                <div className="relative">
                  <Input label="Mot de passe" type={showPwd ? 'text' : 'password'} value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)} error={errors.password}
                    placeholder="••••••••" autoComplete="new-password" required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && <PasswordStrength password={form.password} />}
              </div>

              <Input label="Confirmer le mot de passe" type="password" value={form.confirm_password}
                onChange={(e) => handleChange('confirm_password', e.target.value)} error={errors.confirm_password}
                placeholder="••••••••" autoComplete="new-password" required />

              <Button type="submit" loading={loading} className="w-full" size="lg">
                <UserPlus className="w-4 h-4" /> Créer mon compte
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-600 mt-5">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-dva-blue font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </>
  );
}
