const { Router } = require('express');
const { cacheMiddleware } = require('../middleware/cache');
const ctrl = require('../controllers/productsController');

const router = Router();

// Liste marques (cache 10 min)
router.get('/', cacheMiddleware(600, 'brands'), ctrl.getBrands);

module.exports = router;
