import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Check, Eye, EyeOff } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import axiosClient from '../api/axiosClient';

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

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ new_password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (form.new_password.length < 8) errs.new_password = 'Minimum 8 caractères';
    else if (!/[A-Z]/.test(form.new_password)) errs.new_password = 'Doit contenir une majuscule';
    else if (!/[0-9]/.test(form.new_password)) errs.new_password = 'Doit contenir un chiffre';
    if (form.new_password !== form.confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await axiosClient.post('/auth/reset-password', { token, new_password: form.new_password });
      setSuccess(true);
      setTimeout(() => navigate('/connexion'), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Lien invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOMeta title="Réinitialiser le mot de passe" />
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-1">
              <span className="text-dva-blue font-black text-4xl">D</span>
              <span className="text-dva-red font-black text-4xl">VA</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">Nouveau mot de passe</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8">
            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Mot de passe modifié !</h2>
                <p className="text-gray-600 text-sm">Vous allez être redirigé vers la connexion...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm">
                    {error}
                    <br />
                    <Link to="/mot-de-passe-oublie" className="underline mt-1 inline-block">Faire une nouvelle demande</Link>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Input
                        label="Nouveau mot de passe"
                        type={showPwd ? 'text' : 'password'}
                        value={form.new_password}
                        onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                        error={errors.new_password}
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {form.new_password && <PasswordStrength password={form.new_password} />}
                  </div>
                  <Input
                    label="Confirmer le mot de passe"
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                    error={errors.confirm}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    <Lock className="w-4 h-4" /> Enregistrer le nouveau mot de passe
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
