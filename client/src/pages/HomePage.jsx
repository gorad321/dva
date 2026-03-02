import { useEffect, useState } from 'react';
import SEOMeta from '../components/common/SEOMeta';
import HeroBanner from '../components/home/HeroBanner';
import CategoryGrid from '../components/home/CategoryGrid';
import ProductCarousel from '../components/home/ProductCarousel';
import PromoSection from '../components/home/PromoSection';
import BrandScrollBanner from '../components/home/BrandScrollBanner';
import { ToastProvider } from '../components/common/Toast';
import axiosClient from '../api/axiosClient';

export default function HomePage() {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    axiosClient.get('/brands')
      .then((r) => setBrands(r.data.brands || []))
      .catch(() => {});
  }, []);

  return (
    <ToastProvider>
      <SEOMeta
        title="Pièces Automobiles"
        description="DVA Auto - Leader en pièces automobiles. Freins, filtres, pneus, batteries et plus encore. Livraison rapide, paiement sécurisé."
      />
      <HeroBanner />
      <CategoryGrid />
      <PromoSection />
      <ProductCarousel />

      <BrandScrollBanner brands={brands} />
    </ToastProvider>
  );
}
