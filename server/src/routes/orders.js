const { Router } = require('express');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/ordersController');

const router = Router();

router.use(requireAuth);

router.post('/', [
  body('shipping_address').isObject().withMessage('Adresse de livraison invalide'),
  body('shipping_address.first_name').trim().escape().notEmpty().withMessage('Prénom requis'),
  body('shipping_address.last_name').trim().escape().notEmpty().withMessage('Nom requis'),
  body('shipping_address.address1').trim().escape().notEmpty().withMessage('Adresse requise'),
  body('shipping_address.city').trim().escape().notEmpty().withMessage('Ville requise'),
  body('shipping_address.postal_code').trim().escape().optional({ checkFalsy: true }),
  body('shipping_address.country').trim().escape().notEmpty().withMessage('Pays requis'),
  body('payment_method').isIn(['card', 'wave', 'orange_money', 'cash_on_delivery']).withMessage('Mode de paiement invalide'),
  handleValidation,
], ctrl.createOrder);

router.get('/', ctrl.getOrders);
router.get('/:id', ctrl.getOrderById);

module.exports = router;
