import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, ChevronRight, Search, Package } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import Spinner from '../components/common/Spinner';
import { ToastProvider } from '../components/common/Toast';
import axiosClient from '../api/axiosClient';
import { formatCFA } from '../utils/currency';

function ProductResult({ product }) {
  const hasPromo = product.original_price && product.original_price > product.price;
  const discount = hasPromo ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  return (
    <Link to={`/produit/${product.slug}`}
      className="flex items-center gap-4 bg-white border border-gray-200 hover:border-dva-blue rounded-xl p-4 transition-colors group">
      <div className="w-16 h-16 flex-shrink-0 bg-dva-blue-muted rounded-lg overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <Package className="w-8 h-8 m-auto text-gray-400 mt-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-dva-blue font-medium">{product.brand_name} · {product.category_name}</p>
        <p className="font-semibold text-gray-800 truncate group-hover:text-dva-blue transition-colors">{product.name}</p>
        {product.engine && <p className="text-xs text-gray-500">Moteur : {product.engine} · {product.year_from}–{product.year_to || '...'}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-dva-red font-bold">{formatCFA(product.price)}</span>
          {hasPromo && <span className="text-gray-400 text-xs line-through">{formatCFA(product.original_price)}</span>}
          {hasPromo && <span className="badge-promo text-xs">-{discount}%</span>}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-dva-blue flex-shrink-0" />
    </Link>
  );
}

function VehicleSearchContent() {
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [products, setProducts] = useState([]);
  const [vehicle, setVehicle] = useState({ make: '', model: '', year: '' });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Charger les marques au montage
  useEffect(() => {
    axiosClient.get('/vehicle/makes').then((r) => setMakes(r.data.makes)).catch(() => {});
  }, []);

  // Charger les modèles quand la marque change
  useEffect(() => {
    if (!vehicle.make) { setModels([]); setYears([]); setVehicle((v) => ({ ...v, model: '', year: '' })); return; }
    axiosClient.get(`/vehicle/models?make=${encodeURIComponent(vehicle.make)}`)
      .then((r) => setModels(r.data.models))
      .catch(() => setModels([]));
  }, [vehicle.make]);

  // Charger les années quand le modèle change
  useEffect(() => {
    if (!vehicle.model) { setYears([]); setVehicle((v) => ({ ...v, year: '' })); return; }
    axiosClient.get(`/vehicle/years?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`)
      .then((r) => setYears(r.data.years))
      .catch(() => setYears([]));
  }, [vehicle.model]);

  const handleSearch = async () => {
    if (!vehicle.make || !vehicle.model) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ make: vehicle.make, model: vehicle.model });
      if (vehicle.year) params.set('year', vehicle.year);
      const r = await axiosClient.get(`/vehicle/products?${params}`);
      setProducts(r.data.products);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setVehicle({ make: '', model: '', year: '' });
    setProducts([]);
    setSearched(false);
  };

  // Grouper par catégorie
  const grouped = products.reduce((acc, p) => {
    const key = p.category_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <>
      <SEOMeta
        title="Recherche par véhicule"
        description="Trouvez les pièces compatibles avec votre voiture. Sélectionnez votre marque, modèle et année."
      />
      <div className="container-main py-8">
        <h1 className="section-title mb-2 flex items-center gap-3">
          <Car className="w-7 h-7 text-dva-blue" />
          Recherche par véhicule
        </h1>
        <p className="text-gray-500 mb-8">Sélectionnez votre véhicule pour trouver les pièces compatibles</p>

        {/* Sélecteurs */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {/* Marque */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marque *</label>
              <select
                value={vehicle.make}
                onChange={(e) => setVehicle((v) => ({ ...v, make: e.target.value, model: '', year: '' }))}
                className="input-dva"
              >
                <option value="">— Choisir une marque —</option>
                {makes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Modèle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modèle *</label>
              <select
                value={vehicle.model}
                onChange={(e) => setVehicle((v) => ({ ...v, model: e.target.value, year: '' }))}
                disabled={!vehicle.make}
                className="input-dva disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">— Choisir un modèle —</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Année */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année (optionnel)</label>
              <select
                value={vehicle.year}
                onChange={(e) => setVehicle((v) => ({ ...v, year: e.target.value }))}
                disabled={!vehicle.model}
                className="input-dva disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">— Toutes les années —</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={!vehicle.make || !vehicle.model || loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              Rechercher les pièces
            </button>
            {searched && (
              <button onClick={reset} className="btn-outline">
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Résultats */}
        {loading && (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        )}

        {!loading && searched && (
          <>
            {products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-card">
                <Car className="w-14 h-14 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucune pièce trouvée</h2>
                <p className="text-gray-500 mb-6">
                  Aucune pièce compatible trouvée pour{' '}
                  <strong>{vehicle.make} {vehicle.model}{vehicle.year ? ` (${vehicle.year})` : ''}</strong>
                </p>
                <Link to="/catalogue" className="btn-primary">Voir tout le catalogue</Link>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 font-semibold mb-4">
                  {products.length} pièce{products.length > 1 ? 's' : ''} compatible{products.length > 1 ? 's' : ''} pour{' '}
                  <span className="text-dva-blue">{vehicle.make} {vehicle.model}{vehicle.year ? ` (${vehicle.year})` : ''}</span>
                </p>

                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="mb-8">
                    <h2 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
                      <span className="w-2 h-6 bg-dva-red rounded-full inline-block" />
                      {category} ({items.length})
                    </h2>
                    <div className="space-y-3">
                      {items.map((p) => <ProductResult key={p.id} product={p} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="bg-dva-blue-muted rounded-xl p-6 text-center">
            <Car className="w-12 h-12 mx-auto text-dva-blue mb-3 opacity-60" />
            <p className="text-gray-600">Sélectionnez votre véhicule ci-dessus pour afficher les pièces compatibles</p>
          </div>
        )}
      </div>
    </>
  );
}

export default function VehicleSearchPage() {
  return (
    <ToastProvider>
      <VehicleSearchContent />
    </ToastProvider>
  );
}
