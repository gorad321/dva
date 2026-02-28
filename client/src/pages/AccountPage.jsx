import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, Settings, Lock, ChevronRight, Eye } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { ToastProvider, useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../api/ordersApi';
import { formatCFA } from '../utils/currency';

const STATUS_LABELS = {
  pending: { label: 'En attente', color: 'text-orange-600 bg-orange-50' },
  confirmed: { label: 'Confirmée', color: 'text-blue-600 bg-blue-50' },
  shipped: { label: 'Expédiée', color: 'text-purple-600 bg-purple-50' },
  delivered: { label: 'Livrée', color: 'text-green-600 bg-green-50' },
};

function ProfileTab() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '' });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await ordersApi.updateProfile(form);
      toast.success('Profil mis à jour avec succès');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur de mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <h3 className="font-bold text-gray-800">Informations personnelles</h3>
      <Input label="Email" value={user?.email || ''} disabled className="bg-gray-50 cursor-not-allowed" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Prénom" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
        <Input label="Nom" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
      </div>
      <Input label="Téléphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} type="tel" />
      <Button onClick={handleSave} loading={saving}>Sauvegarder</Button>
    </div>
  );
}

function PasswordTab() {
  const toast = useToast();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSave = async () => {
    const errs = {};
    if (!form.current_password) errs.current_password = 'Requis';
    if (form.new_password.length < 8) errs.new_password = 'Min. 8 caractères';
    if (!/[A-Z]/.test(form.new_password)) errs.new_password = 'Doit contenir une majuscule';
    if (!/[0-9]/.test(form.new_password)) errs.new_password = 'Doit contenir un chiffre';
    if (form.new_password !== form.confirm) errs.confirm = 'Ne correspond pas';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await ordersApi.changePassword({ current_password: form.current_password, new_password: form.new_password });
      toast.success('Mot de passe modifié');
      setForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <h3 className="font-bold text-gray-800">Changer le mot de passe</h3>
      <Input label="Mot de passe actuel" type="password" value={form.current_password}
        onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))} error={errors.current_password} />
      <Input label="Nouveau mot de passe" type="password" value={form.new_password}
        onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))} error={errors.new_password} />
      <Input label="Confirmer le nouveau mot de passe" type="password" value={form.confirm}
        onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} error={errors.confirm} />
      <Button onClick={handleSave} loading={saving}>Modifier le mot de passe</Button>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getOrders()
      .then((r) => setOrders(r.data.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  if (!orders.length) return (
    <div className="text-center py-12">
      <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
      <p className="text-gray-500">Aucune commande pour le moment</p>
      <Link to="/catalogue" className="btn-primary mt-4 inline-block">Découvrir le catalogue</Link>
    </div>
  );

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-gray-800">Mes commandes ({orders.length})</h3>
      {orders.map((order) => {
        const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.confirmed;
        return (
          <Link key={order.id} to={`/commande/confirmation/${order.id}`}
            className="block bg-white rounded-xl border border-gray-200 hover:border-dva-blue p-4 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900">#{String(order.id).padStart(6, '0')}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-dva-red">{formatCFA(order.total_amount)}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>{order.item_count} article{order.item_count > 1 ? 's' : ''}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function AccountContent() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  const tabs = [
    { id: 'orders', label: 'Mes commandes', icon: Package },
    { id: 'profile', label: 'Mon profil', icon: User },
    { id: 'password', label: 'Mot de passe', icon: Lock },
  ];

  return (
    <div className="container-main py-8">
      <SEOMeta title="Mon compte" />
      <h1 className="section-title mb-6 flex items-center gap-3">
        <User className="w-7 h-7 text-dva-blue" />
        Mon compte
      </h1>

      {/* Info utilisateur */}
      <div className="bg-dva-blue rounded-xl p-4 text-white mb-6 flex items-center justify-between">
        <div>
          <p className="font-bold text-lg">{user?.first_name} {user?.last_name}</p>
          <p className="text-blue-200 text-sm">{user?.email}</p>
        </div>
        <button onClick={logout} className="text-blue-200 hover:text-white text-sm underline">Déconnexion</button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation onglets */}
        <aside className="md:w-48 flex-shrink-0">
          <nav className="bg-white rounded-xl shadow-card overflow-hidden">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-gray-50 transition-colors ${
                  activeTab === id
                    ? 'bg-dva-blue-muted text-dva-blue border-l-2 border-l-dva-blue'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Contenu */}
        <div className="flex-1 bg-white rounded-xl shadow-card p-6">
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'password' && <PasswordTab />}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ToastProvider>
      <AccountContent />
    </ToastProvider>
  );
}
