/**
 * DVA - Contrôleur d'authentification
 * Gestion inscription, connexion, déconnexion, refresh token
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDb } = require('../db/database');
const { sendPasswordResetEmail } = require('../services/emailService');

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours en ms

/**
 * Génère un access token JWT (courte durée)
 */
function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

/**
 * Génère un refresh token JWT (longue durée) + le hash pour la BDD
 */
function generateRefreshToken(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/**
 * Envoie les cookies httpOnly sécurisés
 */
function setTokenCookies(res, accessToken, refreshToken) {
  const secure = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    maxAge: REFRESH_EXPIRY_MS,
    path: '/api/auth', // Limiter le refresh token au endpoint /api/auth
  });
}

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { email, password, first_name, last_name, phone } = req.body;
    const db = getDb();

    // Vérifier si l'email existe déjà
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({
        error: { code: 'EMAIL_TAKEN', message: 'Cet email est déjà utilisé' },
      });
    }

    // Hacher le mot de passe (12 rounds = bon compromis sécurité/performance)
    const passwordHash = await bcrypt.hash(password, 12);

    const result = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      email.toLowerCase().trim(),
      passwordHash,
      first_name.trim(),
      last_name.trim(),
      phone ? phone.trim() : null
    );

    const userId = result.lastInsertRowid;

    // Générer les tokens
    const accessToken = generateAccessToken(userId);
    const { token: refreshToken, hash: refreshHash } = generateRefreshToken(userId);

    // Sauvegarder le refresh token hashé en BDD
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS).toISOString();
    db.prepare('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(
      userId, refreshHash, expiresAt
    );

    setTokenCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      user: { id: userId, email: email.toLowerCase().trim(), first_name: first_name.trim(), last_name: last_name.trim() },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      // Délibérément vague pour ne pas révéler si l'email existe
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Email ou mot de passe incorrect' },
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Email ou mot de passe incorrect' },
      });
    }

    // Générer les tokens
    const accessToken = generateAccessToken(user.id);
    const { token: refreshToken, hash: refreshHash } = generateRefreshToken(user.id);

    // Révoquer les anciens refresh tokens de cet utilisateur (session unique)
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(user.id);

    // Sauvegarder le nouveau refresh token
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS).toISOString();
    db.prepare('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(
      user.id, refreshHash, expiresAt
    );

    setTokenCookies(res, accessToken, refreshToken);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Révoquer le refresh token en BDD
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      getDb().prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(hash);
    }

    // Supprimer les cookies
    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'strict' });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', path: '/api/auth' });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Renouvellement de l'access token via le refresh token (rotation)
 */
function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token manquant' },
      });
    }

    // Vérifier la signature JWT
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token invalide ou expiré' },
      });
    }

    const db = getDb();
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Vérifier que le token existe en BDD et n'est pas expiré
    const stored = db.prepare(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP'
    ).get(hash);

    if (!stored) {
      return res.status(401).json({
        error: { code: 'REFRESH_TOKEN_REVOKED', message: 'Refresh token révoqué ou expiré' },
      });
    }

    // Vérifier que l'utilisateur existe
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(payload.userId);
    if (!user) {
      return res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' },
      });
    }

    // Rotation : générer un nouveau couple de tokens
    const newAccessToken = generateAccessToken(user.id);
    const { token: newRefreshToken, hash: newRefreshHash } = generateRefreshToken(user.id);

    // Révoquer l'ancien refresh token et enregistrer le nouveau
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS).toISOString();
    db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(hash);
    db.prepare('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(
      user.id, newRefreshHash, expiresAt
    );

    setTokenCookies(res, newAccessToken, newRefreshToken);

    return res.json({ message: 'Token renouvelé' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
function getMe(req, res) {
  return res.json({ user: req.user });
}

/**
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT id, first_name, email FROM users WHERE email = ?').get(email.toLowerCase().trim());

    // Toujours répondre 200 même si l'email n'existe pas (sécurité : ne pas révéler les comptes)
    if (!user) {
      return res.json({ message: 'Si cet email existe, un lien a été envoyé.' });
    }

    // Générer un token sécurisé (32 octets = 64 hex chars)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 heure

    // Supprimer les anciens tokens de cet utilisateur
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);

    // Sauvegarder le nouveau token
    db.prepare('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(
      user.id, tokenHash, expiresAt
    );

    const clientUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reinitialisation-mot-de-passe/${token}`;

    await sendPasswordResetEmail(user.email, user.first_name, resetLink);

    return res.json({ message: 'Si cet email existe, un lien a été envoyé.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, new_password } = req.body;
    const db = getDb();

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const stored = db.prepare(
      'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP AND used = 0'
    ).get(tokenHash);

    if (!stored) {
      return res.status(400).json({
        error: { code: 'INVALID_TOKEN', message: 'Lien invalide ou expiré. Faites une nouvelle demande.' },
      });
    }

    const passwordHash = await bcrypt.hash(new_password, 12);

    // Mettre à jour le mot de passe
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, stored.user_id);

    // Marquer le token comme utilisé
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(stored.id);

    // Révoquer tous les refresh tokens (déconnexion forcée partout)
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(stored.user_id);

    return res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, refresh, getMe, forgotPassword, resetPassword };
