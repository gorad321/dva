import { useState, useEffect } from 'react';

/**
 * Retarde la mise à jour d'une valeur (utile pour la recherche)
 * @param {*} value - Valeur à débouncer
 * @param {number} delay - Délai en ms (300ms par défaut)
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
