import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Shield, ChevronRight } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import { ToastProvider, useToast } from '../components/common/Toast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useCart } from '../contexts/CartContext';
import { ordersApi } from '../api/ordersApi';
import { formatCFA, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../utils/currency';

const PAYMENT_METHODS = [
  {
    id: 'wave',
    label: 'Wave',
    desc: 'Paiement mobile Wave Sénégal',
    icon: Smartphone,
    color: 'bg-blue-400',
    phoneLabel: 'Numéro Wave',
  },
  {
    id: 'orange_money',
    label: 'Orange Money',
    desc: 'Paiement mobile Orange Money',
    icon: Smartphone,
    color: 'bg-orange-500',
    phoneLabel: 'Numéro Orange Money',
  },
  {
    id: 'card',
    label: 'Carte bancaire',
    desc: 'Visa, Mastercard, CB',
    icon: CreditCard,
    color: 'bg-dva-blue',
    phoneLabel: null,
  },
];

function CheckoutForm() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wave');
  const [mobilePhone, setMobilePhone] = useState('');

  const [address, setAddress] = useState({
    first_name: '', last_name: '', address1: '', address2: '',
    city: '', postal_code: '', country: 'Sénégal', phone: '',
  });
  const [errors, setErrors] = useState({});

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const finalTotal = total + shipping;

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
    if ((paymentMethod === 'wave' || paymentMethod === 'orange_money') && !mobilePhone.trim()) {
      toast.error('Veuillez saisir votre numéro de téléphone pour le paiement mobile');
      return;
    }
    setSubmitting(true);
    try {
      const res = await ordersApi.createOrder({
        shipping_address: address,
        payment_method: paymentMethod,
      });
      await clearCart();
      navigate(`/commande/confirmation/${res.data.order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/panier');
    return null;
  }

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod);

  return (
    <div className="container-main py-8">
      <SEOMeta title="Finaliser la commande" />
      <h1 className="section-title mb-6">Finaliser la commande</h1>

      {/* Étapes */}
      <div className="flex items-center gap-3 mb-8">
        {['Livraison', 'Paiement'].map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 ${step > i + 1 || step === i + 1 ? 'text-dva-blue font-semibold' : 'text-gray-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1 ? 'bg-green-500 text-white' :
                step === i + 1 ? 'bg-dva-blue text-white' : 'bg-gray-200 text-gray-500'
              }`}>{step > i + 1 ? '✓' : i + 1}</span>
              <span className="hidden sm:block text-sm">{label}</span>
            </div>
            {i < 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire */}
        <div className="lg:col-span-2">
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

          {step === 2 && (
            <div className="bg-white rounded-xl shadow-card p-6 space-y-5">
              <h2 className="font-bold text-gray-800 text-lg">Mode de paiement</h2>

              {/* Récapitulatif livraison */}
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

              {/* Formulaire selon méthode */}
              {(paymentMethod === 'wave' || paymentMethod === 'orange_money') && (
                <div className="space-y-3 border border-dashed border-gray-300 rounded-xl p-4">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-green-500" /> Paiement simulé — aucune transaction réelle effectuée
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedMethod.phoneLabel} *
                    </label>
                    <input
                      type="tel"
                      value={mobilePhone}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      placeholder="+221 77 000 00 00"
                      className="input-dva"
                    />
                  </div>
                  <div className={`rounded-lg p-3 text-sm ${paymentMethod === 'wave' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                    <Smartphone className="w-4 h-4 inline mr-1" />
                    {paymentMethod === 'wave'
                      ? 'Un code de confirmation sera envoyé à votre numéro Wave (simulation).'
                      : 'Un code de confirmation Orange Money vous sera envoyé par SMS (simulation).'}
                  </div>
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

              <Button onClick={handlePlaceOrder} loading={submitting} size="lg" className="w-full">
                🔒 Confirmer et payer {formatCFA(finalTotal)}
              </Button>
              <button onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-500 hover:underline">
                ← Retour à la livraison
              </button>
            </div>
          )}
        </div>

        {/* Mini récapitulatif */}
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
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span><span>{formatCFA(total)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Livraison</span>
              <span className={shipping === 0 ? 'text-green-600' : ''}>
                {shipping === 0 ? 'Gratuite' : formatCFA(shipping)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-dva-red">{formatCFA(finalTotal)}</span>
            </div>
          </div>
        </div>
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
