const { Router } = require('express');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/promotionsController');

const router = Router();

router.post('/validate', [
  body('code').trim().notEmpty().withMessage('Code promo requis').isLength({ max: 50 }),
  body('cart_total').isFloat({ min: 0 }).withMessage('Total panier invalide'),
  handleValidation,
], ctrl.validatePromo);

module.exports = router;
