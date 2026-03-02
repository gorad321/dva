/**
 * DVA - Contrôleur produits, catégories, marques
 */
const { getDb } = require('../db/database');

/**
 * GET /api/products
 * Filtres : q, category, brand, minPrice, maxPrice, sort, page, limit
 */
function getProducts(req, res, next) {
  try {
    const db = getDb();
    const {
      q = '',
      category = '',
      brand = '',
      minPrice = 0,
      maxPrice = 999999,
      sort = 'name_asc',
      page = 1,
      limit = 12,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    // Recherche texte (protection injection : paramètres liés)
    if (q) {
      conditions.push('(p.name LIKE ? OR p.short_description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      conditions.push('c.slug = ?');
      params.push(category);
    }
    if (brand) {
      conditions.push('b.slug = ?');
      params.push(brand);
    }
    conditions.push('p.price >= ? AND p.price <= ?');
    params.push(parseFloat(minPrice), parseFloat(maxPrice));

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Tri sécurisé (liste blanche pour éviter injection)
    const sortMap = {
      name_asc: 'p.name ASC',
      name_desc: 'p.name DESC',
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
      newest: 'p.created_at DESC',
    };
    const orderBy = sortMap[sort] || 'p.name ASC';

    // Requête avec paramètres liés (aucune interpolation)
    const sql = `
      SELECT p.id, p.name, p.slug, p.short_description, p.price, p.original_price,
             p.stock, p.is_featured, p.sku,
             c.name AS category_name, c.slug AS category_slug,
             b.name AS brand_name, b.slug AS brand_slug,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image_url,
             (SELECT alt_text FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image_alt,
             (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) AS avg_rating,
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS review_count
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      ${where}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const products = db.prepare(sql).all(...params);

    // Total pour la pagination (mêmes filtres sans LIMIT/OFFSET)
    const countSql = `
      SELECT COUNT(*) AS total
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      ${where}
    `;
    const countParams = params.slice(0, params.length - 2);
    const { total } = db.prepare(countSql).get(...countParams);

    return res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/search/suggestions?q=
 */
function getSearchSuggestions(req, res, next) {
  try {
    const { q = '' } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: [] });

    const db = getDb();
    const suggestions = db.prepare(`
      SELECT p.name, p.slug,
             c.name AS category,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image_url
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.name LIKE ?
      LIMIT 8
    `).all(`%${q}%`);

    return res.json({ suggestions });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:slug
 */
function getProductBySlug(req, res, next) {
  try {
    const db = getDb();
    const { slug } = req.params;

    const product = db.prepare(`
      SELECT p.*,
             c.name AS category_name, c.slug AS category_slug,
             b.name AS brand_name, b.slug AS brand_slug,
             (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) AS avg_rating,
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS review_count
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      WHERE p.slug = ?
    `).get(slug);

    if (!product) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Produit introuvable' },
      });
    }

    const images = db.prepare(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC'
    ).all(product.id);

    const specs = db.prepare(
      'SELECT spec_key, spec_value FROM product_specs WHERE product_id = ?'
    ).all(product.id);

    const compatibility = db.prepare(
      'SELECT make, model, year_from, year_to, engine FROM vehicle_compatibility WHERE product_id = ? ORDER BY make, model'
    ).all(product.id);

    return res.json({ product: { ...product, images, specs, compatibility } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/categories
 */
function getCategories(req, res, next) {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    return res.json({ categories });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/brands
 */
function getBrands(req, res, next) {
  try {
    const db = getDb();
    const brands = db.prepare(`
      SELECT b.*, COUNT(p.id) AS product_count
      FROM brands b
      INNER JOIN products p ON p.brand_id = b.id AND p.stock > 0
      GROUP BY b.id
      ORDER BY b.name ASC
    `).all();

    return res.json({ brands });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/featured (produits vedettes pour homepage)
 */
function getFeaturedProducts(req, res, next) {
  try {
    const db = getDb();
    const products = db.prepare(`
      SELECT p.id, p.name, p.slug, p.short_description, p.price, p.original_price,
             p.stock, c.name AS category_name, b.name AS brand_name,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image_url,
             (SELECT alt_text FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image_alt,
             (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) AS avg_rating
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      WHERE p.is_featured = 1
      LIMIT 8
    `).all();

    return res.json({ products });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getProductBySlug,
  getSearchSuggestions,
  getCategories,
  getBrands,
  getFeaturedProducts,
};
