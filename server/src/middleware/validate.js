/**
 * DVA - Middleware de validation express-validator
 * Centralise la vérification des erreurs de validation
 */
const { validationResult } = require('express-validator');

/**
 * Vérifie les résultats de validation et renvoie une erreur 400 si des violations existent
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Données de la requête invalides',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      },
    });
  }
  next();
}

module.exports = { handleValidation };
