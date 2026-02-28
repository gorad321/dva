const { Router } = require('express');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/accountController');

const router = Router();

router.use(requireAuth);

router.get('/profile', ctrl.getProfile);

router.put('/profile', [
  body('first_name').trim().escape().notEmpty().isLength({ max: 60 }).withMessage('Prénom requis'),
  body('last_name').trim().escape().notEmpty().isLength({ max: 60 }).withMessage('Nom requis'),
  body('phone').optional({ nullable: true }).trim().escape(),
  handleValidation,
], ctrl.updateProfile);

router.put('/password', [
  body('current_password').notEmpty().withMessage('Mot de passe actuel requis'),
  body('new_password').isLength({ min: 8 }).withMessage('Nouveau mot de passe min. 8 caractères')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir une majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir un chiffre'),
  handleValidation,
], ctrl.changePassword);

module.exports = router;
