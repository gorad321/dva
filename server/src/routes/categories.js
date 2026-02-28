const { Router } = require('express');
const { cacheMiddleware } = require('../middleware/cache');
const ctrl = require('../controllers/productsController');

const router = Router();

// Liste catégories (cache 10 min)
router.get('/', cacheMiddleware(600, 'categories'), ctrl.getCategories);

module.exports = router;
