const { Router } = require('express');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/reviewsController');

const router = Router();

// Avis d'un produit (public)
router.get('/:slug', ctrl.getProductReviews);

// Poster un avis (authentifié)
router.post('/:slug', requireAuth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Note entre 1 et 5 requise'),
  body('title').optional().trim().escape().isLength({ max: 120 }).withMessage('Titre max 120 caractères'),
  body('comment').optional().trim().escape().isLength({ max: 1000 }).withMessage('Commentaire max 1000 caractères'),
  handleValidation,
], ctrl.createReview);

module.exports = router;
