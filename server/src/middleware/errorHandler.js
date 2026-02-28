/**
 * DVA - Middleware de gestion d'erreurs global
 * Format de réponse uniforme pour toutes les erreurs
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Journaliser l'erreur (en production, utiliser un logger comme winston)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -`, err.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(err.stack);
    }
  }

  // Erreur CORS
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: { code: 'CORS_ERROR', message: 'Requête bloquée par CORS' },
    });
  }

  // Erreur de validation express-validator (levée manuellement)
  if (err.type === 'VALIDATION_ERROR') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message, details: err.details || [] },
    });
  }

  // Erreur métier levée avec un code HTTP explicite
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: { code: err.code || 'ERROR', message: err.message },
    });
  }

  // Erreur JSON malformé
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Corps de la requête JSON invalide' },
    });
  }

  // Erreur SQLite - contrainte unique
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE constraint'))) {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'Cette ressource existe déjà' },
    });
  }

  // Erreur inattendue (500)
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne du serveur',
    },
  });
}

/**
 * Crée une erreur métier avec code HTTP et code fonctionnel
 */
function createError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

module.exports = errorHandler;
module.exports.createError = createError;
