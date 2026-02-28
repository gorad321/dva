/**
 * DVA - Middleware de cache serveur (node-cache)
 * Appliqué uniquement sur les routes GET publiques
 */
const NodeCache = require('node-cache');
const crypto = require('crypto');

// Instance unique du cache (TTL par défaut 5 min, nettoyage toutes les 10 min)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

/**
 * Factory de middleware de cache
 * @param {number} ttl - Durée de vie en secondes
 * @param {string} [prefix] - Préfixe de clé fixe (ex: 'categories', 'brands')
 */
function cacheMiddleware(ttl, prefix = null) {
  return (req, res, next) => {
    // Ne cache que les requêtes GET
    if (req.method !== 'GET') return next();

    // Construire la clé de cache
    const key = prefix
      ? prefix
      : `${req.path}:${hashQuery(req.query)}`;

    const cached = cache.get(key);
    if (cached !== undefined) {
      // Cache HIT
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Cache MISS : intercepter la réponse pour la mettre en cache
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Ne cache que les réponses 2xx
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, ttl);
      }
      originalJson(data);
    };

    next();
  };
}

/**
 * Invalide une entrée spécifique du cache
 */
function invalidateCache(key) {
  cache.del(key);
}

/**
 * Génère un hash court d'un objet query params
 */
function hashQuery(query) {
  const str = JSON.stringify(query, Object.keys(query).sort());
  return crypto.createHash('md5').update(str).digest('hex').slice(0, 8);
}

module.exports = { cacheMiddleware, invalidateCache, cache };
