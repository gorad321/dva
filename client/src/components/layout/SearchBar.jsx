import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { productsApi } from '../../api/productsApi';
import LazyImage from '../common/LazyImage';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const ref = useRef(null);

  // Récupérer les suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    productsApi.getSuggestions(debouncedQuery)
      .then((res) => setSuggestions(res.data.suggestions || []))
      .catch(() => setSuggestions([]));
  }, [debouncedQuery]);

  // Fermer les suggestions en cliquant ailleurs
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    navigate(`/catalogue?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  const handleSuggestionClick = (slug) => {
    setShowSuggestions(false);
    setQuery('');
    navigate(`/produit/${slug}`);
  };

  return (
    <div ref={ref} className="relative">
      <form onSubmit={handleSearch} className="flex items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder="Rechercher une pièce, une marque, un véhicule..."
          className="w-full rounded-l-md border-0 px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-dva-red"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setSuggestions([]); }}
            className="bg-white px-2 py-2.5 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="submit" className="bg-dva-red hover:bg-dva-red-dark text-white px-4 py-2.5 rounded-r-md transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </form>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white rounded-b-lg shadow-xl z-50 max-h-80 overflow-y-auto border border-gray-100">
          {suggestions.map((s) => (
            <button key={s.slug} onClick={() => handleSuggestionClick(s.slug)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dva-blue-muted text-left">
              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                <LazyImage src={s.image_url} alt={s.name} className="w-10 h-10" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-500">{s.category}</p>
              </div>
            </button>
          ))}
          <div className="border-t border-gray-100 p-2">
            <button onClick={handleSearch}
              className="w-full text-center text-sm text-dva-blue hover:underline py-1">
              Voir tous les résultats pour "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
