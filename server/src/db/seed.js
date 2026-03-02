/**
 * DVA - Données initiales (seed)
 * 6 catégories, 10 marques, 30 produits avec images, specs et compatibilités
 */
const bcrypt = require('bcryptjs');

function seedDatabase(db) {
  // ─── Compte administrateur par défaut ────────────────────────────────────
  const adminExists = db.prepare("SELECT id FROM users WHERE email = 'admin@dva.sn'").get();
  if (!adminExists) {
    const passwordHash = bcrypt.hashSync('Admin1234', 12);
    db.prepare(
      "INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, 'admin')"
    ).run('admin@dva.sn', passwordHash, 'Admin', 'DVA');
    console.log('✅ Compte admin créé : admin@dva.sn / Admin1234');
  }

  // ─── Catégories ──────────────────────────────────────────────────────────
  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)'
  );
  const categories = [
    { name: 'Freins', slug: 'freins', description: 'Plaquettes, disques, étriers et kits frein', icon: 'disc' },
    { name: 'Filtres', slug: 'filtres', description: 'Filtres à huile, air, habitacle et carburant', icon: 'filter' },
    { name: 'Pneus', slug: 'pneus', description: 'Pneus été, hiver, toutes saisons et pneus run-flat', icon: 'circle' },
    { name: 'Batteries', slug: 'batteries', description: 'Batteries voiture, AGM, EFB et gel', icon: 'zap' },
    { name: 'Huiles & Liquides', slug: 'huiles-liquides', description: 'Huiles moteur, liquide de frein, liquide de refroidissement', icon: 'droplets' },
    { name: 'Allumage & Distribution', slug: 'allumage-distribution', description: 'Bougies, bobines, courroies et kits distribution', icon: 'settings' },
  ];
  categories.forEach((c) => insertCategory.run(c.name, c.slug, c.description, c.icon));

  // ─── Marques ─────────────────────────────────────────────────────────────
  const insertBrand = db.prepare('INSERT OR IGNORE INTO brands (name, slug) VALUES (?, ?)');
  const brands = [
    { name: 'Brembo', slug: 'brembo' },
    { name: 'Bosch', slug: 'bosch' },
    { name: 'Mann Filter', slug: 'mann-filter' },
    { name: 'K&N', slug: 'kn' },
    { name: 'Michelin', slug: 'michelin' },
    { name: 'Continental', slug: 'continental' },
    { name: 'Varta', slug: 'varta' },
    { name: 'Castrol', slug: 'castrol' },
    { name: 'NGK', slug: 'ngk' },
    { name: 'Dayco', slug: 'dayco' },
  ];
  brands.forEach((b) => insertBrand.run(b.name, b.slug));

  // Récupérer les IDs
  const getCat = (slug) => db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug).id;
  const getBrand = (slug) => db.prepare('SELECT id FROM brands WHERE slug = ?').get(slug).id;

  // ─── Produits ─────────────────────────────────────────────────────────────
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products
      (name, slug, description, short_description, price, original_price, stock, category_id, brand_id, sku, weight, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertImage = db.prepare(
    'INSERT INTO product_images (product_id, url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  const insertSpec = db.prepare(
    'INSERT INTO product_specs (product_id, spec_key, spec_value) VALUES (?, ?, ?)'
  );
  const insertCompat = db.prepare(
    'INSERT INTO vehicle_compatibility (product_id, make, model, year_from, year_to, engine) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const products = [
    // ── FREINS ────────────────────────────────────────────────────────────
    {
      name: 'Plaquettes de frein avant Brembo P06071',
      slug: 'plaquettes-frein-avant-brembo-p06071',
      description: 'Plaquettes de frein avant Brembo haute performance, conçues pour une utilisation sur route avec une excellente résistance à la chaleur et une faible usure du disque. Formule brevetée NAO (Non Amiante Organique) pour une friction optimale sans bruit.',
      short_description: 'Plaquettes avant Brembo haute performance, formule NAO silencieuse',
      price: 28000,
      original_price: 36000,
      stock: 48,
      category: 'freins',
      brand: 'brembo',
      sku: 'BRE-P06071',
      weight: 0.8,
      is_featured: 1,
      images: [
        { url: 'https://picsum.photos/seed/brake1/600/400', alt: 'Plaquettes Brembo P06071 - vue principale', primary: 1 },
        { url: 'https://picsum.photos/seed/brake1b/600/400', alt: 'Plaquettes Brembo P06071 - détail friction', primary: 0 },
      ],
      specs: [
        ['Référence OEM', '34 11 6 761 279'],
        ['Position', 'Avant'],
        ['Matériau', 'NAO (Non Amiante Organique)'],
        ['Épaisseur garniture', '17 mm'],
        ['Température max.', '400°C'],
        ['Norme', 'ECE R90'],
      ],
      compat: [
        { make: 'BMW', model: 'Série 3 (E90/E91)', year_from: 2005, year_to: 2012, engine: '318d 143ch' },
        { make: 'BMW', model: 'Série 3 (E90/E91)', year_from: 2005, year_to: 2012, engine: '320i 150ch' },
        { make: 'BMW', model: 'Série 5 (E60)', year_from: 2003, year_to: 2010, engine: '520d 163ch' },
      ],
    },
    {
      name: 'Disques de frein EBC Ultimax USR1082',
      slug: 'disques-frein-ebc-ultimax-usr1082',
      description: 'Disques de frein percés et rainurés EBC Ultimax USR pour une performance supérieure. Les rainures évacuent les gaz et la poussière de frein, réduisant le fading. Compatible avec les plaquettes standard et sport.',
      short_description: 'Disques percés rainurés EBC, réduction du fading garantie',
      price: 59000,
      original_price: null,
      stock: 22,
      category: 'freins',
      brand: 'bosch',
      sku: 'EBC-USR1082',
      weight: 4.2,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/disc1/600/400', alt: 'Disques EBC USR1082 - vue principale', primary: 1 },
      ],
      specs: [
        ['Diamètre', '300 mm'],
        ['Épaisseur', '25 mm'],
        ['Nombre de trous', '5'],
        ['Ventilation', 'Ventilé'],
        ['Surface', 'Percé/Rainuré'],
        ['Traitement', 'Geocoat anti-rouille'],
      ],
      compat: [
        { make: 'Volkswagen', model: 'Golf VII', year_from: 2012, year_to: 2020, engine: '2.0 TDI 150ch' },
        { make: 'Volkswagen', model: 'Golf VII', year_from: 2012, year_to: 2020, engine: '1.4 TSI 125ch' },
        { make: 'Seat', model: 'Leon III', year_from: 2012, year_to: 2020, engine: '2.0 TDI 150ch' },
      ],
    },
    {
      name: 'Kit frein arrière Bosch BP977',
      slug: 'kit-frein-arriere-bosch-bp977',
      description: 'Kit complet frein arrière Bosch QuietCast incluant plaquettes et ressorts de rappel. Technologie de pointe pour une performance optimale et un fonctionnement silencieux. Installation facile avec le kit accessoires fourni.',
      short_description: 'Kit plaquettes arrière Bosch QuietCast avec accessoires',
      price: 25000,
      original_price: 29500,
      stock: 35,
      category: 'freins',
      brand: 'bosch',
      sku: 'BSH-BP977',
      weight: 0.7,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/brake2/600/400', alt: 'Kit frein Bosch BP977 - vue principale', primary: 1 },
      ],
      specs: [
        ['Type', 'Kit avec accessoires'],
        ['Position', 'Arrière'],
        ['Contenu', 'Plaquettes + ressorts + clips'],
        ['Matériau', 'Semi-métallique'],
        ['Compatibilité disque', 'Ventilé et plein'],
      ],
      compat: [
        { make: 'Peugeot', model: '308 II', year_from: 2013, year_to: 2021, engine: '1.6 BlueHDi 100ch' },
        { make: 'Peugeot', model: '308 II', year_from: 2013, year_to: 2021, engine: '1.2 PureTech 130ch' },
        { make: 'Citroën', model: 'C4 Picasso II', year_from: 2013, year_to: 2018, engine: '1.6 BlueHDi 115ch' },
      ],
    },
    {
      name: 'Étrier de frein avant gauche TRW',
      slug: 'etrier-frein-avant-gauche-trw',
      description: 'Étrier de frein avant gauche TRW remanufacturé selon les normes OEM. Testé en pression et en fuite avant expédition. Livré avec joint de piston et guide de montage.',
      short_description: 'Étrier avant gauche TRW remanufacturé, testé en pression',
      price: 81000,
      original_price: 103000,
      stock: 8,
      category: 'freins',
      brand: 'bosch',
      sku: 'TRW-BHW370',
      weight: 2.1,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/caliper1/600/400', alt: 'Étrier TRW - vue principale', primary: 1 },
      ],
      specs: [
        ['Côté', 'Gauche (AV)'],
        ['Nombre de pistons', '1'],
        ['Diamètre piston', '54 mm'],
        ['Type', 'Remanufacturé'],
        ['Norme', 'ISO 9001'],
      ],
      compat: [
        { make: 'Renault', model: 'Mégane III', year_from: 2008, year_to: 2016, engine: '1.5 dCi 110ch' },
        { make: 'Renault', model: 'Scénic III', year_from: 2009, year_to: 2016, engine: '1.5 dCi 110ch' },
      ],
    },
    // ── FILTRES ───────────────────────────────────────────────────────────
    {
      name: 'Filtre à huile Mann Filter W719/30',
      slug: 'filtre-huile-mann-filter-w719-30',
      description: 'Filtre à huile moteur Mann Filter W719/30, filtre à vissage en acier haute résistance. Média filtrant haute efficacité retenant 99,9% des particules dès 20 microns. Valve anti-retour intégrée pour maintien de pression au démarrage.',
      short_description: 'Filtre huile Mann Filter, métal, valve anti-retour intégrée',
      price: 5800,
      original_price: null,
      stock: 120,
      category: 'filtres',
      brand: 'mann-filter',
      sku: 'MAN-W71930',
      weight: 0.3,
      is_featured: 1,
      images: [
        { url: 'https://picsum.photos/seed/filter1/600/400', alt: 'Filtre huile Mann W719/30 - vue principale', primary: 1 },
      ],
      specs: [
        ['Type', 'Spin-on (à vissage)'],
        ['Hauteur', '79 mm'],
        ['Diamètre extérieur', '76 mm'],
        ['Filetage', 'M20x1,5'],
        ['Pression ouverture bypass', '1,6 bar'],
        ['Efficacité filtration', '99,9% à 20 µm'],
      ],
      compat: [
        { make: 'Renault', model: 'Clio IV', year_from: 2012, year_to: 2019, engine: '0.9 TCe 90ch' },
        { make: 'Renault', model: 'Clio IV', year_from: 2012, year_to: 2019, engine: '1.2 TCe 120ch' },
        { make: 'Nissan', model: 'Micra V', year_from: 2017, year_to: 2023, engine: '0.9 IG-T 90ch' },
      ],
    },
    {
      name: 'Filtre à air de performance K&N 33-3005',
      slug: 'filtre-air-performance-kn-33-3005',
      description: 'Filtre à air lavable et réutilisable K&N en coton huilé gaufrée 4 couches. Améliore le flux d\'air de 15% par rapport aux filtres papier standard. Garantie 1 million de miles (nettoyable et réhuilable). Augmente légèrement les performances moteur.',
      short_description: 'Filtre air K&N lavable, +15% flux air, garantie à vie',
      price: 36000,
      original_price: null,
      stock: 30,
      category: 'filtres',
      brand: 'kn',
      sku: 'KN-33-3005',
      weight: 0.25,
      is_featured: 1,
      images: [
        { url: 'https://picsum.photos/seed/airfilter1/600/400', alt: 'Filtre air K&N 33-3005 - vue principale', primary: 1 },
        { url: 'https://picsum.photos/seed/airfilter1b/600/400', alt: 'Filtre air K&N - vue gaufrée coton', primary: 0 },
      ],
      specs: [
        ['Type', 'Panneau plat (drop-in)'],
        ['Matériau', 'Coton huilé gaufrée 4 couches'],
        ['Longueur', '305 mm'],
        ['Largeur', '190 mm'],
        ['Hauteur', '35 mm'],
        ['Lavable', 'Oui (kit nettoyage vendu séparément)'],
      ],
      compat: [
        { make: 'Citroën', model: 'C4 II', year_from: 2010, year_to: 2018, engine: '1.6 THP 156ch' },
        { make: 'Peugeot', model: '308 I', year_from: 2007, year_to: 2013, engine: '1.6 THP 156ch' },
      ],
    },
    {
      name: 'Filtre habitacle antiallergique Bosch A3506',
      slug: 'filtre-habitacle-antiallergique-bosch-a3506',
      description: 'Filtre habitacle Bosch avec couche antiallergique aux ions d\'argent. Retient 99% des particules fines (PM2,5), pollens, bactéries et gaz nocifs. Structure en 5 couches avec charbon actif pour l\'absorption des odeurs.',
      short_description: 'Filtre habitacle Bosch antiallergique, charbon actif, anti-bactérien',
      price: 12000,
      original_price: 14500,
      stock: 75,
      category: 'filtres',
      brand: 'bosch',
      sku: 'BSH-A3506',
      weight: 0.15,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/cabinfilter1/600/400', alt: 'Filtre habitacle Bosch A3506 - vue principale', primary: 1 },
      ],
      specs: [
        ['Couches', '5 (dont charbon actif)'],
        ['Filtration PM2,5', '99%'],
        ['Anti-bactérien', 'Ions d\'argent'],
        ['Longueur', '280 mm'],
        ['Largeur', '195 mm'],
        ['Hauteur', '30 mm'],
      ],
      compat: [
        { make: 'Volkswagen', model: 'Passat B8', year_from: 2014, year_to: 2023, engine: 'Tous moteurs' },
        { make: 'Skoda', model: 'Octavia III', year_from: 2012, year_to: 2020, engine: 'Tous moteurs' },
        { make: 'Audi', model: 'A3 8V', year_from: 2012, year_to: 2020, engine: 'Tous moteurs' },
      ],
    },
    {
      name: 'Filtre carburant Mann Filter WK42/7',
      slug: 'filtre-carburant-mann-filter-wk42-7',
      description: 'Filtre carburant Mann Filter pour injection diesel common rail. Retient l\'eau et les particules jusqu\'à 3 microns pour protéger les injecteurs haute pression. Corps métallique résistant à la pression jusqu\'à 10 bar.',
      short_description: 'Filtre carburant diesel Mann Filter, anti-eau, 3 microns',
      price: 16000,
      original_price: null,
      stock: 55,
      category: 'filtres',
      brand: 'mann-filter',
      sku: 'MAN-WK427',
      weight: 0.35,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/fuelfilter1/600/400', alt: 'Filtre carburant Mann WK42/7 - vue principale', primary: 1 },
      ],
      specs: [
        ['Type', 'Avec séparateur eau'],
        ['Micronage', '3 µm'],
        ['Pression max.', '10 bar'],
        ['Filetage entrée', 'M14x1,5'],
        ['Filetage sortie', 'M14x1,5'],
      ],
      compat: [
        { make: 'Ford', model: 'Focus III', year_from: 2011, year_to: 2018, engine: '2.0 TDCi 150ch' },
        { make: 'Ford', model: 'Mondeo IV', year_from: 2007, year_to: 2014, engine: '2.0 TDCi 140ch' },
      ],
    },
    // ── PNEUS ─────────────────────────────────────────────────────────────
    {
      name: 'Pneu Michelin Pilot Sport 4 225/45 R17 91Y',
      slug: 'pneu-michelin-pilot-sport-4-225-45-r17',
      description: 'Le Michelin Pilot Sport 4 est un pneu ultra-haute performance conçu pour les véhicules sportifs et berlines puissantes. Grip exceptionnel sur sol sec et mouillé, directionnalité précise et durabilité record. Technologie Dynamic Response pour une conduite précise même à haute vitesse.',
      short_description: 'Pneu UHP Michelin, grip sec/mouillé exceptionnel, Dynamic Response',
      price: 85000,
      original_price: 97000,
      stock: 16,
      category: 'pneus',
      brand: 'michelin',
      sku: 'MCH-PS4-22545R17-91Y',
      weight: 8.5,
      is_featured: 1,
      images: [
        { url: 'https://picsum.photos/seed/tyre1/600/400', alt: 'Michelin Pilot Sport 4 225/45 R17 - vue principale', primary: 1 },
        { url: 'https://picsum.photos/seed/tyre1b/600/400', alt: 'Michelin Pilot Sport 4 - bande de roulement', primary: 0 },
      ],
      specs: [
        ['Dimensions', '225/45 R17'],
        ['Indice de charge', '91 (615 kg)'],
        ['Indice de vitesse', 'Y (300 km/h)'],
        ['Label EU carburant', 'A'],
        ['Label EU mouillé', 'A'],
        ['Label EU bruit', '70 dB'],
        ['Usage', 'Été'],
        ['Runflat', 'Non'],
      ],
      compat: [
        { make: 'BMW', model: 'Série 3 (F30)', year_from: 2011, year_to: 2019, engine: '320i / 330i' },
        { make: 'Mercedes', model: 'Classe C (W205)', year_from: 2014, year_to: 2021, engine: 'C 200 / C 250' },
        { make: 'Audi', model: 'A4 B9', year_from: 2015, year_to: 2023, engine: '2.0 TFSI / 2.0 TDI' },
      ],
    },
    {
      name: 'Pneu Continental SportContact 6 245/40 R18 97Y',
      slug: 'pneu-continental-sportcontact-6-245-40-r18',
      description: 'Continental SportContact 6, pneu ultra-haute performance pour sportives et GT. Approuvé par BMW, Mercedes-AMG et Porsche. Distance de freinage sur mouillé réduite de 5m par rapport à la génération précédente. Composé Traction Silica+ pour un grip maximal en toutes conditions.',
      short_description: 'Pneu UHP Continental, approuvé BMW/Porsche, freinage -5m sur mouillé',
      price: 124000,
      original_price: null,
      stock: 10,
      category: 'pneus',
      brand: 'continental',
      sku: 'CON-SC6-24540R18-97Y',
      weight: 9.8,
      is_featured: 1,
      images: [
        { url: 'https://picsum.photos/seed/tyre2/600/400', alt: 'Continental SportContact 6 - vue principale', primary: 1 },
      ],
      specs: [
        ['Dimensions', '245/40 R18'],
        ['Indice de charge', '97 (730 kg)'],
        ['Indice de vitesse', 'Y (300 km/h)'],
        ['Label EU carburant', 'A'],
        ['Label EU mouillé', 'A'],
        ['Label EU bruit', '71 dB'],
        ['Usage', 'Été'],
        ['OEM', 'BMW, Mercedes-AMG, Porsche'],
      ],
      compat: [
        { make: 'BMW', model: 'M3 (G80)', year_from: 2020, year_to: 2024, engine: 'S58 510ch' },
        { make: 'Mercedes-Benz', model: 'AMG C 43', year_from: 2016, year_to: 2023, engine: 'M276 390ch' },
      ],
    },
    {
      name: 'Pneu Bridgestone Turanza T005 205/55 R16 91W',
      slug: 'pneu-bridgestone-turanza-t005-205-55-r16',
      description: 'Bridgestone Turanza T005, pneu tourisme confort haute performance. Excellent rapport confort/performance avec technologie Enliten pour réduire la résistance au roulement. Idéal pour les familles et les grands rouleurs.',
      short_description: 'Pneu tourisme Bridgestone, confort+, Enliten basse résistance',
      price: 62000,
      original_price: 71000,
      stock: 24,
      category: 'pneus',
      brand: 'michelin',
      sku: 'BRG-T005-20555R16-91W',
      weight: 7.6,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/tyre3/600/400', alt: 'Bridgestone Turanza T005 - vue principale', primary: 1 },
      ],
      specs: [
        ['Dimensions', '205/55 R16'],
        ['Indice de charge', '91 (615 kg)'],
        ['Indice de vitesse', 'W (270 km/h)'],
        ['Label EU carburant', 'B'],
        ['Label EU mouillé', 'A'],
        ['Usage', 'Été'],
      ],
      compat: [
        { make: 'Volkswagen', model: 'Golf VII/VIII', year_from: 2012, year_to: 2024, engine: 'Tous 4-cylindres' },
        { make: 'Ford', model: 'Focus III/IV', year_from: 2011, year_to: 2024, engine: 'Tous 4-cylindres' },
        { make: 'Renault', model: 'Mégane III/IV', year_from: 2008, year_to: 2024, engine: 'Tous 4-cylindres' },
      ],
    },
    // ── BATTERIES ─────────────────────────────────────────────────────────
    {
      name: 'Batterie Varta Silver Dynamic 72Ah 720A',
      slug: 'batterie-varta-silver-dynamic-72ah',
      description: 'Batterie Varta Silver Dynamic 72Ah, technologie AGM-ready avec couverture en argent pour une durée de vie extended. Start-Stop compatible. Puissance de démarrage 720A en froid (CCA). Entretien sans maintenance, résistance aux vibrations renforcée.',
      short_description: 'Batterie Varta Silver 72Ah 720A, Start-Stop compatible, 4 ans garantie',
      price: 78000,
      original_price: 91000,
      stock: 18,
      category: 'batteries',
      brand: 'varta',
      sku: 'VAR-SD-72AH-720A',
      weight: 17.2,
      is_featured: 1,
      images: [
        { url: 'https://picsum.photos/seed/battery1/600/400', alt: 'Batterie Varta Silver 72Ah - vue principale', primary: 1 },
      ],
      specs: [
        ['Capacité', '72 Ah'],
        ['Courant de démarrage (CCA)', '720 A'],
        ['Tension', '12V'],
        ['Technologie', 'EFB (Enhanced Flooded Battery)'],
        ['Borne positive', 'Droite'],
        ['Longueur x Larg x Haut', '278 x 175 x 190 mm'],
        ['Start-Stop', 'Compatible'],
        ['Garantie', '4 ans'],
      ],
      compat: [
        { make: 'Peugeot', model: '308 II', year_from: 2013, year_to: 2021, engine: 'Tous moteurs' },
        { make: 'Peugeot', model: '3008 II', year_from: 2016, year_to: 2024, engine: 'Tous moteurs' },
        { make: 'Citroën', model: 'C5 Aircross', year_from: 2017, year_to: 2024, engine: 'Tous moteurs' },
      ],
    },
    {
      name: 'Batterie Bosch S5 AGM 80Ah 800A',
      slug: 'batterie-bosch-s5-agm-80ah',
      description: 'Batterie Bosch S5 AGM 80Ah pour véhicules avec système Start-Stop avancé, récupération d\'énergie et consommateurs nombreux. Technologie AGM (Absorbant Glass Mat) pour une charge/décharge intensive sans perte de capacité. Résistance aux vibrations 15x supérieure aux batteries standard.',
      short_description: 'Batterie AGM Bosch S5 80Ah 800A, Start-Stop avancé, cycles intensifs',
      price: 124000,
      original_price: null,
      stock: 12,
      category: 'batteries',
      brand: 'bosch',
      sku: 'BSH-S5-AGM-80AH',
      weight: 21.8,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/battery2/600/400', alt: 'Batterie Bosch S5 AGM 80Ah - vue principale', primary: 1 },
      ],
      specs: [
        ['Capacité', '80 Ah'],
        ['Courant de démarrage (CCA)', '800 A'],
        ['Tension', '12V'],
        ['Technologie', 'AGM'],
        ['Borne positive', 'Droite'],
        ['Longueur x Larg x Haut', '315 x 175 x 190 mm'],
        ['Cycles charge/décharge', '>360000 cycles partiels'],
      ],
      compat: [
        { make: 'BMW', model: 'Série 3 (F30)', year_from: 2011, year_to: 2019, engine: 'Tous moteurs' },
        { make: 'Audi', model: 'A4 B9', year_from: 2015, year_to: 2023, engine: 'Tous moteurs' },
        { make: 'Mercedes-Benz', model: 'Classe C (W205)', year_from: 2014, year_to: 2021, engine: 'Tous moteurs' },
      ],
    },
    {
      name: 'Batterie Optima RedTop 55Ah 720A',
      slug: 'batterie-optima-redtop-55ah',
      description: 'La batterie Optima RedTop à technologie SpiralCell en plomb pur offre une puissance de démarrage maximale. Conçue pour les démarrages fréquents et les fortes sollicitations. Résistance aux vibrations 15x supérieure et décharge profonde tolérée. Parfaite pour les voitures sportives et modifiées.',
      short_description: 'Batterie Optima SpiralCell 55Ah, puissance démarrage max, anti-vibration',
      price: 143000,
      original_price: 170000,
      stock: 6,
      category: 'batteries',
      brand: 'varta',
      sku: 'OPT-RT-55AH-720A',
      weight: 16.8,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/battery3/600/400', alt: 'Batterie Optima RedTop - vue principale', primary: 1 },
      ],
      specs: [
        ['Capacité', '55 Ah'],
        ['Courant de démarrage (CCA)', '720 A'],
        ['Technologie', 'SpiralCell AGM'],
        ['Décharge profonde', 'Tolérée'],
        ['Position de montage', 'Universel'],
      ],
      compat: [
        { make: 'Universel', model: 'Toutes sportives', year_from: 1990, year_to: 2024, engine: 'Selon dimensions' },
      ],
    },
    // ── HUILES & LIQUIDES ─────────────────────────────────────────────────
    {
      name: 'Huile moteur Castrol EDGE 5W-40 5L',
      slug: 'huile-moteur-castrol-edge-5w40-5l',
      description: 'Castrol EDGE 5W-40, huile moteur synthèse totale renforcée avec technologie Fluid Titanium. Réduit les frottements internes de 50% par rapport aux huiles conventionnelles. Performance maximale à froid (-35°C) et à chaud jusqu\'à 150°C en continu. Norme ACEA A3/B4, API SN.',
      short_description: 'Huile 100% synthèse Castrol EDGE 5W-40, Fluid Titanium, 5 litres',
      price: 32000,
      original_price: 38500,
      stock: 60,
      category: 'huiles-liquides',
      brand: 'castrol',
      sku: 'CAS-EDGE-5W40-5L',
      weight: 4.5,
      is_featured: 1,
      images: [
        { url: 'https://picsum.photos/seed/oil1/600/400', alt: 'Castrol EDGE 5W-40 5L - vue principale', primary: 1 },
      ],
      specs: [
        ['Viscosité', '5W-40'],
        ['Type', 'Synthèse totale'],
        ['Volume', '5 litres'],
        ['Norme ACEA', 'A3/B4'],
        ['Norme API', 'SN/CF'],
        ['Approbation', 'BMW LL-01, MB 229.5, VW 502.00/505.00'],
        ['Température min.', '-35°C'],
      ],
      compat: [
        { make: 'Universel', model: 'Essence et Diesel', year_from: 2000, year_to: 2024, engine: 'Selon approbation constructeur' },
      ],
    },
    {
      name: 'Huile moteur Total Quartz 9000 5W-30 4L',
      slug: 'huile-moteur-total-quartz-9000-5w30-4l',
      description: 'Total Quartz 9000 Energy 5W-30, huile longue durée à base entièrement synthétique. Économie de carburant jusqu\'à 4,5% certifiée. Conforme aux intervalles d\'entretien étendus. Norme ACEA A1/B1 et C2 pour les véhicules à FAP/DPF.',
      short_description: 'Huile synthèse Total Quartz 9000 5W-30, éco-énergie, DPF compatible, 4L',
      price: 26000,
      original_price: null,
      stock: 85,
      category: 'huiles-liquides',
      brand: 'castrol',
      sku: 'TOT-Q9000-5W30-4L',
      weight: 3.6,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/oil2/600/400', alt: 'Total Quartz 9000 5W-30 4L - vue principale', primary: 1 },
      ],
      specs: [
        ['Viscosité', '5W-30'],
        ['Type', 'Synthèse totale'],
        ['Volume', '4 litres'],
        ['Norme ACEA', 'A1/B1-C2'],
        ['Compatible FAP/DPF', 'Oui (faible SAPS)'],
        ['Approbation', 'PSA B71 2290, Renault RN0700'],
      ],
      compat: [
        { make: 'Peugeot', model: 'Tous modèles', year_from: 2004, year_to: 2024, engine: 'Essence et Diesel (PSA)' },
        { make: 'Citroën', model: 'Tous modèles', year_from: 2004, year_to: 2024, engine: 'Essence et Diesel (PSA)' },
        { make: 'Renault', model: 'Tous modèles', year_from: 2005, year_to: 2024, engine: 'Essence et Diesel' },
      ],
    },
    {
      name: 'Liquide de frein DOT 4 Bosch 0.5L',
      slug: 'liquide-frein-dot4-bosch-0-5l',
      description: 'Liquide de frein Bosch DOT 4 haute température, point d\'ébullition sec 265°C et mouillé 165°C. Compatible avec tous les systèmes ABS, ESP et freins à disque haute performance. Ne corrode pas le métal, le caoutchouc ou les joints. Flacon de 0,5L avec bouchon anti-renversement.',
      short_description: 'Liquide frein DOT 4 Bosch 0,5L, 265°C à sec, ABS/ESP compatible',
      price: 4500,
      original_price: null,
      stock: 150,
      category: 'huiles-liquides',
      brand: 'bosch',
      sku: 'BSH-DOT4-500ML',
      weight: 0.55,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/brake-fluid/600/400', alt: 'Liquide frein DOT 4 Bosch 0.5L - vue principale', primary: 1 },
      ],
      specs: [
        ['Norme', 'DOT 4 (FMVSS 116)'],
        ['Point ébullition sec', '265°C'],
        ['Point ébullition mouillé', '165°C'],
        ['Volume', '0,5 litre'],
        ['Viscosité à -40°C', '< 1800 mm²/s'],
        ['Compatible ABS/ESP', 'Oui'],
      ],
      compat: [
        { make: 'Universel', model: 'Tous véhicules DOT 4', year_from: 1990, year_to: 2024, engine: 'N/A' },
      ],
    },
    {
      name: 'Antigel liquide refroidissement G12+ Febi 5L',
      slug: 'antigel-liquide-refroidissement-g12-febi-5l',
      description: 'Liquide de refroidissement concentré Febi G12+, prêt à l\'emploi dilué à 50% avec eau déminéralisée. Protection antigel jusqu\'à -37°C, protection antibouillonnement jusqu\'à +129°C. Inhibiteurs de corrosion pour aluminium, fonte, acier et laiton. Sans silicates.',
      short_description: 'Antigel G12+ Febi 5L concentré, -37°C/+129°C, sans silicates',
      price: 15000,
      original_price: 17500,
      stock: 40,
      category: 'huiles-liquides',
      brand: 'bosch',
      sku: 'FEB-G12P-5L',
      weight: 5.2,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/coolant1/600/400', alt: 'Antigel G12+ Febi 5L - vue principale', primary: 1 },
      ],
      specs: [
        ['Norme', 'G12+ (OAT)'],
        ['Protection antigel', 'jusqu\'à -37°C (à 50%)'],
        ['Protection antibouillonnement', 'jusqu\'à +129°C'],
        ['Volume', '5 litres'],
        ['Sans silicates', 'Oui'],
        ['Couleur', 'Rouge'],
      ],
      compat: [
        { make: 'Volkswagen', model: 'Tous modèles G12+', year_from: 2001, year_to: 2024, engine: 'Tous moteurs' },
        { make: 'Audi', model: 'Tous modèles G12+', year_from: 2001, year_to: 2024, engine: 'Tous moteurs' },
        { make: 'Skoda', model: 'Tous modèles G12+', year_from: 2001, year_to: 2024, engine: 'Tous moteurs' },
      ],
    },
    // ── ALLUMAGE & DISTRIBUTION ───────────────────────────────────────────
    {
      name: 'Bougies d\'allumage NGK Iridium IX BKR6EIX (x4)',
      slug: 'bougies-ngk-iridium-ix-bkr6eix',
      description: 'Set de 4 bougies NGK Iridium IX BKR6EIX, électrode centrale en iridium pur pour une longévité 4x supérieure aux bougies nickel standard. Allumage plus fiable, meilleure combustion, économie de carburant de 2,5%. Idéales pour les moteurs à injection directe et turbocompressés.',
      short_description: 'Set 4 bougies NGK Iridium, 4x plus longues, économie carburant -2,5%',
      price: 32000,
      original_price: 36500,
      stock: 45,
      category: 'allumage-distribution',
      brand: 'ngk',
      sku: 'NGK-BKR6EIX-X4',
      weight: 0.4,
      is_featured: 1,
      images: [
        { url: 'https://picsum.photos/seed/spark1/600/400', alt: 'Bougies NGK Iridium BKR6EIX x4 - vue principale', primary: 1 },
      ],
      specs: [
        ['Matériau électrode', 'Iridium pur (centre) + Platine (masse)'],
        ['Diamètre électrode', '0,6 mm'],
        ['Indice thermique', '6'],
        ['Filetage', 'M14x1,25'],
        ['Longueur filetage', '19 mm'],
        ['Clé de serrage', '16 mm'],
        ['Contenu', '4 bougies'],
      ],
      compat: [
        { make: 'Toyota', model: 'Yaris III', year_from: 2011, year_to: 2020, engine: '1.0 VVT-i 70ch' },
        { make: 'Toyota', model: 'Yaris III', year_from: 2011, year_to: 2020, engine: '1.3 VVT-i 100ch' },
        { make: 'Toyota', model: 'Auris II', year_from: 2012, year_to: 2019, engine: '1.6 132ch' },
      ],
    },
    {
      name: 'Kit distribution complet Dayco Ford Focus',
      slug: 'kit-distribution-dayco-ford-focus',
      description: 'Kit distribution complet Dayco pour Ford Focus avec courroie, tendeur hydraulique, galet et joint d\'arbre à cames. Courroie HNBR haute résistance à la chaleur et à l\'huile. Tendeur hydraulique autobloquant pour une tension constante. Tout pour un remplacement complet et durable.',
      short_description: 'Kit distribution complet Dayco, courroie HNBR + tendeur + galet + joints',
      price: 95000,
      original_price: 116000,
      stock: 20,
      category: 'allumage-distribution',
      brand: 'dayco',
      sku: 'DAY-KTB584FP',
      weight: 1.8,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/timing1/600/400', alt: 'Kit distribution Dayco Ford Focus - vue principale', primary: 1 },
        { url: 'https://picsum.photos/seed/timing1b/600/400', alt: 'Kit distribution Dayco - contenu détaillé', primary: 0 },
      ],
      specs: [
        ['Contenu', 'Courroie + tendeur hydraulique + galet + joint arbre à cames'],
        ['Matériau courroie', 'HNBR (nitrile hydrogéné)'],
        ['Nombre de dents', '148'],
        ['Largeur courroie', '25 mm'],
        ['Température max.', '140°C continu'],
        ['Résistance huile', 'Oui'],
      ],
      compat: [
        { make: 'Ford', model: 'Focus III', year_from: 2011, year_to: 2018, engine: '1.6 TDCi 95ch / 115ch' },
        { make: 'Ford', model: 'Focus II', year_from: 2005, year_to: 2011, engine: '1.6 TDCi 90ch / 109ch' },
        { make: 'Ford', model: 'C-MAX II', year_from: 2010, year_to: 2015, engine: '1.6 TDCi 115ch' },
      ],
    },
    {
      name: 'Courroie accessoires Gates 6PK2035',
      slug: 'courroie-accessoires-gates-6pk2035',
      description: 'Courroie striée poly-V Gates Micro-V AT 6PK2035 pour entraînement des accessoires (alternateur, climatisation, direction assistée). Matériau EPDM résistant à la chaleur, aux huiles et aux agents chimiques. Technologie Gates Stretch Fit pour une pose sans outil spécial.',
      short_description: 'Courroie accessoires Gates Micro-V 6PK2035, EPDM, pose facile',
      price: 23000,
      original_price: null,
      stock: 32,
      category: 'allumage-distribution',
      brand: 'dayco',
      sku: 'GAT-6PK2035',
      weight: 0.35,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/belt1/600/400', alt: 'Courroie Gates 6PK2035 - vue principale', primary: 1 },
      ],
      specs: [
        ['Référence', '6PK2035'],
        ['Type', 'Poly-V (striée)'],
        ['Nombre de nervures', '6'],
        ['Longueur développée', '2035 mm'],
        ['Largeur', '22,4 mm'],
        ['Matériau', 'EPDM'],
      ],
      compat: [
        { make: 'Volkswagen', model: 'Golf VII', year_from: 2012, year_to: 2020, engine: '2.0 TDI 150ch' },
        { make: 'Audi', model: 'A3 8V', year_from: 2012, year_to: 2020, engine: '2.0 TDI 150ch' },
      ],
    },
    {
      name: 'Bobine d\'allumage Bosch 0986221023',
      slug: 'bobine-allumage-bosch-0986221023',
      description: 'Bobine d\'allumage crayon Bosch pour moteurs à injection directe. Tension secondaire 40 kV garantie pour une étincelle puissante même à haut régime. Boîtier en nylon haute température, résistance aux vibrations certifiée. Connecteur OEM compatible direct.',
      short_description: 'Bobine allumage crayon Bosch 40kV, haute temp., connecteur OEM',
      price: 27500,
      original_price: 34000,
      stock: 28,
      category: 'allumage-distribution',
      brand: 'bosch',
      sku: 'BSH-0986221023',
      weight: 0.22,
      is_featured: 0,
      images: [
        { url: 'https://picsum.photos/seed/coil1/600/400', alt: 'Bobine allumage Bosch - vue principale', primary: 1 },
      ],
      specs: [
        ['Type', 'Crayon (Pencil coil)'],
        ['Tension primaire', '12V'],
        ['Tension secondaire max.', '40 kV'],
        ['Résistance primaire', '0,5 Ω'],
        ['Résistance secondaire', '11 500 Ω'],
        ['Connecteur', 'OEM identique'],
      ],
      compat: [
        { make: 'Volkswagen', model: 'Golf IV / V', year_from: 2000, year_to: 2010, engine: '2.0 GTI 200ch / 1.4 TSI' },
        { make: 'Audi', model: 'A3 8L / 8P', year_from: 1997, year_to: 2013, engine: '1.8 T / 2.0 TFSI' },
      ],
    },
  ];

  // Insérer les produits et leurs données liées
  for (const p of products) {
    const catId = getCat(p.category);
    const brandId = getBrand(p.brand);

    const result = insertProduct.run(
      p.name, p.slug, p.description, p.short_description,
      p.price, p.original_price ?? null, p.stock,
      catId, brandId, p.sku, p.weight, p.is_featured
    );
    const productId = result.lastInsertRowid;

    // Images
    for (const img of p.images) {
      insertImage.run(productId, img.url, img.alt, img.primary, p.images.indexOf(img));
    }
    // Specs
    for (const [key, val] of p.specs) {
      insertSpec.run(productId, key, val);
    }
    // Compatibilités
    for (const c of p.compat) {
      insertCompat.run(productId, c.make, c.model, c.year_from, c.year_to, c.engine);
    }
  }

  // ─── Promotions d'exemple ──────────────────────────────────────────────
  const insertPromo = db.prepare(`
    INSERT OR IGNORE INTO promotions
      (code, name, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active, applies_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);
  insertPromo.run('BIENVENUE10', 'Bienvenue - 10% sur votre première commande', 'percentage', 10, 30000, 1000,
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), 'all');
  insertPromo.run('FREINS13000', '13 000 F CFA de réduction sur les freins', 'fixed', 13000, 50000, 200,
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), 'all');

  // ─── Paramètres footer par défaut ────────────────────────────────────────
  const footerExists = db.prepare("SELECT key FROM settings WHERE key = 'footer'").get();
  if (!footerExists) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('footer', ?)").run(JSON.stringify({
      description: "Votre spécialiste en pièces automobiles neuves et d'occasion. Livraison rapide partout au Sénégal.",
      phone: '+221 77 000 00 00',
      email: 'contact@dva-auto.sn',
      address: 'Dakar, Sénégal',
      copyright: `© ${new Date().getFullYear()} DVA Auto. Tous droits réservés.`,
      badges: [
        { title: 'Livraison rapide', desc: 'Partout au Sénégal' },
        { title: 'Paiement sécurisé', desc: 'Wave, Orange Money, CB' },
        { title: 'Retours garantis', desc: 'Sous conditions' },
        { title: 'Pièces garanties', desc: 'Qualité certifiée' },
      ],
    }));
  }

  // ─── Slides bannière hero par défaut ─────────────────────────────────────
  const heroExists = db.prepare("SELECT key FROM settings WHERE key = 'hero_slides'").get();
  if (!heroExists) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('hero_slides', ?)").run(JSON.stringify([
      { id: 1, title: 'Pièces de Frein de Qualité', subtitle: 'Plaquettes, disques, étriers — Marques Brembo, Bosch, EBC', cta: 'Voir les freins', link: '/catalogue?category=freins', bg: 'linear-gradient(135deg, #003DA5, #002880)', badge: "Jusqu'à -25%" },
      { id: 2, title: 'Pneus Toutes Saisons', subtitle: 'Michelin, Continental, Bridgestone — Livraison express', cta: 'Choisir mes pneus', link: '/catalogue?category=pneus', bg: 'linear-gradient(135deg, #111827, #002880)', badge: 'Meilleur prix' },
      { id: 3, title: 'Huiles & Filtres Premium', subtitle: 'Castrol, Total, Mann Filter — Compatibilité garantie', cta: 'Découvrir', link: '/catalogue?category=filtres', bg: 'linear-gradient(135deg, #002880, #1e293b)', badge: 'Nouveauté' },
    ]));
  }

  // ─── Pages informations ───────────────────────────────────────────────────
  seedPages(db);

  console.log(`✅ Seed : ${products.length} produits, ${categories.length} catégories, ${brands.length} marques, 2 promotions, 5 pages`);
}

function seedPages(db) {
  const insertPage = db.prepare(
    'INSERT OR IGNORE INTO pages (slug, title, content) VALUES (?, ?, ?)'
  );
  const defaultPages = [
    {
      slug: 'qui-sommes-nous',
      title: 'Qui sommes-nous ?',
      content: `## Notre histoire\n\nDVA Auto est une entreprise sénégalaise fondée à Dakar, spécialisée dans la distribution de pièces automobiles neuves et de qualité. Depuis notre création, nous accompagnons les particuliers, les garages et les ateliers mécaniques avec des produits fiables aux meilleurs prix.\n\nNotre mission est simple : rendre accessibles des pièces auto de qualité certifiée, partout au Sénégal, avec un service client réactif et professionnel.\n\n## Notre engagement\n\n- Des produits 100% conformes aux normes constructeurs\n- Des marques reconnues : Brembo, Bosch, Michelin, Castrol, NGK et bien d'autres\n- Une livraison rapide partout au Sénégal\n- Un service après-vente disponible et à l'écoute\n- Des prix compétitifs sans compromis sur la qualité\n\n## Notre équipe\n\nNous sommes une équipe passionnée par l'automobile, composée de techniciens, de commerciaux et de logisticiens. Ensemble, nous mettons tout en œuvre pour vous offrir la meilleure expérience d'achat possible.\n\n## Contactez-nous\n\nPour toute question, notre équipe est disponible par téléphone, email ou directement dans nos locaux à Dakar.`,
    },
    {
      slug: 'livraison-retours',
      title: 'Livraison & retours',
      content: `## Livraison\n\nDVA Auto assure la livraison de vos commandes partout au Sénégal. Nous travaillons avec des partenaires logistiques fiables pour garantir que vos pièces arrivent en parfait état et dans les meilleurs délais.\n\n## Délais de livraison\n\n- **Dakar et banlieue** : 24 à 48 heures ouvrées\n- **Autres régions du Sénégal** : 2 à 5 jours ouvrés\n- **Commandes urgentes** : livraison express disponible sur demande\n\n## Frais de livraison\n\nLes frais de livraison sont calculés en fonction du poids de votre commande et de votre zone géographique. Ils vous sont indiqués clairement lors de la validation de votre panier.\n\n## Politique de retour\n\nVous disposez de **7 jours** à compter de la réception de votre commande pour retourner un article, sous réserve que celui-ci soit dans son emballage d'origine, non utilisé et non endommagé.\n\n## Conditions de retour\n\n- L'article doit être retourné dans son emballage d'origine\n- L'article ne doit pas avoir été monté ou utilisé\n- La référence de commande doit être fournie\n- Les pièces spécifiques (joints, consommables) ne sont pas retournables\n\n## Procédure de retour\n\nPour initier un retour, contactez notre service client par email ou téléphone. Nous vous fournirons les instructions nécessaires et organiserons la récupération de l'article.`,
    },
    {
      slug: 'mentions-legales',
      title: 'Mentions légales',
      content: `## Éditeur du site\n\n**DVA Auto**\nSociété à Responsabilité Limitée (SARL)\nSiège social : Dakar, Sénégal\nEmail : contact@dva-auto.sn\nTéléphone : +221 77 000 00 00\n\n## Directeur de la publication\n\nLe directeur de la publication est le gérant de la société DVA Auto.\n\n## Hébergement\n\nCe site est hébergé par un prestataire d'hébergement professionnel. Les informations de contact de l'hébergeur sont disponibles sur demande.\n\n## Propriété intellectuelle\n\nL'ensemble des contenus présents sur ce site (textes, images, logos, graphismes) est la propriété exclusive de DVA Auto ou de ses partenaires. Toute reproduction, représentation ou diffusion, totale ou partielle, de ces contenus sans autorisation préalable est strictement interdite.\n\n## Données personnelles\n\nConformément à la réglementation en vigueur sur la protection des données personnelles, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous à l'adresse email indiquée ci-dessus.\n\n## Cookies\n\nCe site utilise des cookies techniques nécessaires à son bon fonctionnement. Aucun cookie publicitaire ou de traçage tiers n'est utilisé sans votre consentement.`,
    },
    {
      slug: 'cgv',
      title: 'Conditions Générales de Vente',
      content: `## Article 1 — Champ d'application\n\nLes présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les commandes passées sur le site DVA Auto par tout client (particulier ou professionnel). Toute commande implique l'acceptation pleine et entière de ces CGV.\n\n## Article 2 — Prix\n\nLes prix affichés sur le site sont en Francs CFA (XOF), toutes taxes comprises. DVA Auto se réserve le droit de modifier ses prix à tout moment, mais les produits seront facturés au tarif en vigueur au moment de la validation de la commande.\n\n## Article 3 — Commandes\n\nToute commande est ferme et définitive après validation du paiement. DVA Auto se réserve le droit d'annuler ou de refuser toute commande en cas de stock insuffisant ou de problème lié au paiement.\n\n## Article 4 — Paiement\n\nLe paiement s'effectue en ligne via les moyens suivants :\n\n- Wave\n- Orange Money\n- Carte bancaire (Visa, Mastercard)\n\nLes paiements sont sécurisés. DVA Auto ne conserve aucune donnée bancaire.\n\n## Article 5 — Livraison\n\nLes délais et conditions de livraison sont détaillés dans notre page Livraison & Retours. DVA Auto ne saurait être tenu responsable des retards imputables aux transporteurs ou à des cas de force majeure.\n\n## Article 6 — Garanties\n\nTous les produits vendus sur DVA Auto bénéficient de la garantie légale de conformité. Les pièces de marque sont garanties selon les conditions du fabricant.\n\n## Article 7 — Droit de rétractation\n\nConformément à la réglementation en vigueur, le client particulier dispose d'un délai de 7 jours pour retourner un article non utilisé dans son emballage d'origine.\n\n## Article 8 — Responsabilité\n\nDVA Auto ne saurait être tenu responsable des dommages résultant d'une mauvaise installation des pièces. Il est recommandé de faire effectuer les réparations par un professionnel qualifié.`,
    },
    {
      slug: 'politique-confidentialite',
      title: 'Politique de confidentialité',
      content: `## Introduction\n\nDVA Auto accorde une grande importance à la protection de vos données personnelles. Cette politique de confidentialité vous informe sur la façon dont nous collectons, utilisons et protégeons vos informations.\n\n## Données collectées\n\nLors de votre utilisation de notre site, nous sommes amenés à collecter les informations suivantes :\n\n- Informations d'identification : nom, prénom, adresse email\n- Informations de contact : numéro de téléphone, adresse de livraison\n- Données de navigation : pages visitées, produits consultés\n- Données de commande : historique d'achats, préférences\n\n## Utilisation des données\n\nVos données personnelles sont utilisées exclusivement pour :\n\n- Traiter et livrer vos commandes\n- Gérer votre compte client\n- Vous envoyer des confirmations de commande\n- Améliorer nos services et votre expérience\n- Respecter nos obligations légales\n\n## Protection des données\n\nNous mettons en place des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, perte ou divulgation. Les données sont stockées sur des serveurs sécurisés.\n\n## Vos droits\n\nConformément à la réglementation applicable, vous disposez des droits suivants :\n\n- Droit d'accès à vos données\n- Droit de rectification des données inexactes\n- Droit à l'effacement de vos données\n- Droit à la portabilité de vos données\n- Droit d'opposition au traitement\n\nPour exercer ces droits, contactez-nous à : contact@dva-auto.sn\n\n## Cookies\n\nNotre site utilise uniquement des cookies techniques nécessaires au fonctionnement du site (session utilisateur, panier). Aucun cookie publicitaire tiers n'est déposé sans votre accord explicite.\n\n## Contact\n\nPour toute question relative à cette politique de confidentialité, contactez notre délégué à la protection des données à l'adresse : contact@dva-auto.sn`,
    },
  ];
  defaultPages.forEach((p) => insertPage.run(p.slug, p.title, p.content));
}

// Permettre d'exécuter le seed manuellement : node src/db/seed.js
if (require.main === module) {
  const { initDatabase } = require('./database');
  initDatabase().then(() => {
    console.log('Seed terminé depuis la CLI');
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDatabase, seedPages };
