import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Smartphone, Shield, ChevronRight, Truck, ExternalLink, CheckCircle, Copy, Check, User, UserCheck, LogIn } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import { ToastProvider, useToast } from '../components/common/Toast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../api/ordersApi';
import { formatCFA } from '../utils/currency';

const PAYMENT_METHODS = [
  {
    id: 'wave',
    label: 'Wave',
    desc: 'Paiement mobile Wave Sénégal',
    icon: Smartphone,
    color: 'bg-blue-400',
  },
  {
    id: 'orange_money',
    label: 'Orange Money',
    desc: 'Paiement mobile Orange Money',
    icon: Smartphone,
    color: 'bg-orange-500',
  },
  {
    id: 'card',
    label: 'Carte bancaire',
    desc: 'Visa, Mastercard, CB',
    icon: CreditCard,
    color: 'bg-dva-blue',
  },
  {
    id: 'cash_on_delivery',
    label: 'Paiement à la livraison',
    desc: 'Payez en espèces à la réception de votre commande',
    icon: Truck,
    color: 'bg-green-600',
  },
];

/* ─── Étape 0 : Choix d'authentification (invités uniquement) ───────────────── */
function AuthChoicePanel({ onContinueAsGuest }) {
  const { login } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(loginEmail, loginPassword);
      // Le useEffect dans CheckoutForm gère la transition d'étape
    } catch (err) {
      setLoginError(err.response?.data?.error?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
      <h2 className="font-bold text-gray-800 text-lg">Comment souhaitez-vous commander ?</h2>

      {/* Option 1 : Continuer en tant qu'invité */}
      <button
        onClick={onContinueAsGuest}
        className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-dva-blue hover:bg-dva-blue-muted text-left transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-dva-blue flex items-center justify-center flex-shrink-0 transition-colors">
          <User className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">Continuer en tant qu'invité</p>
          <p className="text-xs text-gray-500">Commandez sans créer de compte</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
      </button>

      {/* Option 2 : Se connecter */}
      {!showLogin ? (
        <button
          onClick={() => setShowLogin(true)}
          className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-dva-blue hover:bg-dva-blue-muted text-left transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-dva-blue flex items-center justify-center flex-shrink-0 transition-colors">
            <LogIn className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Se connecter</p>
            <p className="text-xs text-gray-500">Accédez à vos informations enregistrées</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
        </button>
      ) : (
        <form onSubmit={handleLogin} className="border-2 border-dva-blue rounded-xl p-4 space-y-3">
          <p className="font-semibold text-gray-800 flex items-center gap-2">
            <LogIn className="w-4 h-4 text-dva-blue" /> Connexion
          </p>
          {loginError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {loginError}
            </div>
          )}
          <Input
            label="Email"
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            autoFocus
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={loginLoading} className="w-full" size="md">
            Se connecter
          </Button>
          <button
            type="button"
            onClick={() => setShowLogin(false)}
            className="w-full text-center text-sm text-gray-500 hover:underline"
          >
            Annuler
          </button>
        </form>
      )}

      {/* Option 3 : Créer un compte */}
      <Link
        to="/inscription"
        state={{ returnTo: '/commande' }}
        className="flex items-center gap-4 w-full p-4 border-2 border-gray-200 rounded-xl hover:border-dva-blue hover:bg-dva-blue-muted transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-dva-blue flex items-center justify-center flex-shrink-0 transition-colors">
          <UserCheck className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">Créer un compte</p>
          <p className="text-xs text-gray-500">Suivez vos commandes facilement</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
      </Link>
    </div>
  );
}

/* ─── Étape 3 : Notification de paiement ────────────────────────────────────── */
function PaymentNotification({ orderId, paymentUrl, method, amount, guestToken, onConfirm }) {
  const [copied, setCopied] = useState(false);
  const isWave = method === 'wave';

  const colors = isWave
    ? { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', title: 'text-blue-900', btn: 'bg-blue-500 hover:bg-blue-600' }
    : { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500', title: 'text-orange-900', btn: 'bg-orange-500 hover:bg-orange-600' };

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6 space-y-6">
      <div className={`rounded-xl p-5 ${colors.bg} ${colors.border} border`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isWave ? 'bg-blue-500' : 'bg-orange-500'}`}>
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className={`font-bold text-lg ${colors.title}`}>
              Commande #{String(orderId).padStart(6, '0')} créée !
            </p>
            <p className="text-sm text-gray-600">
              Effectuez le paiement pour valider votre commande
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200">
          <span className="text-sm text-gray-600">Montant à payer</span>
          <span className="font-black text-lg text-dva-red">{formatCFA(amount)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 text-center">
          Cliquez sur le bouton ci-dessous pour ouvrir{' '}
          <strong>{isWave ? 'Wave' : 'Orange Money'}</strong> et confirmer le paiement :
        </p>
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-colors ${colors.btn}`}
        >
          <Smartphone className="w-6 h-6" />
          Payer avec {isWave ? 'Wave' : 'Orange Money'}
          <ExternalLink className="w-5 h-5 opacity-75" />
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {copied
            ? <><Check className="w-4 h-4 text-green-500" /><span className="text-green-600">Lien copié !</span></>
            : <><Copy className="w-4 h-4" />Copier le lien de paiement</>
          }
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1.5">
        <p className="font-medium text-gray-800 mb-2">Comment payer :</p>
        {isWave ? (
          <>
            <p>① Cliquez sur le bouton "Payer avec Wave" ci-dessus</p>
            <p>② L'application Wave s'ouvre (ou la page web Wave)</p>
            <p>③ Confirmez le paiement de <strong>{formatCFA(amount)}</strong></p>
            <p>④ Revenez ici et cliquez "J'ai payé"</p>
          </>
        ) : (
          <>
            <p>① Cliquez sur le bouton "Payer avec Orange Money"</p>
            <p>② La page Orange Money s'ouvre</p>
            <p>③ Entrez votre code PIN pour valider <strong>{formatCFA(amount)}</strong></p>
            <p>④ Revenez ici et cliquez "J'ai payé"</p>
          </>
        )}
      </div>

      <Button onClick={onConfirm} size="lg" className="w-full" variant="secondary">
        <CheckCircle className="w-5 h-5" />
        J'ai effectué le paiement → Voir ma commande
      </Button>

      <p className="text-xs text-center text-gray-400">
        Votre commande sera confirmée automatiquement après vérification du paiement.
      </p>
    </div>
  );
}

/* ─── Formulaire principal ───────────────────────────────────────────────────── */
function CheckoutForm() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(user ? 1 : 0);
  const [isGuest, setIsGuest] = useState(!user);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wave');
  const [mobilePayment, setMobilePayment] = useState(null);

  const [guestEmail, setGuestEmail] = useState('');
  const [address, setAddress] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    address1: '', address2: '',
    city: '', postal_code: '',
    country: 'Sénégal',
    phone: user?.phone || '',
  });
  const [errors, setErrors] = useState({});

  const finalTotal = total;

  // Transition automatique quand l'utilisateur se connecte via le panel intégré
  useEffect(() => {
    if (user && step === 0) {
      setStep(1);
      setIsGuest(false);
      setAddress((prev) => ({
        ...prev,
        first_name: user.first_name || prev.first_name,
        last_name: user.last_name || prev.last_name,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const handleContinueAsGuest = () => {
    setIsGuest(true);
    setStep(1);
  };

  // Validation numéros sénégalais : mobile 7X XXX XX XX ou fixe 33 XXX XX XX
  const isValidSenegalPhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\.]/g, '');
    return /^(\+221|00221|221)?(7[0-8]|33)\d{7}$/.test(cleaned);
  };

  const validateStep1 = () => {
    const errs = {};
    if (!address.first_name.trim()) errs.first_name = 'Prénom requis';
    if (!address.last_name.trim()) errs.last_name = 'Nom requis';
    if (!address.address1.trim()) errs.address1 = 'Adresse requise';
    if (!address.city.trim()) errs.city = 'Ville requise';
    if (!address.phone.trim()) {
      errs.phone = 'Téléphone requis pour la livraison';
    } else if (!isValidSenegalPhone(address.phone)) {
      errs.phone = 'Numéro invalide — ex : +221 77 000 00 00 ou 77 000 00 00';
    }
    if (isGuest && guestEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      errs.guest_email = 'Email invalide';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddressChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const payload = {
        shipping_address: address,
        payment_method: paymentMethod,
      };
      if (isGuest) {
        if (guestEmail.trim()) payload.guest_email = guestEmail.trim();
        payload.items = items.map(({ product_id, quantity }) => ({ product_id, quantity }));
      }

      const res = await ordersApi.createOrder(payload);
      const { order, payment_url, guest_token } = res.data;

      if (payment_url) {
        // Paiement mobile : NE PAS vider le panier avant que l'utilisateur paie
        setMobilePayment({
          orderId: order.id,
          paymentUrl: payment_url,
          method: paymentMethod,
          amount: finalTotal,
          guestToken: guest_token || null,
        });
        setStep(3);
      } else {
        // Commande confirmée directement (carte simulée, livraison, ou PayTech indispo)
        await clearCart();
        const confirmPath = `/commande/confirmation/${order.id}${guest_token ? `?token=${guest_token}` : ''}`;
        if (paymentMethod === 'wave' || paymentMethod === 'orange_money') {
          toast.error('Le service de paiement mobile est temporairement indisponible. Votre commande est enregistrée — vous serez contacté pour le paiement.');
        }
        navigate(confirmPath);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !mobilePayment) {
    navigate('/panier');
    return null;
  }

  const stepLabels = isGuest
    ? ['Choix', 'Livraison', 'Paiement', ...(mobilePayment ? ['Confirmer'] : [])]
    : ['Livraison', 'Paiement', ...(mobilePayment ? ['Confirmer'] : [])];
  const stepOffset = isGuest ? 0 : -1; // pour aligner l'indicateur

  return (
    <div className="container-main py-8">
      <SEOMeta title="Finaliser la commande" />
      <h1 className="section-title mb-6">Finaliser la commande</h1>

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-3 mb-8">
        {stepLabels.map((label, i) => {
          const stepNum = isGuest ? i : i + 1;
          return (
            <React.Fragment key={label}>
              <div className={`flex items-center gap-2 ${step > stepNum || step === stepNum ? 'text-dva-blue font-semibold' : 'text-gray-400'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  step > stepNum ? 'bg-green-500 text-white' :
                  step === stepNum ? 'bg-dva-blue text-white' : 'bg-gray-200 text-gray-500'
                }`}>{step > stepNum ? '✓' : i + 1}</span>
                <span className="hidden sm:block text-sm">{label}</span>
              </div>
              {i < stepLabels.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

          {/* ── Étape 0 : Choix authentification ───────────────────────────── */}
          {step === 0 && (
            <AuthChoicePanel onContinueAsGuest={handleContinueAsGuest} />
          )}

          {/* ── Étape 1 : Adresse ───────────────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
              <h2 className="font-bold text-gray-800 text-lg">Adresse de livraison</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Prénom" value={address.first_name} error={errors.first_name}
                  onChange={(e) => handleAddressChange('first_name', e.target.value)} required />
                <Input label="Nom" value={address.last_name} error={errors.last_name}
                  onChange={(e) => handleAddressChange('last_name', e.target.value)} required />
              </div>
              <Input label="Adresse" value={address.address1} error={errors.address1}
                onChange={(e) => handleAddressChange('address1', e.target.value)}
                placeholder="N° et nom de rue / quartier" required />
              <Input label="Complément d'adresse" value={address.address2}
                onChange={(e) => handleAddressChange('address2', e.target.value)}
                placeholder="Appartement, bâtiment, point de repère..." />
              <Input label="Ville" value={address.city} error={errors.city}
                onChange={(e) => handleAddressChange('city', e.target.value)} required />
              <Input label="Téléphone de livraison" value={address.phone} error={errors.phone}
                onChange={(e) => handleAddressChange('phone', e.target.value)}
                type="tel" placeholder="+221 77 000 00 00" required />
              {isGuest && (
                <div>
                  <Input
                    label="Email de confirmation (optionnel)"
                    type="email"
                    value={guestEmail}
                    error={errors.guest_email}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      if (errors.guest_email) setErrors((p) => ({ ...p, guest_email: '' }));
                    }}
                    placeholder="votre@email.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Renseignez votre email pour recevoir la confirmation de commande.
                  </p>
                </div>
              )}
              <Input label="Code postal (optionnel)" value={address.postal_code}
                onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                placeholder="Ex : 10700" />

              <Button onClick={() => validateStep1() && setStep(2)} size="lg" className="w-full">
                Continuer vers le paiement →
              </Button>
              {isGuest && (
                <button onClick={() => setStep(0)} className="w-full text-center text-sm text-gray-500 hover:underline">
                  ← Retour
                </button>
              )}
            </div>
          )}

          {/* ── Étape 2 : Méthode de paiement ──────────────────────────────── */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-card p-6 space-y-5">
              <h2 className="font-bold text-gray-800 text-lg">Mode de paiement</h2>

              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-700">Livraison à :</p>
                    <p className="text-gray-600">{address.first_name} {address.last_name}</p>
                    <p className="text-gray-600">{address.address1}</p>
                    <p className="text-gray-600">{address.city} — {address.phone}</p>
                    {isGuest && guestEmail && <p className="text-gray-500 text-xs mt-1">Confirmation : {guestEmail}</p>}
                  </div>
                  <button onClick={() => setStep(1)} className="text-dva-blue text-xs hover:underline">Modifier</button>
                </div>
              </div>

              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc, color }) => (
                  <label key={id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === id ? 'border-dva-blue bg-dva-blue-muted' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" name="payment" value={id} checked={paymentMethod === id}
                      onChange={() => setPaymentMethod(id)} className="sr-only" />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === id ? color + ' text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {(paymentMethod === 'wave' || paymentMethod === 'orange_money') && (
                <div className={`rounded-xl p-4 flex items-start gap-3 ${paymentMethod === 'wave' ? 'bg-blue-50 border border-blue-100' : 'bg-orange-50 border border-orange-100'}`}>
                  <Smartphone className={`w-5 h-5 flex-shrink-0 mt-0.5 ${paymentMethod === 'wave' ? 'text-blue-500' : 'text-orange-500'}`} />
                  <p className={`text-sm ${paymentMethod === 'wave' ? 'text-blue-700' : 'text-orange-700'}`}>
                    Après confirmation, vous recevrez un lien direct pour payer avec{' '}
                    <strong>{paymentMethod === 'wave' ? 'Wave' : 'Orange Money'}</strong>.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-3 border border-dashed border-gray-300 rounded-xl p-4">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-green-500" /> Saisie simulée — aucune donnée réelle transmise
                  </p>
                  <Input label="Numéro de carte" placeholder="4111 1111 1111 1111" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Expiration" placeholder="MM/AA" />
                    <Input label="CVV" placeholder="123" type="password" />
                  </div>
                  <Input label="Nom sur la carte" placeholder="Jean DIALLO" />
                </div>
              )}

              {paymentMethod === 'cash_on_delivery' && (
                <div className="border border-dashed border-green-300 rounded-xl p-4 bg-green-50 text-sm text-green-800 flex items-start gap-3">
                  <Truck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Paiement à la réception</p>
                    <p className="text-green-700">Vous réglez en espèces directement au livreur. Aucun paiement maintenant.</p>
                  </div>
                </div>
              )}

              <Button onClick={handlePlaceOrder} loading={submitting} size="lg" className="w-full">
                {paymentMethod === 'cash_on_delivery'
                  ? `🚚 Confirmer la commande — ${formatCFA(finalTotal)}`
                  : `🔒 Confirmer et payer ${formatCFA(finalTotal)}`}
              </Button>
              <button onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-500 hover:underline">
                ← Retour à la livraison
              </button>
            </div>
          )}

          {/* ── Étape 3 : Notification paiement mobile ─────────────────────── */}
          {step === 3 && mobilePayment && (
            <PaymentNotification
              orderId={mobilePayment.orderId}
              paymentUrl={mobilePayment.paymentUrl}
              method={mobilePayment.method}
              amount={mobilePayment.amount}
              guestToken={mobilePayment.guestToken}
              onConfirm={async () => {
                // Vider le panier seulement quand l'utilisateur confirme avoir payé
                await clearCart();
                const confirmPath = `/commande/confirmation/${mobilePayment.orderId}?payment=pending${mobilePayment.guestToken ? `&token=${mobilePayment.guestToken}` : ''}`;
                navigate(confirmPath);
              }}
            />
          )}
        </div>

        {/* Mini récapitulatif */}
        {step > 0 && step < 3 && (
          <div className="bg-white rounded-xl shadow-card p-5 h-fit sticky top-24">
            <h3 className="font-bold text-gray-800 mb-4">Votre commande</h3>
            <div className="space-y-2 text-sm mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span className="text-gray-600 truncate">{item.name} ×{item.quantity}</span>
                  <span className="font-medium whitespace-nowrap">{formatCFA(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span className="text-dva-red">{formatCFA(finalTotal)}</span>
              </div>
              <p className="text-xs text-dva-blue">Livraison calculée après confirmation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ToastProvider>
      <CheckoutForm />
    </ToastProvider>
  );
}
