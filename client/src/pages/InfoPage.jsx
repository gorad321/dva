import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Home, Clock, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import SEOMeta from '../components/common/SEOMeta';
import Spinner from '../components/common/Spinner';

/* ─── Parseur de contenu simple ────────────────────────────────────────────
   Format supporté :
   ## Titre de section
   - item liste
   **texte gras**
   double saut de ligne = nouveau paragraphe
──────────────────────────────────────────────────────────────────────────── */
function parseInline(text) {
  // Remplacer **bold** par <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderContent(content) {
  if (!content) return null;
  const blocks = content.split(/\n\n+/);
  const elements = [];

  blocks.forEach((block, bi) => {
    const lines = block.split('\n').filter(Boolean);
    if (!lines.length) return;

    // Bloc titre ##
    if (lines[0].startsWith('## ')) {
      elements.push(
        <h2 key={`h-${bi}`} className="text-xl font-bold text-dva-blue mt-8 mb-3 pb-2 border-b border-dva-blue/20 first:mt-0">
          {lines[0].slice(3)}
        </h2>
      );
      // Lignes restantes après le titre
      const rest = lines.slice(1);
      if (rest.length) {
        const listItems = rest.filter((l) => l.startsWith('- '));
        const textLines = rest.filter((l) => !l.startsWith('- '));
        if (listItems.length) {
          elements.push(
            <ul key={`ul-${bi}`} className="space-y-2 my-3 ml-1">
              {listItems.map((item, ii) => (
                <li key={ii} className="flex items-start gap-2.5 text-gray-600 text-[0.95rem] leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-dva-red flex-shrink-0" />
                  <span>{parseInline(item.slice(2))}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (textLines.length) {
          elements.push(
            <p key={`p-sub-${bi}`} className="text-gray-600 text-[0.95rem] leading-relaxed my-2">
              {parseInline(textLines.join(' '))}
            </p>
          );
        }
      }
      return;
    }

    // Bloc liste (que des tirets)
    if (lines.every((l) => l.startsWith('- '))) {
      elements.push(
        <ul key={`ul-${bi}`} className="space-y-2 my-3 ml-1">
          {lines.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2.5 text-gray-600 text-[0.95rem] leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-dva-red flex-shrink-0" />
              <span>{parseInline(item.slice(2))}</span>
            </li>
          ))}
        </ul>
      );
      return;
    }

    // Paragraphe normal
    elements.push(
      <p key={`p-${bi}`} className="text-gray-600 text-[0.95rem] leading-relaxed my-3">
        {parseInline(lines.join(' '))}
      </p>
    );
  });

  return elements;
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function InfoPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    axiosClient.get(`/pages/${slug}`)
      .then((r) => setPage(r.data.page))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <SEOMeta title="Page introuvable — DVA Auto" />
        <AlertCircle className="w-16 h-16 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-700">Page introuvable</h1>
        <p className="text-gray-500">Cette page n'existe pas ou a été supprimée.</p>
        <Link to="/" className="btn-primary mt-2">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <>
      <SEOMeta title={`${page.title} — DVA Auto`} description={`${page.title} — DVA Auto, votre spécialiste pièces automobiles au Sénégal.`} />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-dva-blue text-white">
        {/* Motif décoratif */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <svg viewBox="0 0 300 200" className="w-full h-full" fill="none">
            <circle cx="250" cy="100" r="150" stroke="white" strokeWidth="1" />
            <circle cx="250" cy="100" r="100" stroke="white" strokeWidth="1" />
            <circle cx="250" cy="100" r="50"  stroke="white" strokeWidth="1" />
          </svg>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-dva-red" />
        <div className="container-main py-12 md:py-16 relative z-10">
          {/* Fil d'Ariane */}
          <nav className="flex items-center gap-1.5 text-blue-200 text-sm mb-5 flex-wrap">
            <Link to="/" className="hover:text-white flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" /> Accueil
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <span className="text-white font-medium">{page.title}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black leading-tight drop-shadow-sm">
            {page.title}
          </h1>
          {page.updated_at && (
            <p className="text-blue-200 text-sm mt-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Dernière mise à jour : {formatDate(page.updated_at)}
            </p>
          )}
        </div>
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────────── */}
      <div className="container-main py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          {/* Carte principale */}
          <div className="bg-white rounded-2xl shadow-card p-6 md:p-10">
            <div className="prose-dva">
              {renderContent(page.content)}
            </div>
          </div>

          {/* Navigation entre pages */}
          <QuickLinks currentSlug={slug} />
        </div>
      </div>
    </>
  );
}

/* ─── Liens rapides vers les autres pages info ──────────────────────────── */
const INFO_PAGES = [
  { slug: 'qui-sommes-nous',         label: 'Qui sommes-nous ?' },
  { slug: 'livraison-retours',       label: 'Livraison & retours' },
  { slug: 'mentions-legales',        label: 'Mentions légales' },
  { slug: 'cgv',                     label: 'CGV' },
  { slug: 'politique-confidentialite', label: 'Politique de confidentialité' },
];

function QuickLinks({ currentSlug }) {
  const others = INFO_PAGES.filter((p) => p.slug !== currentSlug);
  return (
    <div className="mt-8">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Autres informations</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {others.map((p) => (
          <Link key={p.slug} to={`/informations/${p.slug}`}
            className="flex items-center justify-between bg-white rounded-xl shadow-card px-4 py-3 text-sm font-medium text-gray-700 hover:text-dva-blue hover:shadow-md transition-all group">
            <span>{p.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-dva-blue transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
