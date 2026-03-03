import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home, Clock, XCircle, RefreshCw } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import Spinner from '../components/common/Spinner';
import { ordersApi } from '../api/ordersApi';
import { formatCFA } from '../utils/currency';

const POLL_INTERVAL_MS = 5000; // Vérifier le statut toutes les 5s

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Capturer le token invité une seule fois au montage (avant nettoyage URL)
  const [guestToken] = useState(() => searchParams.get('token'));

  // ── Charger la commande ───────────────────────────────────────────────────
  const loadOrder = useCallback(() => {
    return ordersApi.getOrderById(id, guestToken)
      .then((res) => setOrder(res.data.order))
      .catch((err) => {
        if (err.response?.status === 404 || err.response?.status === 401) {
          setNotFound(true);
        }
      });
  }, [id, guestToken]);

  useEffect(() => {
    loadOrder().finally(() => setLoading(false));
  }, [loadOrder]);

  // ── Nettoyer le token de l'URL après chargement (sécurité) ───────────────
  // Le token reste en mémoire (state) pour les requêtes de polling.
  // On le retire de l'URL pour éviter la fuite via historique/referrer.
  useEffect(() => {
    if (order && guestToken) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
  }, [order, guestToken]);

  // ── Polling : vérifier toutes les 5s si paiement mobile en attente ───────
  // S'arrête automatiquement dès que payment_status !== 'pending'.
  useEffect(() => {
    if (!order) return;
    const isMobilePay = order.payment_method === 'wave' || order.payment_method === 'orange_money';
    if (!isMobilePay || order.payment_status !== 'pending') return;

    const interval = setInterval(() => {
      loadOrder();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [order?.id, order?.payment_status, loadOrder]);

  // ── Statuts dérivés uniquement depuis le backend (jamais depuis ?payment=) ─
  const isCancelled = order?.status === 'cancelled';
  const isPending   = !isCancelled && order?.payment_status === 'pending'
                      && order?.payment_method !== 'cash_on_delivery';
  const isPolling   = isPending && (order?.payment_method === 'wave' || order?.payment_method === 'orange_money');

  // ── Page de chargement ────────────────────────────────────────────────────
  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  // ── Commande introuvable ──────────────────────────────────────────────────
  if (notFound || !order) {
    return (
      <div className="container-main py-20 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Commande introuvable</h1>
        <p className="text-gray-500 mb-8">
          Cette commande n'existe pas ou vous n'avez pas les droits pour y accéder.
        </p>
        <Link to="/" className="btn-primary">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <>
      <SEOMeta title={`Commande #${String(id).padStart(6, '0')}`} />
      <div className="container-main py-12 max-w-2xl mx-auto text-center">

        {/* ── Icône & titre selon statut backend ─────────────────────────── */}
        {isCancelled ? (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Paiement annulé</h1>
            <p className="text-gray-500 mb-8">
              Le paiement n'a pas abouti. Aucun montant n'a été débité.
            </p>
          </>
        ) : isPending ? (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">En attente de confirmation</h1>
            <p className="text-gray-500 mb-4">
              Votre commande est enregistrée. Elle sera traitée dès confirmation du paiement.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 mb-8">
              {isPolling ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Vérification du paiement en cours…
                </span>
              ) : (
                'Si vous avez déjà effectué le paiement, la confirmation peut prendre quelques minutes.'
              )}
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              {order.payment_method === 'cash_on_delivery' ? 'Commande enregistrée !' : 'Commande confirmée !'}
            </h1>
            <p className="text-gray-500 mb-8">
              {order.payment_method === 'cash_on_delivery'
                ? 'Vous réglerez à la livraison. Nous préparons votre commande.'
                : 'Merci pour votre commande. Vous recevrez un email de confirmation.'}
            </p>
          </>
        )}

        {/* ── Numéro de commande ──────────────────────────────────────────── */}
        <div className={`rounded-xl p-5 mb-8 ${isCancelled ? 'bg-red-50' : isPending ? 'bg-yellow-50' : 'bg-dva-blue-muted'}`}>
          <p className="text-sm text-gray-600">Numéro de commande</p>
          <p className={`text-2xl font-black ${isCancelled ? 'text-red-600' : isPending ? 'text-yellow-700' : 'text-dva-blue'}`}>
            #{String(id).padStart(6, '0')}
          </p>
        </div>

        {/* ── Étapes de suivi ─────────────────────────────────────────────── */}
        {!isCancelled && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: CheckCircle, label: isPending ? 'En attente' : 'Confirmée', done: !isPending, pending: isPending },
              { icon: Package,     label: 'En préparation', done: false },
              { icon: Truck,       label: 'Livraison',      done: false },
            ].map(({ icon: Icon, label, done, pending }) => (
              <div key={label} className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${
                  done ? 'bg-green-100' : pending ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${done ? 'text-green-500' : pending ? 'text-yellow-500' : 'text-gray-400'}`} />
                </div>
                <p className={`text-sm font-medium ${done ? 'text-green-600' : pending ? 'text-yellow-600' : 'text-gray-400'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Récapitulatif commande ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-card p-5 mb-8 text-left">
          <h3 className="font-bold text-gray-800 mb-4">Récapitulatif</h3>
          <div className="space-y-2 text-sm mb-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between gap-2">
                <span className="text-gray-600">{item.product_name} ×{item.quantity}</span>
                <span className="font-medium">{formatCFA(item.unit_price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span className="text-dva-red">{formatCFA(order.total_amount)}</span>
            </div>
            <p className="text-xs text-dva-blue">Les frais de livraison vous seront communiqués séparément.</p>
          </div>
          {order.shipping_address && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Livraison à :</p>
              <p className="text-sm text-gray-700">
                {order.shipping_address.first_name} {order.shipping_address.last_name}<br />
                {order.shipping_address.address1}<br />
                {order.shipping_address.postal_code} {order.shipping_address.city}
              </p>
            </div>
          )}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isCancelled ? (
            <Link to="/panier" className="btn-primary flex items-center justify-center gap-2">
              Réessayer le paiement
            </Link>
          ) : guestToken ? (
            <Link to="/inscription" className="btn-secondary flex items-center justify-center gap-2">
              <Package className="w-4 h-4" /> Créer un compte pour suivre mes commandes
            </Link>
          ) : (
            <Link to="/mon-compte" className="btn-secondary flex items-center justify-center gap-2">
              <Package className="w-4 h-4" /> Mes commandes
            </Link>
          )}
          <Link to="/" className="btn-outline flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> Retour à l'accueil
          </Link>
        </div>

      </div>
    </>
  );
}
