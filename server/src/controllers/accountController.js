/**
 * DVA - Contrôleur compte client
 */
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

/**
 * GET /api/account/profile
 */
function getProfile(req, res) {
  return res.json({ user: req.user });
}

/**
 * PUT /api/account/profile
 */
function updateProfile(req, res, next) {
  try {
    const { first_name, last_name, phone } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE users SET first_name = ?, last_name = ?, phone = ?
      WHERE id = ?
    `).run(first_name.trim(), last_name.trim(), phone ? phone.trim() : null, req.user.id);

    const user = db.prepare(
      'SELECT id, email, first_name, last_name, phone FROM users WHERE id = ?'
    ).get(req.user.id);

    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/account/password
 */
async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    const match = await bcrypt.compare(current_password, user.password_hash);
    if (!match) {
      return res.status(400).json({
        error: { code: 'WRONG_PASSWORD', message: 'Mot de passe actuel incorrect' },
      });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    // Révoquer tous les refresh tokens (déconnexion de toutes les sessions)
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user.id);

    return res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword };
