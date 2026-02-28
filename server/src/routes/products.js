const { Router } = require('express');
const { query } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { cacheMiddleware } = require('../middleware/cache');
const ctrl = require('../controllers/productsController');

const router = Router();

// Suggestions de recherche (cache 1 min)
router.get('/search/suggestions',
  [query('q').trim().escape().optional()],
  handleValidation,
  cacheMiddleware(60),
  ctrl.getSearchSuggestions
);

// Produits vedettes (cache 5 min)
router.get('/featured', cacheMiddleware(300, 'featured_products'), ctrl.getFeaturedProducts);

// Liste produits avec filtres (cache 2 min)
router.get('/',
  [
    query('q').optional().trim().escape(),
    query('category').optional().trim().escape(),
    query('brand').optional().trim().escape(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('sort').optional().isIn(['name_asc', 'name_desc', 'price_asc', 'price_desc', 'newest']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 48 }),
  ],
  handleValidation,
  cacheMiddleware(120),
  ctrl.getProducts
);

// Détail produit (cache 5 min)
router.get('/:slug', cacheMiddleware(300), ctrl.getProductBySlug);

module.exports = router;
