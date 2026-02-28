/**
 * DVA - Service email
 * Utilise Nodemailer avec Ethereal (SMTP fictif) en développement.
 * En production, remplacer les identifiants Ethereal par un vrai SMTP (Gmail, SendGrid…)
 */
const nodemailer = require('nodemailer');

let transporter = null;
let previewAccount = null;

/**
 * Initialise le transporteur email.
 * En développement : crée un compte Ethereal automatiquement.
 * En production : utilise les variables d'environnement SMTP_*.
 */
async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Mode développement : compte Ethereal fictif (emails visibles sur ethereal.email)
    try {
      previewAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: previewAccount.user,
          pass: previewAccount.pass,
        },
      });
      console.log('📧 Service email Ethereal initialisé :', previewAccount.user);
    } catch (err) {
      // Si Ethereal est inaccessible, on logue juste les emails
      console.warn('⚠️  Ethereal indisponible, emails loggés en console uniquement');
      transporter = {
        sendMail: async (opts) => {
          console.log('\n📧 EMAIL (mode console) ─────────────────────');
          console.log('  À :', opts.to);
          console.log('  Sujet :', opts.subject);
          console.log('  Lien :', opts.text?.match(/https?:\/\/\S+/)?.[0] || '');
          console.log('─────────────────────────────────────────────\n');
          return { messageId: 'console-' + Date.now() };
        },
      };
    }
  }

  return transporter;
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
async function sendPasswordResetEmail(to, firstName, resetLink) {
  const t = await getTransporter();

  const info = await t.sendMail({
    from: `"DVA Auto" <noreply@dva-auto.fr>`,
    to,
    subject: 'Réinitialisation de votre mot de passe DVA',
    text: `Bonjour ${firstName},\n\nVous avez demandé à réinitialiser votre mot de passe.\nCliquez sur ce lien (valable 1 heure) :\n\n${resetLink}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nCordialement,\nL'équipe DVA Auto`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #003DA5; padding: 20px; text-align: center;">
          <span style="color: white; font-size: 28px; font-weight: 900;">D</span>
          <span style="color: #E31E24; font-size: 28px; font-weight: 900;">VA</span>
          <span style="color: white; font-size: 16px; margin-left: 8px;">Auto</span>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-bottom: 16px;">Réinitialisation de mot de passe</h2>
          <p style="color: #4b5563;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color: #4b5563;">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #E31E24; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Ce lien est valable <strong>1 heure</strong>. Après expiration, vous devrez faire une nouvelle demande.</p>
          <p style="color: #6b7280; font-size: 14px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe ne sera pas modifié.</p>
        </div>
        <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
          © 2025 DVA Auto — Pièces automobiles
        </div>
      </div>
    `,
  });

  if (previewAccount) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\n📧 Email envoyé ! Visualiser sur : ${previewUrl}\n`);
    return { previewUrl };
  }

  return { messageId: info.messageId };
}

/**
 * Envoie un email de confirmation de commande
 */
async function sendOrderConfirmationEmail(to, firstName, order) {
  const t = await getTransporter();

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.product_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${(item.unit_price * item.quantity).toFixed(2)} €</td>
      </tr>`
    )
    .join('');

  const info = await t.sendMail({
    from: `"DVA Auto" <noreply@dva-auto.fr>`,
    to,
    subject: `Confirmation de votre commande DVA #${String(order.id).padStart(6, '0')}`,
    text: `Bonjour ${firstName},\n\nVotre commande #${String(order.id).padStart(6, '0')} a bien été confirmée.\nMontant total : ${Number(order.total_amount).toFixed(2)} €\n\nMerci pour votre confiance !\nL'équipe DVA Auto`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #003DA5; padding: 20px; text-align: center;">
          <span style="color: white; font-size: 28px; font-weight: 900;">D</span>
          <span style="color: #E31E24; font-size: 28px; font-weight: 900;">VA</span>
          <span style="color: white; font-size: 16px; margin-left: 8px;">Auto</span>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="background: #d1fae5; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">✅</div>
          </div>
          <h2 style="color: #111827; text-align: center;">Commande confirmée !</h2>
          <p style="color: #4b5563;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color: #4b5563;">Votre commande <strong>#${String(order.id).padStart(6, '0')}</strong> a bien été enregistrée.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px 8px; text-align: left; color: #374151; font-size: 14px;">Article</th>
                <th style="padding: 10px 8px; text-align: center; color: #374151; font-size: 14px;">Qté</th>
                <th style="padding: 10px 8px; text-align: right; color: #374151; font-size: 14px;">Prix</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px 8px; font-weight: bold; color: #111827;">Total payé</td>
                <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #E31E24; font-size: 16px;">${Number(order.total_amount).toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>

          <p style="color: #4b5563; font-size: 14px;">Vous pouvez suivre votre commande dans votre espace client.</p>
        </div>
        <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
          © 2025 DVA Auto — Pièces automobiles
        </div>
      </div>
    `,
  });

  if (previewAccount) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\n📧 Email confirmation commande envoyé ! Voir : ${previewUrl}\n`);
    return { previewUrl };
  }

  return { messageId: info.messageId };
}

module.exports = { sendPasswordResetEmail, sendOrderConfirmationEmail, getTransporter };
