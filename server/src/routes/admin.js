/**
 * DVA - Routes Admin (protégées par requireAdmin)
 */
const path = require('path');
const fs = require('fs');
const { Router } = require('express');
const { body, query } = require('express-validator');
const multer = require('multer');
const { handleValidation } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

// ─── Multer : upload images icônes catégories ─────────────────────────────────
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `icon_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo max
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|svg\+xml|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Seules les images sont acceptées (jpg, png, svg, webp)'));
  },
});

const router = Router();

// Toutes les routes admin nécessitent le rôle admin
router.use(requireAdmin);

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get('/stats', ctrl.getStats);

// ─── Produits ────────────────────────────────────────────────────────────────
router.get('/products', ctrl.getAdminProducts);

router.post('/products', [
  body('name').trim().notEmpty().isLength({ max: 200 }).withMessage('Nom requis'),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug invalide (lettres minuscules, chiffres, tirets)'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('stock').isInt({ min: 0 }).withMessage('Stock invalide'),
  body('category_id').isInt({ min: 1 }).withMessage('Catégorie requise'),
  handleValidation,
], ctrl.createProduct);

router.put('/products/:id', [
  body('name').trim().notEmpty().isLength({ max: 200 }),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('category_id').isInt({ min: 1 }),
  handleValidation,
], ctrl.updateProduct);

router.delete('/products/:id', ctrl.deleteProduct);
router.patch('/products/:id/featured', ctrl.toggleFeatured);

// ─── Produits : images / specs / compat ──────────────────────────────────────
router.get('/products/:id/details', ctrl.getProductDetails);
router.post('/products/:id/images', ctrl.addProductImage);
router.delete('/products/images/:imageId', ctrl.deleteProductImage);
router.post('/products/:id/specs', ctrl.addProductSpec);
router.delete('/products/specs/:specId', ctrl.deleteProductSpec);
router.post('/products/:id/compat', ctrl.addProductCompat);
router.delete('/products/compat/:compatId', ctrl.deleteProductCompat);

// ─── Commandes ────────────────────────────────────────────────────────────────
router.get('/orders', ctrl.getAdminOrders);
router.get('/orders/:id', ctrl.getAdminOrderDetails);
router.patch('/orders/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).withMessage('Statut invalide'),
  handleValidation,
], ctrl.updateOrderStatus);

// ─── Utilisateurs ─────────────────────────────────────────────────────────────
router.get('/users', ctrl.getAdminUsers);
router.patch('/users/:id/role', [
  body('role').isIn(['client', 'admin']).withMessage('Rôle invalide'),
  handleValidation,
], ctrl.updateUserRole);

// ─── Avis ─────────────────────────────────────────────────────────────────────
router.get('/reviews', ctrl.getAdminReviews);
router.delete('/reviews/:id', ctrl.deleteReview);

// ─── Promotions ───────────────────────────────────────────────────────────────
router.get('/promotions', ctrl.getAdminPromotions);
router.post('/promotions', [
  body('name').trim().notEmpty().withMessage('Nom requis'),
  body('discount_type').isIn(['percentage', 'fixed']).withMessage('Type invalide'),
  body('discount_value').isFloat({ min: 0.01 }).withMessage('Valeur requise'),
  handleValidation,
], ctrl.createPromotion);
router.put('/promotions/:id', [
  body('name').trim().notEmpty(),
  body('discount_type').isIn(['percentage', 'fixed']),
  body('discount_value').isFloat({ min: 0.01 }),
  handleValidation,
], ctrl.updatePromotion);
router.delete('/promotions/:id', ctrl.deletePromotion);

// ─── Catégories & Marques ─────────────────────────────────────────────────────
router.post('/categories', [
  body('name').trim().notEmpty().withMessage('Nom requis'),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug invalide'),
  handleValidation,
], ctrl.createCategory);
router.put('/categories/:id', [
  body('name').trim().notEmpty(),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
  handleValidation,
], ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

router.post('/brands', [
  body('name').trim().notEmpty().withMessage('Nom requis'),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug invalide'),
  body('logo_url').optional({ checkFalsy: true }).trim(),
  handleValidation,
], ctrl.createBrand);
router.put('/brands/:id', [
  body('name').trim().notEmpty(),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
  body('logo_url').optional({ checkFalsy: true }).trim(),
  handleValidation,
], ctrl.updateBrand);
router.delete('/brands/:id', ctrl.deleteBrand);

// ─── Export CSV ───────────────────────────────────────────────────────────────
router.get('/export/products', ctrl.exportProducts);
router.get('/export/orders', ctrl.exportOrders);
router.get('/export/users', ctrl.exportUsers);

// ─── Pages informations ──────────────────────────────────────────────────────
router.get('/pages', ctrl.getAdminPages);
router.put('/pages/:slug', [
  body('title').trim().notEmpty().withMessage('Titre requis'),
  body('content').trim().notEmpty().withMessage('Contenu requis'),
  handleValidation,
], ctrl.updatePage);

// ─── Paramètres Footer ────────────────────────────────────────────────────────
router.get('/settings/footer', ctrl.getFooterSettings);
router.put('/settings/footer', ctrl.updateFooterSettings);

// ─── Paramètres Paiement ──────────────────────────────────────────────────────
router.get('/settings/payment', ctrl.getPaymentSettings);
router.put('/settings/payment', ctrl.updatePaymentSettings);

// ─── Slides bannière hero ─────────────────────────────────────────────────────
router.get('/settings/hero', ctrl.getHeroSlides);
router.put('/settings/hero', ctrl.updateHeroSlides);

// ─── Upload image icône ────────────────────────────────────────────────────────
router.post('/upload/icon', upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { message: 'Aucun fichier reçu' } });
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err) { next(err); }
});

module.exports = router;
