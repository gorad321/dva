const { Router } = require('express');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/ordersController');

const router = Router();

// Créer une commande — accessible aux invités et aux connectés
router.post('/', [
  optionalAuth,
  body('shipping_address').isObject().withMessage('Adresse de livraison invalide'),
  body('shipping_address.first_name').trim().escape().notEmpty().withMessage('Prénom requis'),
  body('shipping_address.last_name').trim().escape().notEmpty().withMessage('Nom requis'),
  body('shipping_address.address1').trim().escape().notEmpty().withMessage('Adresse requise'),
  body('shipping_address.city').trim().escape().notEmpty().withMessage('Ville requise'),
  body('shipping_address.postal_code').trim().escape().optional({ checkFalsy: true }),
  body('shipping_address.country').trim().escape().notEmpty().withMessage('Pays requis'),
  body('payment_method').isIn(['card', 'wave', 'orange_money', 'cash_on_delivery']).withMessage('Mode de paiement invalide'),
  // Email optionnel pour les invités (format validé seulement si fourni)
  body('guest_email')
    .optional({ checkFalsy: true })
    .isEmail().normalizeEmail().withMessage('Email invalide'),
  body('items')
    .if((val, { req }) => !req.user)
    .isArray({ min: 1 }).withMessage('La liste des articles est requise pour les invités'),
  handleValidation,
], ctrl.createOrder);

// Historique — connectés uniquement
router.get('/', requireAuth, ctrl.getOrders);

// Commande par token invité — doit être déclaré AVANT /:id
router.get('/guest/:token', ctrl.getOrderByGuestToken);

// Détail commande — connecté OU invité avec token en query string
router.get('/:id', optionalAuth, ctrl.getOrderById);

module.exports = router;
