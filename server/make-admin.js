/**
 * Script utilitaire : promouvoir un utilisateur en admin
 * Usage : node --experimental-sqlite make-admin.js email@example.com
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node --experimental-sqlite make-admin.js votre@email.com');
  process.exit(1);
}

const dbPath = path.join(__dirname, '../dva.db');
const db = new DatabaseSync(dbPath);

const user = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(email.toLowerCase());
if (!user) {
  console.error(`❌ Utilisateur "${email}" introuvable.`);
  process.exit(1);
}

if (user.role === 'admin') {
  console.log(`✅ "${email}" est déjà admin.`);
  process.exit(0);
}

db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
console.log(`✅ "${email}" est maintenant admin ! Reconnectez-vous pour activer les droits.`);
db.close();
