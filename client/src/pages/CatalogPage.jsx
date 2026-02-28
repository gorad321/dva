import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEOMeta from '../components/common/SEOMeta';
import FilterSidebar from '../components/catalog/FilterSidebar';
import ProductCard from '../components/catalog/ProductCard';
import SortBar from '../components/catalog/SortBar';
import Pagination from '../components/catalog/Pagination';
import { ToastProvider } from '../components/common/Toast';
import { productsApi } from '../api/productsApi';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const filters = {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  };
  const sort = searchParams.get('sort') || 'name_asc';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = { ...filters, sort, page, limit: 12 };
    // Supprimer les params vides
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);

    productsApi.getProducts(params)
      .then((res) => {
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v); else next.delete(k);
    });
    next.delete('page'); // Reset page sur changement de filtre
    setSearchParams(next);
  };

  return (
    <ToastProvider>
      <SEOMeta
        title={filters.q ? `Résultats pour "${filters.q}"` : 'Catalogue'}
        description="Parcourez notre catalogue complet de pièces automobiles. Freins, filtres, pneus, batteries, huiles et plus encore."
      />
      <div className="container-main py-6">
        {/* Fil d'Ariane */}
        <nav className="text-sm text-gray-500 mb-4">
          <a href="/" className="hover:text-dva-blue">Accueil</a>
          <span className="mx-2">/</span>
          <span className="text-gray-800">Catalogue</span>
          {filters.q && <><span className="mx-2">/</span><span>"{filters.q}"</span></>}
        </nav>

        <h1 className="section-title mb-6">
          {filters.q ? `Résultats pour "${filters.q}"` : filters.category ? `Catégorie : ${filters.category}` : 'Tous les produits'}
        </h1>

        <div className="flex gap-6">
          {/* Filtres */}
          <FilterSidebar
            filters={filters}
            onChange={(newFilters) => updateParams(newFilters)}
          />

          {/* Produits */}
          <div className="flex-1 min-w-0">
            <SortBar
              total={pagination.total}
              sort={sort}
              onSortChange={(s) => updateParams({ sort: s })}
            />

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-64 skeleton rounded-xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg mb-4">Aucun produit trouvé</p>
                <button onClick={() => setSearchParams({})} className="btn-outline">
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onPageChange={(p) => updateParams({ page: String(p) })}
            />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
