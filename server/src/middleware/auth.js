/**
 * DVA - Middleware d'authentification JWT
 * Vérifie l'access token dans le cookie httpOnly
 */
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

/**
 * Middleware : vérifie le JWT et attache l'utilisateur à req.user
 * Chaîne de vérification : cookie présent → jwt.verify() → user en BDD
 */
function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentification requise' },
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (jwtErr) {
      // Token expiré ou invalide
      const code = jwtErr.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
      return res.status(401).json({
        error: { code, message: 'Token d\'accès invalide ou expiré' },
      });
    }

    // Vérifier que l'utilisateur existe encore en BDD
    const user = getDb()
      .prepare('SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = ?')
      .get(payload.userId);

    if (!user) {
      return res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware optionnel : attache l'utilisateur si connecté, continue sinon
 */
function optionalAuth(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = getDb()
      .prepare('SELECT id, email, first_name, last_name FROM users WHERE id = ?')
      .get(payload.userId);
    if (user) req.user = user;
  } catch {
    // Ignorer silencieusement (token expiré, etc.)
  }
  next();
}

/**
 * Middleware : vérifie que l'utilisateur est admin
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs' },
      });
    }
    next();
  });
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
