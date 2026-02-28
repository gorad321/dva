import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import axiosClient from '../api/axiosClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await axiosClient.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOMeta title="Mot de passe oublié" />
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-1">
              <span className="text-dva-blue font-black text-4xl">D</span>
              <span className="text-dva-red font-black text-4xl">VA</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">Mot de passe oublié</h1>
            <p className="text-gray-500 mt-1">Entrez votre email pour recevoir un lien de réinitialisation</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8">
            {sent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Email envoyé !</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Si un compte existe avec <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
                  Vérifiez aussi vos spams.
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  En mode développement, le lien s'affiche dans la console du serveur.
                </p>
                <Link to="/connexion" className="text-dva-blue font-medium hover:underline text-sm">
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Adresse email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    autoComplete="email"
                    required
                  />
                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    Envoyer le lien de réinitialisation
                  </Button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-sm text-gray-600 mt-5">
            <Link to="/connexion" className="flex items-center justify-center gap-1 text-dva-blue hover:underline">
              <ArrowLeft className="w-4 h-4" /> Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
