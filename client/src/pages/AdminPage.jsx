import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Star, Tag, Layers, Award,
  TrendingUp, ShoppingCart, Pencil, Trash2, Plus, X, ChevronLeft, ChevronRight,
  Search, ToggleLeft, ToggleRight, Eye, Download, Image, Settings, Car,
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
  const [newSpec, setNewSpec] = useState({ spec_key: '', spec_value: '' });
  const [newCompat, setNewCompat] = useState({ make: '', model: '', year_from: '', year_to: '', engine: '' });

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
        toast.success('Produit mis à jour');
      } else {
        await adminApi.createProduct(form);
        toast.success('Produit créé');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
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
    if (!newCompat.make || !newCompat.model || !product?.id) return;
    try {
      const r = await adminApi.addProductCompat(product.id, newCompat);
      setCompat((prev) => [...prev, r.data.compat]);
      setNewCompat({ make: '', model: '', year_from: '', year_to: '', engine: '' });
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Erreur'); }
  };

  const handleDeleteCompat = async (id) => {
    try { await adminApi.deleteProductCompat(id); setCompat((prev) => prev.filter((c) => c.id !== id)); }
    catch { toast.error('Erreur'); }
  };

  const MODAL_TABS = [
    { id: 'info', label: 'Infos', icon: Package },
    ...(product?.id ? [
      { id: 'images', label: `Images (${images.length})`, icon: Image },
      { id: 'specs', label: `Specs (${specs.length})`, icon: Settings },
      { id: 'compat', label: `Véhicules (${compat.length})`, icon: Car },
    ] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800">{product?.id ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {product?.id && (
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
        )}

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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                  <select className="input-dva" value={form.category_id} required onChange={(e) => f('category_id', e.target.value)}>
                    <option value="">— Choisir —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marque *</label>
                  <select className="input-dva" value={form.brand_id} required onChange={(e) => f('brand_id', e.target.value)}>
                    <option value="">— Choisir —</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
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
                    <input className="input-dva" placeholder="URL de l'image *" value={newImage.url}
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
                      <input className="input-dva text-sm" placeholder="Marque * (ex: BMW)" value={newCompat.make}
                        onChange={(e) => setNewCompat((n) => ({ ...n, make: e.target.value }))} />
                      <input className="input-dva text-sm" placeholder="Modèle * (ex: Série 3)" value={newCompat.model}
                        onChange={(e) => setNewCompat((n) => ({ ...n, model: e.target.value }))} />
                      <input className="input-dva text-sm" placeholder="Année début" type="number" value={newCompat.year_from}
                        onChange={(e) => setNewCompat((n) => ({ ...n, year_from: e.target.value }))} />
                      <input className="input-dva text-sm" placeholder="Année fin" type="number" value={newCompat.year_to}
                        onChange={(e) => setNewCompat((n) => ({ ...n, year_to: e.target.value }))} />
                      <input className="input-dva text-sm col-span-2" placeholder="Motorisation (ex: 2.0 TDI 150ch)" value={newCompat.engine}
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
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getProducts({ page, limit: 15, q }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [page, q]);

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

function CatBrandModal({ item, type, onSave, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(item || { name: '', slug: '', description: '', icon: '' });
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800">
            {item?.id ? 'Modifier' : 'Nouveau'} {type === 'category' ? 'catégorie' : 'marque'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icône (lucide)</label>
                <input className="input-dva" value={form.icon || ''} onChange={(e) => f('icon', e.target.value)} placeholder="ex: disc" />
              </div>
            </>
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

function CategoriesTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.getCategories().then((r) => setItems(r.data.categories)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try { await adminApi.deleteCategory(id); toast.success('Catégorie supprimée'); load(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Erreur'); }
    setConfirm(null);
  };

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
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">{c.slug}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell max-w-xs truncate">{c.description || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(c)} className="p-1.5 text-gray-500 hover:text-dva-blue hover:bg-dva-blue-muted rounded-lg"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirm(c.id)} className="p-1.5 text-gray-500 hover:text-dva-red hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-center text-gray-400 py-10">Aucune catégorie</p>}
        </div>
      )}
      {modal && <CatBrandModal item={modal === 'create' ? null : modal} type="category" onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />}
      {confirm && <ConfirmModal message="Supprimer cette catégorie ?" onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
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
];

function AdminContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <>
      <SEOMeta title="Administration DVA" />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-dva-blue text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1">
              <div className="bg-white rounded px-1.5 py-0.5">
                <span className="text-dva-blue font-black text-base">D</span>
                <span className="text-dva-red font-black text-base">VA</span>
              </div>
            </a>
            <span className="text-white font-semibold text-lg">Administration</span>
          </div>
          <a href="/" className="text-blue-200 hover:text-white text-sm">← Retour au site</a>
        </div>

        <div className="flex">
          <aside className="w-52 flex-shrink-0 min-h-screen bg-white border-r border-gray-200 pt-4">
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

          <main className="flex-1 p-6 overflow-auto">
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
