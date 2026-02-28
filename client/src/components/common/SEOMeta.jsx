import { useEffect } from 'react';

/**
 * Composant SEO : met à jour le titre, la description et les balises Open Graph
 */
export default function SEOMeta({ title, description, image }) {
  const fullTitle = title ? `${title} | DVA Auto` : 'DVA Auto - Pièces Automobiles';
  const desc = description || 'DVA Auto - Votre spécialiste en pièces automobiles. Large choix de pièces de qualité pour toutes les marques.';

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name, content, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', desc);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', desc, 'property');
    if (image) setMeta('og:image', image, 'property');

    return () => {
      document.title = 'DVA Auto - Pièces Automobiles';
    };
  }, [fullTitle, desc, image]);

  return null;
}
