import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Smartphone, Shield, ChevronRight, Truck, ExternalLink, CheckCircle, Copy, Check } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import { ToastProvider, useToast } from '../components/common/Toast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useCart } from '../contexts/CartContext';
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

/* ─── Étape 3 : Notification de paiement ────────────────────────────────────── */
function PaymentNotification({ orderId, paymentUrl, method, amount, onConfirm }) {
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
      {/* En-tête */}
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

      {/* Bouton principal de paiement */}
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

        {/* Copier le lien */}
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

      {/* Instructions */}
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

      {/* Bouton confirmation */}
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
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wave');

  // Données de paiement mobile (étape 3)
  const [mobilePayment, setMobilePayment] = useState(null); // { orderId, paymentUrl, method, amount }

  const [address, setAddress] = useState({
    first_name: '', last_name: '', address1: '', address2: '',
    city: '', postal_code: '', country: 'Sénégal', phone: '',
  });
  const [errors, setErrors] = useState({});

  const finalTotal = total;

  const validateStep1 = () => {
    const errs = {};
    if (!address.first_name.trim()) errs.first_name = 'Prénom requis';
    if (!address.last_name.trim()) errs.last_name = 'Nom requis';
    if (!address.address1.trim()) errs.address1 = 'Adresse requise';
    if (!address.city.trim()) errs.city = 'Ville requise';
    if (!address.phone.trim()) errs.phone = 'Téléphone requis pour la livraison';
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
      const res = await ordersApi.createOrder({
        shipping_address: address,
        payment_method: paymentMethod,
      });
      const { order, payment_url } = res.data;
      await clearCart();

      if (payment_url) {
        // Paiement mobile : afficher le panneau de notification (étape 3)
        setMobilePayment({
          orderId: order.id,
          paymentUrl: payment_url,
          method: paymentMethod,
          amount: finalTotal,
        });
        setStep(3);
      } else {
        // Carte / cash on delivery : aller directement à la confirmation
        navigate(`/commande/confirmation/${order.id}`);
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

  // Labels des étapes selon le mode de paiement
  const stepLabels = ['Livraison', 'Paiement', ...(mobilePayment ? ['Confirmer'] : [])];

  return (
    <div className="container-main py-8">
      <SEOMeta title="Finaliser la commande" />
      <h1 className="section-title mb-6">Finaliser la commande</h1>

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-3 mb-8">
        {stepLabels.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 ${step > i + 1 || step === i + 1 ? 'text-dva-blue font-semibold' : 'text-gray-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1 ? 'bg-green-500 text-white' :
                step === i + 1 ? 'bg-dva-blue text-white' : 'bg-gray-200 text-gray-500'
              }`}>{step > i + 1 ? '✓' : i + 1}</span>
              <span className="hidden sm:block text-sm">{label}</span>
            </div>
            {i < stepLabels.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Ville" value={address.city} error={errors.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)} required />
                <Input label="Code postal (optionnel)" value={address.postal_code}
                  onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                  placeholder="Ex : 10700" />
              </div>
              <Input label="Téléphone de livraison" value={address.phone} error={errors.phone}
                onChange={(e) => handleAddressChange('phone', e.target.value)}
                type="tel" placeholder="+221 77 000 00 00" required />
              <Button onClick={() => validateStep1() && setStep(2)} size="lg" className="w-full">
                Continuer vers le paiement →
              </Button>
            </div>
          )}

          {/* ── Étape 2 : Méthode de paiement ──────────────────────────────── */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-card p-6 space-y-5">
              <h2 className="font-bold text-gray-800 text-lg">Mode de paiement</h2>

              {/* Récapitulatif adresse */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-700">Livraison à :</p>
                    <p className="text-gray-600">{address.first_name} {address.last_name}</p>
                    <p className="text-gray-600">{address.address1}</p>
                    <p className="text-gray-600">{address.city} — {address.phone}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-dva-blue text-xs hover:underline">Modifier</button>
                </div>
              </div>

              {/* Choix paiement */}
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

              {/* Info selon méthode */}
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
              onConfirm={() => navigate(`/commande/confirmation/${mobilePayment.orderId}?payment=pending`)}
            />
          )}
        </div>

        {/* Mini récapitulatif */}
        {step < 3 && (
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
