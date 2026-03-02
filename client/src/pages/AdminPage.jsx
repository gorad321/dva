import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Star, Tag, Layers, Award,
  TrendingUp, ShoppingCart, Pencil, Trash2, Plus, X, ChevronLeft, ChevronRight,
  Search, ToggleLeft, ToggleRight, Eye, Download, Image, Settings, Car,
  Disc, Filter, Circle, Zap, Droplets, Wrench, Gauge, Thermometer, Battery,
  Wind, Shield, Box, Cog, Bolt, Smartphone, Upload,
} from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import Spinner from '../components/common/Spinner';
import { ToastProvider, useToast } from '../components/common/Toast';
import Button from '../components/common/Button';
import { adminApi } from '../api/adminApi';
import { formatCFA } from '../utils/currency';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  pending:   { label: 'En attente',    color: 'text-orange-600 bg-orange-50' },
  confirmed: { label: 'Confirmée',     color: 'text-blue-600 bg-blue-50' },
  shipped:   { label: 'Expédiée',      color: 'text-purple-600 bg-purple-50' },
  delivered: { label: 'Livrée',        color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Annulée',       color: 'text-red-600 bg-red-50' },
};

function Badge({ status }) {
  const info = STATUS_LABELS[status] || { label: status, color: 'text-gray-600 bg-gray-100' };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span>;
}

function StatCard({ icon: Icon, label, value, color = 'text-dva-blue' }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-dva-blue-muted ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="p-1.5 rounded-lg border disabled:opacity-40 hover:bg-gray-50">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-gray-600">Page {page} / {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= pages}
        className="p-1.5 rounded-lg border disabled:opacity-40 hover:bg-gray-50">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <p className="text-gray-800 font-medium mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost px-4 py-2 text-sm">Annuler</button>
          <button onClick={onConfirm} className="bg-dva-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-dva-red-dark">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}  label="Chiffre d'affaires" value={formatCFA(data.stats.totalRevenue)} color="text-green-600" />
        <StatCard icon={ShoppingBag} label="Commandes"          value={data.stats.totalOrders} color="text-dva-blue" />
        <StatCard icon={Users}       label="Clients"            value={data.stats.totalUsers} color="text-purple-600" />
        <StatCard icon={Package}     label="Produits"           value={data.stats.totalProducts} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Dernières commandes</h3>
          <div className="space-y-3">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">#{String(o.id).padStart(6, '0')}</span>
                  <span className="text-gray-500 ml-2">{o.first_name} {o.last_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={o.status} />
                  <span className="font-bold text-dva-red">{formatCFA(o.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Top produits vendus</h3>
          <div className="space-y-3">
            {data.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-dva-blue-muted text-dva-blue text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-gray-700 truncate">{p.name}</span>
                <span className="text-gray-500">{p.qty_sold} vte{p.qty_sold > 1 ? 's' : ''}</span>
                <span className="font-medium text-dva-red">{formatCFA(p.revenue)}</span>
              </div>
            ))}
            {data.topProducts.length === 0 && <p className="text-gray-400 text-sm">Aucune vente pour le moment</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Répartition des statuts</h3>
          <div className="space-y-2">
            {data.ordersByStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between">
                <Badge status={status} />
                <span className="font-medium text-gray-700">{count} commande{count > 1 ? 's' : ''}</span>
              </div>
            ))}
            {data.ordersByStatus.length === 0 && <p className="text-gray-400 text-sm">Aucune commande</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Détail Commande ────────────────────────────────────────────────────

function OrderDetailModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getOrderDetails(orderId)
      .then((r) => setOrder(r.data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800">Commande #{String(orderId).padStart(6, '0')}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : order ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <Badge status={order.status} />
              <span className="text-gray-500">·</span>
              <span className="text-gray-600">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="text-gray-500">·</span>
              <span className="font-medium capitalize">{order.payment_method?.replace('_', ' ')}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-800 mb-1">Client</p>
              <p className="text-gray-600">{order.first_name} {order.last_name} — {order.email}</p>
              {order.user_phone && <p className="text-gray-500">{order.user_phone}</p>}
            </div>

            {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800 mb-1">Adresse de livraison</p>
                <p className="text-gray-600">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                <p className="text-gray-600">{order.shipping_address.address1}</p>
                {order.shipping_address.address2 && <p className="text-gray-600">{order.shipping_address.address2}</p>}
                <p className="text-gray-600">{order.shipping_address.city}{order.shipping_address.postal_code ? ` ${order.shipping_address.postal_code}` : ''}</p>
                {order.shipping_address.phone && <p className="text-gray-500">{order.shipping_address.phone}</p>}
              </div>
            )}

            <div>
              <p className="font-semibold text-gray-800 mb-2 text-sm">Articles ({order.items?.length || 0})</p>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.product_name} className="w-10 h-10 rounded object-cover border flex-shrink-0" />
                      : <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{item.product_name}</p>
                      <p className="text-gray-500">×{item.quantity} · {formatCFA(item.unit_price)}/unité</p>
                    </div>
                    <span className="font-bold text-dva-red whitespace-nowrap">{formatCFA(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>{order.shipping_amount === 0 ? 'Gratuite' : formatCFA(order.shipping_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base">
                <span>Total payé</span>
                <span className="text-dva-red">{formatCFA(order.total_amount)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-10">Impossible de charger la commande</p>
        )}
      </div>
    </div>
  );
}

// ─── Produit Modal (avec images, specs, compat) ───────────────────────────────

function ProductModal({ product, categories, brands, onSave, onClose }) {
  const toast = useToast();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState(product || {
    name: '', slug: '', short_description: '', description: '', price: '',
    original_price: '', stock: 0, category_id: '', brand_id: '', sku: '', weight: '', is_featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [compat, setCompat] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [newImage, setNewImage] = useState({ url: '', alt_text: '', is_primary: false });
  const [uploading, setUploading] = useState(false);
  const [newSpec, setNewSpec] = useState({ spec_key: '', spec_value: '' });
  const [newCompat, setNewCompat] = useState({ make: '', model: '', year_from: '', year_to: '', engine: '' });
  const [quickVehicle, setQuickVehicle] = useState({ make: '', model: '' });

  useEffect(() => {
    if (product?.id) {
      setDetailsLoading(true);
      adminApi.getProductDetails(product.id).then((r) => {
        setImages(r.data.images || []);
        setSpecs(r.data.specs || []);
        setCompat(r.data.compat || []);
      }).catch(() => {}).finally(() => setDetailsLoading(false));
    }
  }, [product?.id]);

  const autoSlug = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const f = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (product?.id) {
        await adminApi.updateProduct(product.id, form);
        // Ajouter la compatibilité rapide si remplie
        if (quickVehicle.make && quickVehicle.model) {
          await adminApi.addProductCompat(product.id, quickVehicle);
          setQuickVehicle({ make: '', model: '' });
        }
        toast.success('Produit mis à jour');
      } else {
        const r = await adminApi.createProduct(form);
        const newId = r.data.product?.id;
        // Sauvegarder les compatibilités de l'onglet compat
        if (newId && compat.length > 0) {
          for (const c of compat) {
            const { id, ...data } = c;
            await adminApi.addProductCompat(newId, data);
          }
        }
        // Sauvegarder la compatibilité rapide si remplie
        if (newId && quickVehicle.make && quickVehicle.model) {
          await adminApi.addProductCompat(newId, quickVehicle);
        }
        toast.success('Produit créé');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/admin/upload/product-image', {
        method: 'POST', credentials: 'include', body: formData,
      });
      const data = await res.json();
      if (data.url) setNewImage((n) => ({ ...n, url: data.url }));
      else toast.error(data.error?.message || 'Erreur upload');
    } catch { toast.error('Erreur lors de l\'upload'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleAddImage = async () => {
    if (!newImage.url || !product?.id) return;
    try {
      const r = await adminApi.addProductImage(product.id, newImage);
      setImages((prev) => [...prev, r.data.image]);
      setNewImage({ url: '', alt_text: '', is_primary: false });
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Erreur'); }
  };

  const handleDeleteImage = async (id) => {
    try { await adminApi.deleteProductImage(id); setImages((prev) => prev.filter((img) => img.id !== id)); }
    catch { toast.error('Erreur'); }
  };

  const handleAddSpec = async () => {
    if (!newSpec.spec_key || !newSpec.spec_value || !product?.id) return;
    try {
      const r = await adminApi.addProductSpec(product.id, newSpec);
      setSpecs((prev) => [...prev, r.data.spec]);
      setNewSpec({ spec_key: '', spec_value: '' });
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Erreur'); }
  };

  const handleDeleteSpec = async (id) => {
    try { await adminApi.deleteProductSpec(id); setSpecs((prev) => prev.filter((s) => s.id !== id)); }
    catch { toast.error('Erreur'); }
  };

  const handleAddCompat = async () => {
    if (!newCompat.make || !newCompat.model) return;
    if (product?.id) {
      // Produit existant : sauvegarde immédiate en BDD
      try {
        const r = await adminApi.addProductCompat(product.id, newCompat);
        setCompat((prev) => [...prev, r.data.compat]);
        setNewCompat({ make: '', model: '', year_from: '', year_to: '', engine: '' });
      } catch (err) { toast.error(err.response?.data?.error?.message || 'Erreur'); }
    } else {
      // Nouveau produit : stockage local, sera sauvegardé après création
      setCompat((prev) => [...prev, { ...newCompat, id: `_tmp_${Date.now()}` }]);
      setNewCompat({ make: '', model: '', year_from: '', year_to: '', engine: '' });
    }
  };

  const handleDeleteCompat = async (id) => {
    if (String(id).startsWith('_tmp_')) {
      setCompat((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    try { await adminApi.deleteProductCompat(id); setCompat((prev) => prev.filter((c) => c.id !== id)); }
    catch { toast.error('Erreur'); }
  };

  const MODAL_TABS = [
    { id: 'info', label: 'Infos', icon: Package },
    ...(product?.id ? [
      { id: 'images', label: `Images (${images.length})`, icon: Image },
      { id: 'specs', label: `Specs (${specs.length})`, icon: Settings },
    ] : []),
    { id: 'compat', label: `Véhicules (${compat.length})`, icon: Car },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800">{product?.id ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="flex border-b px-5 overflow-x-auto">
          {MODAL_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === id ? 'border-dva-blue text-dva-blue' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'info' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input className="input-dva" value={form.name} required
                    onChange={(e) => { f('name', e.target.value); if (!product?.id) f('slug', autoSlug(e.target.value)); }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input className="input-dva font-mono text-sm" value={form.slug} required onChange={(e) => f('slug', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">URL du produit, généré automatiquement (ex: plaquettes-brembo-bmw)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (F CFA) *</label>
                  <input className="input-dva" type="number" step="1" min="0" value={form.price} required
                    onChange={(e) => f('price', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix barré (F CFA)</label>
                  <input className="input-dva" type="number" step="1" min="0" value={form.original_price || ''}
                    onChange={(e) => f('original_price', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input className="input-dva" type="number" min="0" value={form.stock} required onChange={(e) => f('stock', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input className="input-dva" value={form.sku || ''} onChange={(e) => f('sku', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">Référence interne unique (ex: BRE-BP001)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                  <select className="input-dva" value={form.category_id} required onChange={(e) => f('category_id', e.target.value)}>
                    <option value="">— Choisir —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description courte</label>
                <input className="input-dva" value={form.short_description || ''} onChange={(e) => f('short_description', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description longue</label>
                <textarea className="input-dva resize-none" rows={3} value={form.description || ''} onChange={(e) => f('description', e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="featured" checked={!!form.is_featured}
                  onChange={(e) => f('is_featured', e.target.checked)} className="w-4 h-4 accent-dva-blue" />
                <label htmlFor="featured" className="text-sm text-gray-700">Produit vedette (page d'accueil)</label>
              </div>

              {/* Compatibilité véhicule rapide */}
              <div className="border border-dva-blue/20 rounded-xl p-4 bg-blue-50/40">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-dva-blue" />
                  <p className="text-sm font-semibold text-dva-blue">Véhicule compatible</p>
                  <span className="text-xs text-gray-400">(optionnel — visible dans "Mon véhicule")</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input-dva text-sm" placeholder="Marque (ex: Renault)"
                    value={quickVehicle.make}
                    onChange={(e) => setQuickVehicle((v) => ({ ...v, make: e.target.value }))} />
                  <input className="input-dva text-sm" placeholder="Modèle (ex: Clio)"
                    value={quickVehicle.model}
                    onChange={(e) => setQuickVehicle((v) => ({ ...v, model: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t">
                <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Annuler</button>
                <Button type="submit" loading={saving}>{product?.id ? 'Enregistrer' : 'Créer'}</Button>
              </div>
            </form>
          )}

          {tab === 'images' && (
            <div className="space-y-4">
              {detailsLoading ? <div className="flex justify-center py-6"><Spinner /></div> : (
                <>
                  <div className="space-y-2">
                    {images.map((img) => (
                      <div key={img.id} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                        <img src={img.url} alt={img.alt_text || ''} className="w-14 h-14 object-cover rounded flex-shrink-0 border"
                          onError={(e) => { e.target.style.display = 'none'; }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 truncate">{img.url}</p>
                          {img.is_primary === 1 && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Principale</span>}
                        </div>
                        <button onClick={() => handleDeleteImage(img.id)} className="p-1.5 text-gray-400 hover:text-dva-red rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {images.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucune image</p>}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Ajouter une image</p>
                    {/* Upload depuis l'appareil */}
                    <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl py-3 cursor-pointer transition-colors ${uploading ? 'border-dva-blue bg-dva-blue-muted' : 'border-gray-300 hover:border-dva-blue hover:bg-gray-50'}`}>
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadFile} disabled={uploading} />
                      {uploading
                        ? <><Spinner size="sm" /><span className="text-sm text-dva-blue">Envoi en cours...</span></>
                        : <><Upload className="w-4 h-4 text-dva-blue" /><span className="text-sm text-gray-600">Choisir un fichier depuis l'appareil</span></>
                      }
                    </label>
                    <p className="text-xs text-gray-400 text-center">— ou entrer une URL —</p>
                    <input className="input-dva" placeholder="https://... ou /uploads/..." value={newImage.url}
                      onChange={(e) => setNewImage((n) => ({ ...n, url: e.target.value }))} />
                    <input className="input-dva" placeholder="Texte alternatif" value={newImage.alt_text}
                      onChange={(e) => setNewImage((n) => ({ ...n, alt_text: e.target.value }))} />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={newImage.is_primary}
                          onChange={(e) => setNewImage((n) => ({ ...n, is_primary: e.target.checked }))}
                          className="w-4 h-4 accent-dva-blue" />
                        Image principale
                      </label>
                      <Button size="sm" onClick={handleAddImage} disabled={!newImage.url}>
                        <Plus className="w-4 h-4" /> Ajouter
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'specs' && (
            <div className="space-y-4">
              {detailsLoading ? <div className="flex justify-center py-6"><Spinner /></div> : (
                <>
                  <div className="space-y-2">
                    {specs.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg text-sm">
                        <span className="font-medium text-gray-700 w-32 flex-shrink-0 truncate">{s.spec_key}</span>
                        <span className="flex-1 text-gray-600 truncate">{s.spec_value}</span>
                        <button onClick={() => handleDeleteSpec(s.id)} className="p-1.5 text-gray-400 hover:text-dva-red rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {specs.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucune caractéristique</p>}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Ajouter une caractéristique</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input-dva text-sm" placeholder="Clé (ex: Poids)" value={newSpec.spec_key}
                        onChange={(e) => setNewSpec((n) => ({ ...n, spec_key: e.target.value }))} />
                      <input className="input-dva text-sm" placeholder="Valeur (ex: 0.8 kg)" value={newSpec.spec_value}
                        onChange={(e) => setNewSpec((n) => ({ ...n, spec_value: e.target.value }))} />
                    </div>
                    <Button size="sm" onClick={handleAddSpec} disabled={!newSpec.spec_key || !newSpec.spec_value}>
                      <Plus className="w-4 h-4" /> Ajouter
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'compat' && (
            <div className="space-y-4">
              {detailsLoading ? <div className="flex justify-center py-6"><Spinner /></div> : (
                <>
                  <div className="space-y-2">
                    {compat.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{c.make} {c.model}</span>
                          {(c.year_from || c.year_to) && (
                            <span className="text-gray-500 ml-2">{c.year_from || '?'}–{c.year_to || '...'}</span>
                          )}
                          {c.engine && <span className="text-gray-400 ml-2">· {c.engine}</span>}
                        </div>
                        <button onClick={() => handleDeleteCompat(c.id)} className="p-1.5 text-gray-400 hover:text-dva-red rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {compat.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucune compatibilité</p>}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Ajouter une compatibilité</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input-dva text-sm" placeholder="Marque * (ex: Renault)" value={newCompat.make}
                        onChange={(e) => setNewCompat((n) => ({ ...n, make: e.target.value }))} />
                      <input className="input-dva text-sm" placeholder="Modèle * (ex: Clio)" value={newCompat.model}
                        onChange={(e) => setNewCompat((n) => ({ ...n, model: e.target.value }))} />
                      <input className="input-dva text-sm" placeholder="Année début (ex: 2015)" type="number" value={newCompat.year_from}
                        onChange={(e) => setNewCompat((n) => ({ ...n, year_from: e.target.value }))} />
                      <input className="input-dva text-sm" placeholder="Année fin (ex: 2022)" type="number" value={newCompat.year_to}
                        onChange={(e) => setNewCompat((n) => ({ ...n, year_to: e.target.value }))} />
                      <input className="input-dva text-sm col-span-2" placeholder="Motorisation (ex: 1.5 dCi 110ch)" value={newCompat.engine}
                        onChange={(e) => setNewCompat((n) => ({ ...n, engine: e.target.value }))} />
                    </div>
                    <Button size="sm" onClick={handleAddCompat} disabled={!newCompat.make || !newCompat.model}>
                      <Plus className="w-4 h-4" /> Ajouter
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Produits ────────────────────────────────────────────────────────────────

function ProductsTab() {
  const toast = useToast();
  const [data, setData] = useState({ products: [], pagination: { total: 0, page: 1, pages: 1 } });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  // Debounce : attend 350ms après la dernière frappe avant de lancer la requête
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getProducts({ page, limit: 15, q: debouncedQ })
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, debouncedQ]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminApi.getCategories().then((r) => setCategories(r.data.categories));
    adminApi.getBrands().then((r) => setBrands(r.data.brands));
  }, []);

  const handleDelete = async (id) => {
    try { await adminApi.deleteProduct(id); toast.success('Produit supprimé'); load(); }
    catch { toast.error('Erreur lors de la suppression'); }
    setConfirm(null);
  };

  const handleToggleFeatured = async (id) => {
    try { await adminApi.toggleFeatured(id); load(); }
    catch { toast.error('Erreur'); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-dva pl-9" placeholder="Rechercher..." value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export/products" target="_blank"
            className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <Button onClick={() => setModal('create')} size="sm">
            <Plus className="w-4 h-4" /> Nouveau produit
          </Button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Produit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Catégorie</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Prix</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Vedette</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border" />
                        : <div className="w-10 h-10 rounded-lg bg-dva-blue-muted flex-shrink-0" />}
                      <div>
                        <p className="font-medium text-gray-800 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.brand_name} · {p.sku || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.category_name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-gray-900">{formatCFA(p.price)}</span>
                    {p.original_price && <span className="block text-xs text-gray-400 line-through">{formatCFA(p.original_price)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${p.stock <= 5 ? 'text-dva-red' : p.stock <= 15 ? 'text-orange-500' : 'text-green-600'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <button onClick={() => handleToggleFeatured(p.id)} title="Basculer vedette">
                      {p.is_featured
                        ? <ToggleRight className="w-6 h-6 text-dva-blue mx-auto" />
                        : <ToggleLeft className="w-6 h-6 text-gray-300 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(p)} className="p-1.5 text-gray-500 hover:text-dva-blue hover:bg-dva-blue-muted rounded-lg" title="Modifier">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirm(p.id)} className="p-1.5 text-gray-500 hover:text-dva-red hover:bg-red-50 rounded-lg" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.products.length === 0 && <p className="text-center text-gray-400 py-10">Aucun produit</p>}
        </div>
      )}
      <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
      {modal && (
        <ProductModal
          product={modal === 'create' ? null : modal}
          categories={categories} brands={brands}
          onSave={() => { setModal(null); load(); }}
          onClose={() => setModal(null)}
        />
      )}
      {confirm && (
        <ConfirmModal message="Supprimer ce produit ? Cette action est irréversible."
          onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}

// ─── Commandes ───────────────────────────────────────────────────────────────

function OrdersTab() {
  const toast = useToast();
  const [data, setData] = useState({ orders: [], pagination: { total: 0, page: 1, pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getOrders({ page, limit: 15, status: statusFilter }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, status) => {
    try { await adminApi.updateOrderStatus(id, status); toast.success('Statut mis à jour'); load(); }
    catch { toast.error('Erreur'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="input-dva max-w-[200px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-sm text-gray-500">{data.pagination.total} commande{data.pagination.total > 1 ? 's' : ''}</span>
        <a href="/api/admin/export/orders" target="_blank"
          className="ml-auto flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </a>
      </div>
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">N°</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Changer statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-800">#{String(o.id).padStart(6, '0')}</td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                    <p>{o.first_name} {o.last_name}</p>
                    <p className="text-xs text-gray-400">{o.email}</p>
                  </td>
                  <td className="px-4 py-3"><Badge status={o.status} /></td>
                  <td className="px-4 py-3 text-right font-bold text-dva-red">{formatCFA(o.total_amount)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                    {new Date(o.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                      value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailId(o.id)} className="p-1.5 text-gray-400 hover:text-dva-blue rounded-lg" title="Voir détails">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.orders.length === 0 && <p className="text-center text-gray-400 py-10">Aucune commande</p>}
        </div>
      )}
      <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
      {detailId && <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

function UsersTab() {
  const toast = useToast();
  const [data, setData] = useState({ users: [], pagination: { total: 0, page: 1, pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getUsers({ page, limit: 15, q }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'client' : 'admin';
    try { await adminApi.updateUserRole(user.id, newRole); toast.success(`Rôle changé en "${newRole}"`); load(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Erreur'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-dva pl-9" placeholder="Rechercher..." value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <span className="text-sm text-gray-500">{data.pagination.total} utilisateur{data.pagination.total > 1 ? 's' : ''}</span>
        <a href="/api/admin/export/users" target="_blank"
          className="ml-auto flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </a>
      </div>
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Commandes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Total dépensé</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Inscrit le</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">{u.order_count}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700 hidden md:table-cell">{formatCFA(u.total_spent)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleRole(u)}
                      className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${
                        u.role === 'admin' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-purple-200 text-purple-700 hover:bg-purple-50'
                      }`}>
                      {u.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.users.length === 0 && <p className="text-center text-gray-400 py-10">Aucun utilisateur</p>}
        </div>
      )}
      <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
    </div>
  );
}

// ─── Avis ─────────────────────────────────────────────────────────────────────

function ReviewsTab() {
  const toast = useToast();
  const [data, setData] = useState({ reviews: [], pagination: { total: 0, page: 1, pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getReviews({ page, limit: 15 }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    try { await adminApi.deleteReview(id); toast.success('Avis supprimé'); load(); }
    catch { toast.error('Erreur'); }
    setConfirm(null);
  };

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div>
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="space-y-3">
          {data.reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-card p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-400 text-sm">{stars(r.rating)}</span>
                  {r.is_verified === 1 && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Achat vérifié</span>}
                </div>
                {r.title && <p className="font-semibold text-gray-800 text-sm">{r.title}</p>}
                {r.comment && <p className="text-gray-600 text-sm line-clamp-2">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Par <strong>{r.first_name} {r.last_name}</strong> — <a href={`/produit/${r.product_slug}`} className="text-dva-blue hover:underline">{r.product_name}</a>
                  {' · '}{new Date(r.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button onClick={() => setConfirm(r.id)} className="p-1.5 text-gray-400 hover:text-dva-red hover:bg-red-50 rounded-lg flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {data.reviews.length === 0 && <div className="bg-white rounded-xl shadow-card p-10 text-center text-gray-400">Aucun avis</div>}
        </div>
      )}
      <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
      {confirm && <ConfirmModal message="Supprimer cet avis ?" onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── Promotions ──────────────────────────────────────────────────────────────

function PromoModal({ promo, onSave, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(promo || {
    code: '', name: '', discount_type: 'percentage', discount_value: '',
    min_order_amount: 0, max_uses: '', expires_at: '', is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (promo?.id) { await adminApi.updatePromotion(promo.id, form); toast.success('Promotion mise à jour'); }
      else { await adminApi.createPromotion(form); toast.success('Promotion créée'); }
      onSave();
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const f = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800">{promo?.id ? 'Modifier' : 'Nouvelle'} promotion</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code promo</label>
              <input className="input-dva font-mono uppercase" value={form.code}
                onChange={(e) => f('code', e.target.value.toUpperCase())} placeholder="EX: PROMO10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input className="input-dva" value={form.name} required onChange={(e) => f('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select className="input-dva" value={form.discount_type} onChange={(e) => f('discount_type', e.target.value)}>
                <option value="percentage">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (F CFA)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur *</label>
              <input className="input-dva" type="number" min="0.01" step="1" value={form.discount_value} required
                onChange={(e) => f('discount_value', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commande min. (F CFA)</label>
              <input className="input-dva" type="number" min="0" value={form.min_order_amount}
                onChange={(e) => f('min_order_amount', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Utilisations max</label>
              <input className="input-dva" type="number" min="1" value={form.max_uses} placeholder="Illimité"
                onChange={(e) => f('max_uses', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Expire le</label>
              <input className="input-dva" type="datetime-local" value={form.expires_at?.slice(0, 16) || ''}
                onChange={(e) => f('expires_at', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="promo-active" checked={!!form.is_active}
              onChange={(e) => f('is_active', e.target.checked)} className="w-4 h-4 accent-dva-blue" />
            <label htmlFor="promo-active" className="text-sm text-gray-700">Promotion active</label>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Annuler</button>
            <Button type="submit" loading={saving}>{promo?.id ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PromotionsTab() {
  const toast = useToast();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.getPromotions().then((r) => setPromos(r.data.promotions)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try { await adminApi.deletePromotion(id); toast.success('Promotion supprimée'); load(); }
    catch { toast.error('Erreur'); }
    setConfirm(null);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setModal('create')} size="sm"><Plus className="w-4 h-4" /> Nouvelle promotion</Button>
      </div>
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="space-y-3">
          {promos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-card p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {p.code && <code className="bg-gray-100 text-gray-800 text-sm font-bold px-2 py-0.5 rounded">{p.code}</code>}
                  <span className="font-medium text-gray-800">{p.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {p.discount_type === 'percentage' ? `-${p.discount_value}%` : `-${formatCFA(p.discount_value)}`}
                  {p.min_order_amount > 0 && ` · min. ${formatCFA(p.min_order_amount)}`}
                  {p.max_uses && ` · ${p.used_count}/${p.max_uses} utilisations`}
                  {p.expires_at && ` · expire ${new Date(p.expires_at).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setModal(p)} className="p-1.5 text-gray-500 hover:text-dva-blue hover:bg-dva-blue-muted rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirm(p.id)} className="p-1.5 text-gray-500 hover:text-dva-red hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {promos.length === 0 && <div className="bg-white rounded-xl shadow-card p-10 text-center text-gray-400">Aucune promotion</div>}
        </div>
      )}
      {modal && <PromoModal promo={modal === 'create' ? null : modal} onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />}
      {confirm && <ConfirmModal message="Supprimer cette promotion ?" onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── Catégories & Marques (composant partagé) ─────────────────────────────────

const AVAILABLE_ICONS = [
  { key: 'disc',        Icon: Disc,        label: 'Disque' },
  { key: 'filter',      Icon: Filter,      label: 'Filtre' },
  { key: 'circle',      Icon: Circle,      label: 'Cercle' },
  { key: 'zap',         Icon: Zap,         label: 'Éclair' },
  { key: 'droplets',    Icon: Droplets,    label: 'Liquide' },
  { key: 'settings',    Icon: Settings,    label: 'Engrenage' },
  { key: 'wrench',      Icon: Wrench,      label: 'Clé' },
  { key: 'car',         Icon: Car,         label: 'Voiture' },
  { key: 'gauge',       Icon: Gauge,       label: 'Jauge' },
  { key: 'thermometer', Icon: Thermometer, label: 'Thermomètre' },
  { key: 'battery',     Icon: Battery,     label: 'Batterie' },
  { key: 'wind',        Icon: Wind,        label: 'Ventilation' },
  { key: 'shield',      Icon: Shield,      label: 'Protection' },
  { key: 'box',         Icon: Box,         label: 'Boîte' },
  { key: 'cog',         Icon: Cog,         label: 'Roue dentée' },
  { key: 'bolt',        Icon: Bolt,        label: 'Boulon' },
  { key: 'layers',      Icon: Layers,      label: 'Couches' },
  { key: 'package',     Icon: Package,     label: 'Colis' },
  { key: 'star',        Icon: Star,        label: 'Étoile' },
  { key: 'tag',         Icon: Tag,         label: 'Tag' },
];

function IconPicker({ value, onChange }) {
  const isImage = value && (value.startsWith('/uploads/') || value.startsWith('http'));
  const [mode, setMode] = useState(isImage ? 'image' : 'icon');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/admin/upload/icon', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.url) onChange(data.url);
      else alert(data.error?.message || 'Erreur upload');
    } catch { alert('Erreur lors de l\'upload'); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Icône</label>

      {/* Toggle mode */}
      <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-lg w-fit">
        <button type="button" onClick={() => setMode('icon')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'icon' ? 'bg-white shadow text-dva-blue' : 'text-gray-500 hover:text-gray-700'}`}>
          Choisir une icône
        </button>
        <button type="button" onClick={() => setMode('image')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'image' ? 'bg-white shadow text-dva-blue' : 'text-gray-500 hover:text-gray-700'}`}>
          Télécharger une image
        </button>
      </div>

      {mode === 'icon' ? (
        <>
          <div className="grid grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
            {AVAILABLE_ICONS.map(({ key, Icon: Ic, label }) => (
              <button key={key} type="button" title={label} onClick={() => onChange(key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs
                  ${value === key
                    ? 'border-dva-blue bg-dva-blue-muted text-dva-blue'
                    : 'border-gray-200 hover:border-gray-400 text-gray-500 hover:text-gray-700'}`}>
                <Ic className="w-5 h-5" />
                <span className="truncate w-full text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
          {value && !isImage && (
            <p className="text-xs text-dva-blue mt-1.5 font-medium">
              Sélectionné : {AVAILABLE_ICONS.find(i => i.key === value)?.label || value}
            </p>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-dva-blue bg-dva-blue-muted' : 'border-gray-300 hover:border-dva-blue hover:bg-gray-50'}`}>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
            {uploading ? (
              <p className="text-sm text-dva-blue">Envoi en cours…</p>
            ) : isImage ? (
              <div className="flex flex-col items-center gap-2">
                <img src={value} alt="icône" className="h-12 w-12 object-contain rounded" />
                <p className="text-xs text-gray-500">Cliquer pour changer</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <Image className="w-8 h-8" />
                <p className="text-sm">Cliquer pour choisir une image</p>
                <p className="text-xs">JPG, PNG, SVG, WebP · max 2 Mo</p>
              </div>
            )}
          </label>
          {isImage && (
            <button type="button" onClick={() => onChange('')}
              className="text-xs text-dva-red hover:underline">
              Supprimer l'image
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CatBrandModal({ item, type, onSave, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(item || { name: '', slug: '', description: '', icon: '', logo_url: '' });
  const [saving, setSaving] = useState(false);

  const autoSlug = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const label = type === 'category' ? 'Catégorie' : 'Marque';
      if (item?.id) {
        type === 'category' ? await adminApi.updateCategory(item.id, form) : await adminApi.updateBrand(item.id, form);
        toast.success(`${label} mise à jour`);
      } else {
        type === 'category' ? await adminApi.createCategory(form) : await adminApi.createBrand(form);
        toast.success(`${label} créée`);
      }
      onSave();
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const f = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h2 className="font-bold text-gray-800">
            {item?.id ? 'Modifier' : 'Nouveau'} {type === 'category' ? 'catégorie' : 'marque'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input className="input-dva" value={form.name} required
              onChange={(e) => { f('name', e.target.value); if (!item?.id) f('slug', autoSlug(e.target.value)); }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <input className="input-dva font-mono text-sm" value={form.slug} required onChange={(e) => f('slug', e.target.value)} />
          </div>
          {type === 'category' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input className="input-dva" value={form.description || ''} onChange={(e) => f('description', e.target.value)} />
              </div>
              <IconPicker value={form.icon || ''} onChange={(key) => f('icon', key)} />
            </>
          )}
          {type === 'brand' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL du logo (image .png/.jpg)</label>
              <input
                className="input-dva"
                placeholder="https://exemple.com/logo-bosch.png"
                value={form.logo_url || ''}
                onChange={(e) => f('logo_url', e.target.value)}
              />
              {form.logo_url && (
                <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <img
                    src={form.logo_url}
                    alt="Aperçu logo"
                    className="h-10 max-w-[120px] object-contain"
                    onError={(e) => { e.target.src = ''; e.target.style.display = 'none'; }}
                  />
                  <span className="text-xs text-gray-500">Aperçu du logo</span>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Annuler</button>
            <Button type="submit" loading={saving}>{item?.id ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteCategoryModal({ categoryId, onClose, onDone }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async (withProducts) => {
    setLoading(true);
    try {
      if (withProducts) await adminApi.deleteCategoryWithProducts(categoryId);
      else await adminApi.deleteCategory(categoryId);
      toast.success(withProducts ? 'Catégorie et produits supprimés' : 'Catégorie supprimée');
      onDone();
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Erreur'); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-gray-800 mb-2">Supprimer la catégorie</h3>
        <p className="text-sm text-gray-600 mb-5">Que souhaitez-vous supprimer ?</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => handleDelete(false)} disabled={loading}
            className="w-full border border-dva-red text-dva-red px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
            Supprimer la catégorie uniquement
          </button>
          <button onClick={() => handleDelete(true)} disabled={loading}
            className="w-full bg-dva-red text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-dva-red-dark transition-colors disabled:opacity-50">
            Supprimer la catégorie + tous ses produits
          </button>
          <button onClick={onClose} disabled={loading}
            className="w-full text-gray-500 text-sm hover:text-gray-700 py-1">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.getCategories().then((r) => setItems(r.data.categories)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setModal('create')}><Plus className="w-4 h-4" /> Nouvelle catégorie</Button>
      </div>
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c) => {
                const iconEntry = AVAILABLE_ICONS.find(i => i.key === c.icon);
                const IconComp = iconEntry?.Icon;
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        {IconComp && <span className="w-7 h-7 rounded-full bg-dva-blue-muted flex items-center justify-center flex-shrink-0"><IconComp className="w-4 h-4 text-dva-blue" /></span>}
                        {c.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">{c.slug}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell max-w-xs truncate">{c.description || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal(c)} className="p-1.5 text-gray-500 hover:text-dva-blue hover:bg-dva-blue-muted rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-gray-500 hover:text-dva-red hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-center text-gray-400 py-10">Aucune catégorie</p>}
        </div>
      )}
      {modal && <CatBrandModal item={modal === 'create' ? null : modal} type="category" onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />}
      {deleteId && <DeleteCategoryModal categoryId={deleteId} onClose={() => setDeleteId(null)} onDone={() => { setDeleteId(null); load(); }} />}
    </div>
  );
}

function BrandsTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.getBrands().then((r) => setItems(r.data.brands)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try { await adminApi.deleteBrand(id); toast.success('Marque supprimée'); load(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Erreur'); }
    setConfirm(null);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setModal('create')}><Plus className="w-4 h-4" /> Nouvelle marque</Button>
      </div>
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Logo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {b.logo_url
                      ? <img src={b.logo_url} alt={b.name} className="h-8 max-w-[80px] object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                      : <span className="text-xs text-gray-400 italic">Aucun</span>
                    }
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">{b.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(b)} className="p-1.5 text-gray-500 hover:text-dva-blue hover:bg-dva-blue-muted rounded-lg"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirm(b.id)} className="p-1.5 text-gray-500 hover:text-dva-red hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-center text-gray-400 py-10">Aucune marque</p>}
        </div>
      )}
      {modal && <CatBrandModal item={modal === 'create' ? null : modal} type="brand" onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />}
      {confirm && <ConfirmModal message="Supprimer cette marque ?" onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── Footer Tab ───────────────────────────────────────────────────────────────

function FooterTab() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getFooterSettings().then((r) => {
      const f = r.data.footer;
      setForm({
        logo_url: f.logo_url || '',
        description: f.description || '',
        phone: f.phone || '',
        email: f.email || '',
        address: f.address || '',
        copyright: f.copyright || '',
        badges: f.badges || [
          { title: '', desc: '' }, { title: '', desc: '' },
          { title: '', desc: '' }, { title: '', desc: '' },
        ],
      });
    }).catch(() => {});
  }, []);

  const f = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const fb = (i, field, value) => setForm((p) => {
    const badges = [...p.badges];
    badges[i] = { ...badges[i], [field]: value };
    return { ...p, badges };
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateFooterSettings(form);
      toast.success('Footer mis à jour');
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  if (!form) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl shadow-card p-5 space-y-4">
        <h3 className="font-bold text-gray-800">Informations générales</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo du footer (URL image)</label>
          <input
            className="input-dva"
            placeholder="https://exemple.com/logo.png  (laisser vide = logo par défaut)"
            value={form.logo_url}
            onChange={(e) => f('logo_url', e.target.value)}
          />
          {form.logo_url && (
            <div className="mt-2 flex items-center gap-3 p-3 bg-dva-blue rounded-lg">
              <img src={form.logo_url} alt="Aperçu logo" className="h-10 max-w-[140px] object-contain"
                onError={(e) => { e.target.style.opacity = '0.3'; }} />
              <span className="text-xs text-white/70">Aperçu sur fond bleu</span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea className="input-dva resize-none" rows={2} value={form.description} onChange={(e) => f('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input className="input-dva" value={form.phone} onChange={(e) => f('phone', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input className="input-dva" type="email" value={form.email} onChange={(e) => f('email', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input className="input-dva" value={form.address} onChange={(e) => f('address', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mention copyright</label>
          <input className="input-dva" value={form.copyright} onChange={(e) => f('copyright', e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5 space-y-4">
        <h3 className="font-bold text-gray-800">Badges de réassurance (4 blocs)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {form.badges.map((badge, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Bloc {i + 1}</p>
              <input className="input-dva text-sm" placeholder="Titre" value={badge.title}
                onChange={(e) => fb(i, 'title', e.target.value)} />
              <input className="input-dva text-sm" placeholder="Sous-titre" value={badge.desc}
                onChange={(e) => fb(i, 'desc', e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} loading={saving}>Enregistrer le footer</Button>
    </div>
  );
}

// ─── Bannière Hero ─────────────────────────────────────────────────────────────

const PRESET_GRADIENTS = [
  { label: 'Bleu DVA',    value: 'linear-gradient(135deg, #003DA5, #002880)' },
  { label: 'Nuit bleue',  value: 'linear-gradient(135deg, #111827, #002880)' },
  { label: 'Bleu ardoise',value: 'linear-gradient(135deg, #002880, #1e293b)' },
  { label: 'Rouge DVA',   value: 'linear-gradient(135deg, #E31E24, #002880)' },
  { label: 'Bleu clair',  value: 'linear-gradient(135deg, #0052CC, #002880)' },
  { label: 'Gris foncé',  value: 'linear-gradient(135deg, #1f2937, #111827)' },
];

function SlideModal({ slide, onSave, onClose }) {
  const [form, setForm] = useState(slide || {
    title: '', subtitle: '', badge: '', cta: 'Découvrir', link: '/catalogue', bg: PRESET_GRADIENTS[0].value,
  });
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h2 className="font-bold text-gray-800">{slide ? 'Modifier le slide' : 'Nouveau slide'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {/* Aperçu */}
          <div className="rounded-xl p-5 text-white relative overflow-hidden" style={{ background: form.bg, minHeight: 100 }}>
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10">
              <svg viewBox="0 0 200 150" fill="none" className="w-full h-full">
                <circle cx="150" cy="75" r="100" stroke="white" strokeWidth="1.5" />
                <circle cx="150" cy="75" r="60" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-dva-red" />
            <div className="relative z-10">
              {form.badge && <span className="inline-block bg-dva-red text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">{form.badge}</span>}
              <p className="font-black text-lg leading-tight">{form.title || 'Titre du slide'}</p>
              <p className="text-blue-200 text-sm mt-1">{form.subtitle || 'Sous-titre'}</p>
              <span className="inline-block mt-3 bg-dva-red text-white text-xs font-bold px-3 py-1 rounded">{form.cta || 'CTA'}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input className="input-dva" value={form.title} onChange={(e) => f('title', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
            <input className="input-dva" value={form.subtitle} onChange={(e) => f('subtitle', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge (ex: -25%)</label>
              <input className="input-dva" value={form.badge} onChange={(e) => f('badge', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texte bouton</label>
              <input className="input-dva" value={form.cta} onChange={(e) => f('cta', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lien du bouton</label>
            <input className="input-dva font-mono text-sm" value={form.link} placeholder="/catalogue?category=freins" onChange={(e) => f('link', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Couleur de fond</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_GRADIENTS.map((g) => (
                <button key={g.value} type="button" onClick={() => f('bg', g.value)}
                  className={`flex items-center gap-2 p-2 rounded-lg border-2 text-xs transition-all ${form.bg === g.value ? 'border-dva-blue' : 'border-gray-200 hover:border-gray-400'}`}>
                  <span className="w-5 h-5 rounded flex-shrink-0" style={{ background: g.value }} />
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end p-5 border-t flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Annuler</button>
          <Button onClick={() => { if (form.title) onSave(form); }}>{slide ? 'Enregistrer' : 'Ajouter'}</Button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_HERO_SLIDES = [
  { id: 1, title: 'Pièces de Frein de Qualité', subtitle: 'Plaquettes, disques, étriers — Marques Brembo, Bosch, EBC', cta: 'Voir les freins', link: '/catalogue?category=freins', bg: 'linear-gradient(135deg, #003DA5, #002880)', badge: "Jusqu'à -25%" },
  { id: 2, title: 'Pneus Toutes Saisons', subtitle: 'Michelin, Continental, Bridgestone — Livraison express', cta: 'Choisir mes pneus', link: '/catalogue?category=pneus', bg: 'linear-gradient(135deg, #111827, #002880)', badge: 'Meilleur prix' },
  { id: 3, title: 'Huiles & Filtres Premium', subtitle: 'Castrol, Total, Mann Filter — Compatibilité garantie', cta: 'Découvrir', link: '/catalogue?category=filtres', bg: 'linear-gradient(135deg, #002880, #1e293b)', badge: 'Nouveauté' },
];

function BanniereTab() {
  const toast = useToast();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null); // null | 'create' | slide object

  useEffect(() => {
    adminApi.getHeroSlides()
      .then((r) => {
        const loaded = r.data.slides || [];
        // Si vide en BDD, pré-remplir avec les slides par défaut et les sauvegarder
        if (loaded.length === 0) {
          setSlides(DEFAULT_HERO_SLIDES);
          adminApi.updateHeroSlides(DEFAULT_HERO_SLIDES).catch(() => {});
        } else {
          setSlides(loaded);
        }
      })
      .catch(() => { toast.error('Erreur de chargement'); setSlides(DEFAULT_HERO_SLIDES); })
      .finally(() => setLoading(false));
  }, []);

  const save = async (updatedSlides) => {
    setSaving(true);
    try {
      await adminApi.updateHeroSlides(updatedSlides);
      setSlides(updatedSlides);
      toast.success('Bannière mise à jour');
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const handleSave = (form) => {
    let updated;
    if (modal === 'create') {
      updated = [...slides, { ...form, id: Date.now() }];
    } else {
      updated = slides.map((s) => (s.id === modal.id ? { ...s, ...form } : s));
    }
    save(updated);
    setModal(null);
  };

  const handleDelete = (id) => {
    save(slides.filter((s) => s.id !== id));
  };

  const move = (idx, dir) => {
    const arr = [...slides];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    save(arr);
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setModal('create')}><Plus className="w-4 h-4" /> Nouveau slide</Button>
      </div>

      <div className="space-y-3">
        {slides.map((slide, i) => (
          <div key={slide.id} className="bg-white rounded-xl shadow-card overflow-hidden flex gap-0">
            {/* Aperçu couleur */}
            <div className="w-3 flex-shrink-0" style={{ background: slide.bg }} />
            <div className="flex-1 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{slide.title}</p>
                <p className="text-xs text-gray-500 truncate">{slide.subtitle}</p>
                {slide.badge && <span className="inline-block mt-1 bg-dva-red text-white text-xs px-2 py-0.5 rounded-full">{slide.badge}</span>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Monter">▲</button>
                <button onClick={() => move(i, 1)} disabled={i === slides.length - 1} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Descendre">▼</button>
                <button onClick={() => setModal(slide)} className="p-1.5 text-gray-500 hover:text-dva-blue hover:bg-dva-blue-muted rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(slide.id)} className="p-1.5 text-gray-500 hover:text-dva-red hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {slides.length === 0 && (
          <div className="bg-white rounded-xl shadow-card p-10 text-center text-gray-400">
            Aucun slide — cliquez sur "Nouveau slide" pour commencer
          </div>
        )}
      </div>

      {saving && <p className="text-sm text-dva-blue mt-3">Enregistrement…</p>}
      {modal && <SlideModal slide={modal === 'create' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  );
}

// ─── Pages informations ────────────────────────────────────────────────────

const PAGE_LABELS = {
  'qui-sommes-nous':          'Qui sommes-nous ?',
  'livraison-retours':        'Livraison & retours',
  'mentions-legales':         'Mentions légales',
  'cgv':                      'CGV',
  'politique-confidentialite': 'Politique de confidentialité',
};

function PagesTab() {
  const toast = useToast();
  const [pages, setPages]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null); // page en cours d'édition
  const [saving, setSaving]     = useState(false);
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [preview, setPreview]   = useState(false);

  useEffect(() => {
    adminApi.getPages()
      .then((r) => {
        const list = r.data.pages || [];
        setPages(list);
        if (list.length) selectPage(list[0]);
      })
      .catch(() => toast.error('Impossible de charger les pages'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectPage(p) {
    setSelected(p);
    setTitle(p.title);
    setContent(p.content || '');
    setPreview(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await adminApi.updatePage(selected.slug, { title, content });
      const updated = r.data.page;
      setPages((prev) => prev.map((p) => p.slug === updated.slug ? updated : p));
      setSelected(updated);
      toast.success('Page enregistrée');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  // Rendu basique du contenu pour la prévisualisation
  function renderPreview(text) {
    if (!text) return <p className="text-gray-400 italic">Aucun contenu</p>;
    const blocks = text.split(/\n\n+/);
    return blocks.map((block, bi) => {
      const lines = block.split('\n').filter(Boolean);
      if (!lines.length) return null;
      if (lines[0].startsWith('## ')) {
        return (
          <div key={bi}>
            <h3 className="text-base font-bold text-dva-blue mt-5 mb-2 first:mt-0 pb-1 border-b border-dva-blue/20">{lines[0].slice(3)}</h3>
            {lines.slice(1).map((l, i) =>
              l.startsWith('- ')
                ? <p key={i} className="text-sm text-gray-600 pl-3 before:content-['•'] before:mr-2 before:text-dva-red">{l.slice(2)}</p>
                : <p key={i} className="text-sm text-gray-600 leading-relaxed my-1">{l}</p>
            )}
          </div>
        );
      }
      if (lines.every((l) => l.startsWith('- '))) {
        return (
          <ul key={bi} className="space-y-1 my-2">
            {lines.map((l, i) => <li key={i} className="text-sm text-gray-600 pl-3 before:content-['•'] before:mr-2 before:text-dva-red">{l.slice(2)}</li>)}
          </ul>
        );
      }
      return <p key={bi} className="text-sm text-gray-600 leading-relaxed my-2">{lines.join(' ')}</p>;
    });
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="flex gap-6 min-h-[70vh]">
      {/* ── Liste des pages ── */}
      <div className="w-52 flex-shrink-0 space-y-1">
        {pages.map((p) => (
          <button key={p.slug} onClick={() => selectPage(p)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selected?.slug === p.slug
                ? 'bg-dva-blue text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}>
            {PAGE_LABELS[p.slug] || p.title}
          </button>
        ))}
        {pages.length === 0 && (
          <p className="text-sm text-gray-400 px-2">Aucune page</p>
        )}
      </div>

      {/* ── Éditeur ── */}
      {selected && (
        <div className="flex-1 min-w-0">
          {/* En-tête éditeur */}
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <h2 className="font-bold text-gray-800 text-lg">{PAGE_LABELS[selected.slug] || selected.title}</h2>
            <div className="flex items-center gap-2">
              <a href={`/informations/${selected.slug}`} target="_blank" rel="noreferrer"
                className="text-xs text-dva-blue hover:underline border border-dva-blue/30 px-3 py-1.5 rounded-lg">
                Voir la page →
              </a>
              <button onClick={() => setPreview((v) => !v)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  preview ? 'bg-dva-blue text-white border-dva-blue' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}>
                {preview ? 'Éditer' : 'Aperçu'}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="btn-primary text-sm px-4 py-1.5 disabled:opacity-60">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {/* Champ titre */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Titre de la page</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dva-blue/40"
              placeholder="Titre de la page" />
          </div>

          {!preview ? (
            /* ── Zone d'édition ── */
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Contenu
                <span className="ml-2 font-normal normal-case text-gray-400">
                  — <code className="bg-gray-100 px-1 rounded">## Titre</code> pour les titres,
                  <code className="bg-gray-100 px-1 rounded mx-1">- élément</code> pour les listes,
                  <code className="bg-gray-100 px-1 rounded">**gras**</code> pour le gras
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={22}
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-dva-blue/40 resize-y"
                placeholder={`## Titre de section\n\nParagraphe de texte...\n\n- Point 1\n- Point 2`}
              />
            </div>
          ) : (
            /* ── Aperçu ── */
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Aperçu</label>
              <div className="border border-gray-200 rounded-lg p-6 bg-white min-h-[400px]">
                <h1 className="text-xl font-black text-dva-blue mb-4">{title}</h1>
                <div>{renderPreview(content)}</div>
              </div>
            </div>
          )}

          {/* Aide format */}
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-dva-blue mb-2">Guide de formatage</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
              <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                <p className="font-mono text-dva-blue mb-1">## Titre de section</p>
                <p className="text-gray-500">Crée un titre de section en bleu</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                <p className="font-mono text-dva-blue mb-1">- Élément de liste</p>
                <p className="text-gray-500">Crée une liste à puces</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                <p className="font-mono text-dva-blue mb-1">**texte important**</p>
                <p className="text-gray-500">Met le texte en gras</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Paiements ──────────────────────────────────────────────────────

function PaymentsTab() {
  const toast = useToast();
  const [form, setForm] = useState({ wave_number: '', orange_money_number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getPaymentSettings().then((r) => {
      setForm({ wave_number: r.data.payment.wave_number || '', orange_money_number: r.data.payment.orange_money_number || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updatePaymentSettings(form);
      toast.success('Numéros de paiement enregistrés');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-white rounded-xl shadow-card p-5 space-y-5">
        <h3 className="font-bold text-gray-800">Numéros de réception des paiements</h3>
        <p className="text-sm text-gray-500">
          Ces numéros seront affichés aux clients lors du paiement mobile (Wave / Orange Money).
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <span className="inline-flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-blue-400" /> Numéro Wave</span>
          </label>
          <input
            className="input-dva"
            type="tel"
            placeholder="+221 77 000 00 00"
            value={form.wave_number}
            onChange={(e) => setForm((p) => ({ ...p, wave_number: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <span className="inline-flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-orange-500" /> Numéro Orange Money</span>
          </label>
          <input
            className="input-dva"
            type="tel"
            placeholder="+221 77 000 00 00"
            value={form.orange_money_number}
            onChange={(e) => setForm((p) => ({ ...p, orange_money_number: e.target.value }))}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          Ces numéros apparaîtront dans la page de paiement avec le message :<br />
          <span className="font-medium">« Envoyez [montant] au [numéro] »</span>
        </div>
      </div>

      <Button onClick={handleSave} loading={saving}>Enregistrer les numéros</Button>
    </div>
  );
}

// ─── Page principale Admin ─────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'products',    label: 'Produits',     icon: Package },
  { id: 'orders',      label: 'Commandes',    icon: ShoppingBag },
  { id: 'users',       label: 'Utilisateurs', icon: Users },
  { id: 'categories',  label: 'Catégories',   icon: Layers },
  { id: 'brands',      label: 'Marques',      icon: Award },
  { id: 'reviews',     label: 'Avis',         icon: Star },
  { id: 'promotions',  label: 'Promotions',   icon: Tag },
  { id: 'banniere',    label: 'Bannière',     icon: Image },
  { id: 'pages',       label: 'Pages info',   icon: Bolt },
  { id: 'footer',      label: 'Footer',       icon: Settings },
  { id: 'paiements',   label: 'Paiements',    icon: Smartphone },
];

function AdminContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <>
      <SEOMeta title="Administration DVA" />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-dva-blue text-white px-3 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/">
              <img src="lago_bi.png" alt="DVA" className="h-8 md:h-10 w-auto object-contain" />
            </a>
            <span className="text-white font-semibold text-sm md:text-lg">Administration</span>
          </div>
          <a href="/" className="text-blue-200 hover:text-white text-xs md:text-sm whitespace-nowrap">
            <span className="md:hidden">← Site</span>
            <span className="hidden md:inline">← Retour au site</span>
          </a>
        </div>

        {/* Navigation mobile — barre horizontale scrollable */}
        <div className="md:hidden bg-white border-b border-gray-200 overflow-x-auto">
          <div className="flex whitespace-nowrap">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex-shrink-0 ${
                  activeTab === id
                    ? 'border-dva-blue text-dva-blue'
                    : 'border-transparent text-gray-600'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex">
          <aside className="hidden md:block w-52 flex-shrink-0 min-h-screen bg-white border-r border-gray-200 pt-4">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-dva-blue-muted text-dva-blue border-r-2 border-dva-blue'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </aside>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <h1 className="text-xl font-bold text-gray-900 mb-6">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h1>
            {activeTab === 'dashboard'   && <DashboardTab />}
            {activeTab === 'products'    && <ProductsTab />}
            {activeTab === 'orders'      && <OrdersTab />}
            {activeTab === 'users'       && <UsersTab />}
            {activeTab === 'categories'  && <CategoriesTab />}
            {activeTab === 'brands'      && <BrandsTab />}
            {activeTab === 'reviews'     && <ReviewsTab />}
            {activeTab === 'promotions'  && <PromotionsTab />}
            {activeTab === 'banniere'    && <BanniereTab />}
            {activeTab === 'pages'       && <PagesTab />}
            {activeTab === 'footer'      && <FooterTab />}
            {activeTab === 'paiements'   && <PaymentsTab />}
          </main>
        </div>
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <ToastProvider>
      <AdminContent />
    </ToastProvider>
  );
}
