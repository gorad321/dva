import SEOMeta from '../components/common/SEOMeta';
import HeroBanner from '../components/home/HeroBanner';
import CategoryGrid from '../components/home/CategoryGrid';
import ProductCarousel from '../components/home/ProductCarousel';
import PromoSection from '../components/home/PromoSection';
import { ToastProvider } from '../components/common/Toast';

export default function HomePage() {
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

      {/* Section marques partenaires */}
      <section className="py-10 border-t border-gray-100">
        <div className="container-main">
          <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
            Nos marques partenaires
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {['Brembo', 'Bosch', 'Michelin', 'Continental', 'Varta', 'Castrol', 'NGK', 'Dayco', 'K&N', 'Mann Filter'].map((brand) => (
              <span key={brand} className="text-gray-400 font-bold text-lg hover:text-dva-blue transition-colors cursor-pointer">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>
    </ToastProvider>
  );
}
