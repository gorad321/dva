/**
 * DVA - Routes recherche par véhicule
 */
const { Router } = require('express');
const { query } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { getDb } = require('../db/database');

const router = Router();

/**
 * GET /api/vehicle/makes
 * Liste des marques de véhicules disponibles (triées)
 */
router.get('/makes', (req, res, next) => {
  try {
    const db = getDb();
    const makes = db.prepare(
      'SELECT DISTINCT make FROM vehicle_compatibility ORDER BY make ASC'
    ).all().map((r) => r.make);
    res.json({ makes });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vehicle/models?make=Renault
 */
router.get('/models', [
  query('make').trim().notEmpty().withMessage('Marque requise'),
  handleValidation,
], (req, res, next) => {
  try {
    const db = getDb();
    const models = db.prepare(
      'SELECT DISTINCT model FROM vehicle_compatibility WHERE make = ? ORDER BY model ASC'
    ).all(req.query.make).map((r) => r.model);
    res.json({ models });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vehicle/years?make=Renault&model=Clio
 */
router.get('/years', [
  query('make').trim().notEmpty().withMessage('Marque requise'),
  query('model').trim().notEmpty().withMessage('Modèle requis'),
  handleValidation,
], (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT DISTINCT year_from, year_to FROM vehicle_compatibility WHERE make = ? AND model = ?'
    ).all(req.query.make, req.query.model);

    const yearsSet = new Set();
    rows.forEach(({ year_from, year_to }) => {
      if (year_from) yearsSet.add(year_from);
      if (year_to) yearsSet.add(year_to);
    });
    const years = [...yearsSet].sort((a, b) => a - b);

    res.json({ years });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vehicle/products?make=Renault&model=Clio&year=2018
 * Produits compatibles avec le véhicule sélectionné
 */
router.get('/products', [
  query('make').trim().notEmpty().withMessage('Marque requise'),
  query('model').trim().notEmpty().withMessage('Modèle requis'),
  handleValidation,
], (req, res, next) => {
  try {
    const { make, model, year } = req.query;
    const db = getDb();

    let sql = `
      SELECT DISTINCT
        p.id, p.name, p.slug, p.price, p.original_price, p.stock,
        p.short_description, p.is_featured,
        c.name AS category_name, c.slug AS category_slug,
        b.name AS brand_name,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image_url,
        vc.engine, vc.year_from, vc.year_to
      FROM products p
      JOIN vehicle_compatibility vc ON vc.product_id = p.id
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      WHERE vc.make = ? AND vc.model = ?
    `;
    const params = [make, model];

    if (year) {
      sql += ' AND (vc.year_from IS NULL OR vc.year_from <= ?) AND (vc.year_to IS NULL OR vc.year_to >= ?)';
      params.push(parseInt(year), parseInt(year));
    }

    sql += ' ORDER BY c.name, p.name';

    const products = db.prepare(sql).all(...params);

    res.json({ products, vehicle: { make, model, year: year || null } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
