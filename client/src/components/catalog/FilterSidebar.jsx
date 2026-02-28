import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';
import { productsApi } from '../../api/productsApi';

export default function FilterSidebar({ filters, onChange }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [openSections, setOpenSections] = useState({ category: true, brand: true, price: true });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    productsApi.getCategories().then((r) => setCategories(r.data.categories));
    productsApi.getBrands().then((r) => setBrands(r.data.brands));
  }, []);

  const toggle = (section) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const hasActiveFilters = filters.category || filters.brand || filters.minPrice || filters.maxPrice;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-gray-700">Filtres actifs</span>
            <button onClick={() => onChange({ category: '', brand: '', minPrice: '', maxPrice: '' })}
              className="text-dva-red text-xs hover:underline flex items-center gap-1">
              <X className="w-3 h-3" /> Effacer tout
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.category && (
              <span className="bg-dva-blue-muted text-dva-blue text-xs px-2 py-1 rounded-full flex items-center gap-1">
                {filters.category}
                <button onClick={() => onChange({ ...filters, category: '' })}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.brand && (
              <span className="bg-dva-blue-muted text-dva-blue text-xs px-2 py-1 rounded-full flex items-center gap-1">
                {filters.brand}
                <button onClick={() => onChange({ ...filters, brand: '' })}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Catégories */}
      <div>
        <button onClick={() => toggle('category')}
          className="w-full flex items-center justify-between font-semibold text-sm text-gray-700 mb-3">
          Catégorie {openSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.category && (
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="category" checked={!filters.category}
                onChange={() => onChange({ ...filters, category: '' })}
                className="text-dva-blue" />
              <span className="text-sm text-gray-600">Toutes les catégories</span>
            </label>
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="category" value={cat.slug}
                  checked={filters.category === cat.slug}
                  onChange={() => onChange({ ...filters, category: cat.slug })}
                  className="text-dva-blue" />
                <span className="text-sm text-gray-600">{cat.name}</span>
                <span className="text-xs text-gray-400 ml-auto">({cat.product_count})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Marques */}
      <div>
        <button onClick={() => toggle('brand')}
          className="w-full flex items-center justify-between font-semibold text-sm text-gray-700 mb-3">
          Marque {openSections.brand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.brand && (
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {brands.map((brand) => (
              <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  checked={filters.brand === brand.slug}
                  onChange={() => onChange({ ...filters, brand: filters.brand === brand.slug ? '' : brand.slug })}
                  className="text-dva-blue rounded" />
                <span className="text-sm text-gray-600">{brand.name}</span>
                <span className="text-xs text-gray-400 ml-auto">({brand.product_count})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Prix */}
      <div>
        <button onClick={() => toggle('price')}
          className="w-full flex items-center justify-between font-semibold text-sm text-gray-700 mb-3">
          Prix {openSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.price && (
          <div className="flex gap-2 items-center">
            <input type="number" min="0" placeholder="Min €" value={filters.minPrice || ''}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
              className="input-dva w-full" />
            <span className="text-gray-400">–</span>
            <input type="number" min="0" placeholder="Max €" value={filters.maxPrice || ''}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
              className="input-dva w-full" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Bouton filtre mobile */}
      <button onClick={() => setMobileOpen(true)}
        className="md:hidden flex items-center gap-2 btn-outline mb-4">
        <SlidersHorizontal className="w-4 h-4" />
        Filtres {hasActiveFilters && <span className="bg-dva-red text-white text-xs rounded-full px-1.5">!</span>}
      </button>

      {/* Sidebar desktop */}
      <aside className="hidden md:block w-56 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-card p-5 sticky top-24">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-dva-blue" /> Filtres
          </h3>
          <FilterContent />
        </div>
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Filtres</h3>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent />
            </div>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                Appliquer les filtres
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
