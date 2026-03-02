import { Link } from 'react-router-dom';

function BrandItem({ brand }) {
  const logoUrl = brand.logo_url || null;

  return (
    <Link
      to={`/catalogue?brand=${brand.slug}`}
      className="brand-scroll-item flex items-center justify-center mx-10 shrink-0"
      title={brand.name}
    >
      {logoUrl ? (
        <>
          <img
            src={logoUrl}
            alt={`Logo ${brand.name}`}
            className="brand-logo-img h-10 max-w-[120px] object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span
            className="brand-logo-text font-bold text-gray-400 text-base tracking-wide"
            style={{ display: 'none' }}
          >
            {brand.name}
          </span>
        </>
      ) : (
        <span className="brand-logo-text font-bold text-gray-400 text-base tracking-wide">
          {brand.name}
        </span>
      )}
    </Link>
  );
}

export default function BrandScrollBanner({ brands }) {
  if (!brands || brands.length === 0) return null;

  /* Dupliquer la liste pour défilement sans fin (seamless loop) */
  const doubled = [...brands, ...brands];

  return (
    <section className="py-10 border-t border-gray-100 overflow-hidden bg-white">
      <div className="container-main mb-6">
        <h2 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Nos Marques
        </h2>
      </div>

      {/* Bandeau défilant */}
      <div className="relative brand-scroll-container">
        <div className="brand-scroll-fade brand-scroll-fade-left" />
        <div className="brand-scroll-fade brand-scroll-fade-right" />
        <div className="brand-scroll-track">
          {doubled.map((brand, idx) => (
            <BrandItem key={`${brand.id}-${idx}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}
