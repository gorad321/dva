const { Router } = require('express');
const { body, param } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/cartController');

const router = Router();

// Toutes les routes panier nécessitent une authentification
router.use(requireAuth);

router.get('/', ctrl.getCart);

router.post('/items', [
  body('product_id').isInt({ min: 1 }).withMessage('product_id invalide'),
  body('quantity').optional().isInt({ min: 1, max: 99 }).withMessage('Quantité doit être entre 1 et 99'),
  handleValidation,
], ctrl.addItem);

router.put('/items/:id', [
  param('id').isInt({ min: 1 }),
  body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantité doit être entre 1 et 99'),
  handleValidation,
], ctrl.updateItem);

router.delete('/items/:id', [
  param('id').isInt({ min: 1 }),
  handleValidation,
], ctrl.removeItem);

router.delete('/', ctrl.clearCart);

module.exports = router;
