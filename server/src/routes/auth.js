const { Router } = require('express');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

const router = Router();

// Inscription
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe min. 8 caractères')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre'),
  body('first_name').trim().escape().notEmpty().isLength({ max: 60 }).withMessage('Prénom requis (max 60 car.)'),
  body('last_name').trim().escape().notEmpty().isLength({ max: 60 }).withMessage('Nom requis (max 60 car.)'),
  body('phone').optional({ nullable: true }).trim().escape().isMobilePhone('any').withMessage('Téléphone invalide'),
  handleValidation,
], ctrl.register);

// Connexion
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  handleValidation,
], ctrl.login);

// Déconnexion
router.post('/logout', ctrl.logout);

// Refresh token
router.post('/refresh', ctrl.refresh);

// Profil actuel
router.get('/me', requireAuth, ctrl.getMe);

// Mot de passe oublié
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  handleValidation,
], ctrl.forgotPassword);

// Réinitialisation du mot de passe
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token requis'),
  body('new_password').isLength({ min: 8 }).withMessage('Mot de passe min. 8 caractères')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre'),
  handleValidation,
], ctrl.resetPassword);

module.exports = router;
