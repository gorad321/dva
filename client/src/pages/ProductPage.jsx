import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOMeta from '../components/common/SEOMeta';
import ImageGallery from '../components/product/ImageGallery';
import ProductInfo from '../components/product/ProductInfo';
import TechSpecs from '../components/product/TechSpecs';
import Compatibility from '../components/product/Compatibility';
import ReviewSection from '../components/product/ReviewSection';
import { ToastProvider } from '../components/common/Toast';
import { productsApi } from '../api/productsApi';
import Spinner from '../components/common/Spinner';

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    setLoading(true);
    productsApi.getProductBySlug(slug)
      .then((res) => setProduct(res.data.product))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>
  );

  if (notFound) return (
    <div className="container-main py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Produit introuvable</h1>
      <Link to="/catalogue" className="btn-primary">Retour au catalogue</Link>
    </div>
  );

  if (!product) return null;

  const tabs = [
    { id: 'description', label: 'Description & Specs' },
    { id: 'compatibility', label: `Compatibilité (${product.compatibility?.length || 0})` },
    { id: 'reviews', label: `Avis (${product.review_count || 0})` },
  ];

  return (
    <ToastProvider>
      <SEOMeta
        title={product.name}
        description={product.short_description}
        image={product.images?.[0]?.url}
      />

      <div className="container-main py-6">
        {/* Fil d'Ariane */}
        <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-dva-blue">Accueil</Link>
          <span>/</span>
          <Link to="/catalogue" className="hover:text-dva-blue">Catalogue</Link>
          <span>/</span>
          <Link to={`/catalogue?category=${product.category_slug}`} className="hover:text-dva-blue">{product.category_name}</Link>
          <span>/</span>
          <span className="text-gray-800 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Fiche produit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <ImageGallery images={product.images} />
          <ProductInfo product={product} />
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-dva-blue text-dva-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          {activeTab === 'description' && (
            <TechSpecs specs={product.specs} description={product.description} />
          )}
          {activeTab === 'compatibility' && (
            <Compatibility compatibility={product.compatibility} />
          )}
          {activeTab === 'reviews' && (
            <ReviewSection slug={slug} />
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
