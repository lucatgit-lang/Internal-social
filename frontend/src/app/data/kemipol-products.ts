/**
 * File Overview: kemipol-products.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

// Database prodotti Kemipol SRL - Listino 2026

export interface Product {
  id: string;
  codice: string;
  nome: string;
  nomeEn: string;
  linea: 'Green' | 'Kemipol' | 'Specialkem' | 'Sirkem' | 'Greenpol';
  categoria: string;
  um: string;
  confezioni: ProductPackage[];
  descrizione?: string;
  colore?: string;
}

export interface ProductPackage {
  confezione: string;
  pzConf: number;
  barcode: string;
  euroLt: number;
  euroPz: number;
}

export const kemipolProducts: Product[] = [
  // ===== LINEA GREEN =====
  {
    id: 'prod-001',
    codice: 'DGTUK',
    nome: 'Green Thinner - Diluente Universale',
    nomeEn: 'Universal Nitro Cleaner Thinner',
    linea: 'Green',
    categoria: 'Diluenti',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435110983', euroLt: 8.76, euroPz: 8.76 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435110990', euroLt: 8.55, euroPz: 42.75 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435111003', euroLt: 7.52, euroPz: 188.00 },
    ]
  },
  {
    id: 'prod-002',
    codice: 'DAECK',
    nome: 'Acetone Ecologico',
    nomeEn: 'Ecological Acetone',
    linea: 'Green',
    categoria: 'Solventi',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435119900', euroLt: 7.52, euroPz: 7.52 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435120173', euroLt: 7.32, euroPz: 36.60 },
    ]
  },

  // ===== LINEA KEMIPOL =====
  {
    id: 'prod-003',
    codice: 'DNFK',
    nome: 'Diluente Nitro N50',
    nomeEn: 'N50 Nitro Thinner',
    linea: 'Kemipol',
    categoria: 'Diluenti Nitro',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435141581', euroLt: 5.56, euroPz: 5.56 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435140942', euroLt: 5.37, euroPz: 26.85 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435140959', euroLt: 5.17, euroPz: 129.25 },
    ]
  },
  {
    id: 'prod-004',
    codice: 'DHYT',
    nome: 'Hydro Thinner',
    nomeEn: 'Hydro Thinner',
    linea: 'Kemipol',
    categoria: 'Diluenti Hydro',
    um: 'Lt',
    confezioni: [
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435141598', euroLt: 4.95, euroPz: 24.75 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435139762', euroLt: 4.74, euroPz: 118.50 },
    ]
  },
  {
    id: 'prod-005',
    codice: 'DNPNK',
    nome: 'Diluente Nitro Antinebbia High Performance',
    nomeEn: 'High Performance Anti-fog Nitro Thinner',
    linea: 'Kemipol',
    categoria: 'Diluenti Nitro',
    um: 'Lt',
    confezioni: [
      { confezione: '0,5 Lt', pzConf: 20, barcode: '8024435204255', euroLt: 5.52, euroPz: 2.76 },
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435100434', euroLt: 4.41, euroPz: 4.41 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435143066', euroLt: 4.21, euroPz: 21.05 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435142014', euroLt: 4.00, euroPz: 100.00 },
    ]
  },
  {
    id: 'prod-006',
    codice: 'DNAEK',
    nome: 'Diluente Nitro Antinebbia',
    nomeEn: 'Anti-fog Nitro Thinner',
    linea: 'Kemipol',
    categoria: 'Diluenti Nitro',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435144254', euroLt: 3.99, euroPz: 3.99 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435123068', euroLt: 3.79, euroPz: 18.95 },
      { confezione: '20 Lt', pzConf: 1, barcode: '8024435106825', euroLt: 3.48, euroPz: 69.60 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435102018', euroLt: 3.48, euroPz: 87.00 },
      { confezione: '200 Lt', pzConf: 1, barcode: '8024435107013', euroLt: 3.27, euroPz: 654.00 },
    ]
  },
  {
    id: 'prod-007',
    codice: 'DNOK',
    nome: 'Diluente Nitro ONE',
    nomeEn: 'ONE Anti-fog Nitro Thinner',
    linea: 'Kemipol',
    categoria: 'Diluenti Nitro',
    um: 'Lt',
    confezioni: [
      { confezione: '20 Lt', pzConf: 1, barcode: '8024435137225', euroLt: 3.09, euroPz: 61.80 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435137232', euroLt: 3.09, euroPz: 77.25 },
      { confezione: '200 Lt', pzConf: 1, barcode: '8024435137249', euroLt: 2.73, euroPz: 546.00 },
    ]
  },
  {
    id: 'prod-008',
    codice: 'DPROK',
    nome: 'Diluente Polivalente Professional',
    nomeEn: 'Professional Thinner',
    linea: 'Kemipol',
    categoria: 'Diluenti Polivalenti',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435100045', euroLt: 6.94, euroPz: 6.94 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435100021', euroLt: 6.73, euroPz: 33.65 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435107846', euroLt: 6.51, euroPz: 162.75 },
    ]
  },
  {
    id: 'prod-009',
    codice: 'DASLK',
    nome: 'Diluente Acrilico Slow',
    nomeEn: 'Acrylic Thinner - Slow',
    linea: 'Kemipol',
    categoria: 'Diluenti Acrilici',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435100366', euroLt: 8.41, euroPz: 8.41 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435100373', euroLt: 8.22, euroPz: 41.10 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435105163', euroLt: 8.03, euroPz: 200.75 },
    ]
  },
  {
    id: 'prod-010',
    codice: 'DASTK',
    nome: 'Diluente Acrilico Standard',
    nomeEn: 'Acrylic Thinner - Standard',
    linea: 'Kemipol',
    categoria: 'Diluenti Acrilici',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435105187', euroLt: 6.48, euroPz: 6.48 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435105408', euroLt: 6.30, euroPz: 31.50 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435105231', euroLt: 6.09, euroPz: 152.25 },
    ]
  },
  {
    id: 'prod-011',
    codice: 'DAFAK',
    nome: 'Diluente Acrilico Fast',
    nomeEn: 'Acrylic Thinner - Fast',
    linea: 'Kemipol',
    categoria: 'Diluenti Acrilici',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435100274', euroLt: 6.08, euroPz: 6.08 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435100267', euroLt: 5.90, euroPz: 29.50 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435105262', euroLt: 5.71, euroPz: 142.75 },
    ]
  },
  {
    id: 'prod-012',
    codice: 'DASIK',
    nome: 'Antisilicone',
    nomeEn: 'Antisilicon',
    linea: 'Kemipol',
    categoria: 'Ausiliari',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435100007', euroLt: 6.43, euroPz: 6.43 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435100250', euroLt: 6.23, euroPz: 31.15 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435105156', euroLt: 6.02, euroPz: 150.50 },
    ]
  },

  // ===== LINEA SPECIALKEM =====
  {
    id: 'prod-100',
    codice: 'RSTBB',
    nome: 'Stucco Metallico Bianco',
    nomeEn: 'Metallic Filler (White)',
    linea: 'Specialkem',
    categoria: 'Stucchi',
    um: 'Lt',
    colore: 'bianco',
    confezioni: [
      { confezione: '0,150 Lt', pzConf: 12, barcode: '8024435133142', euroLt: 0, euroPz: 6.26 },
      { confezione: '0,375 Lt', pzConf: 12, barcode: '8024435134217', euroLt: 0, euroPz: 9.86 },
      { confezione: '0,750 Lt', pzConf: 12, barcode: '8024435108935', euroLt: 0, euroPz: 14.93 },
      { confezione: '4 Lt', pzConf: 4, barcode: '8024435141987', euroLt: 0, euroPz: 74.16 },
    ]
  },
  {
    id: 'prod-101',
    codice: 'RSTME',
    nome: 'Stucco Metallico Grigio',
    nomeEn: 'Metallic Filler (Grey)',
    linea: 'Specialkem',
    categoria: 'Stucchi',
    um: 'Lt',
    colore: 'grigio',
    confezioni: [
      { confezione: '0,150 Lt', pzConf: 12, barcode: '8024435132985', euroLt: 0, euroPz: 6.26 },
      { confezione: '0,375 Lt', pzConf: 12, barcode: '8024435132992', euroLt: 0, euroPz: 9.86 },
      { confezione: '0,750 Lt', pzConf: 6, barcode: '8024435133005', euroLt: 0, euroPz: 14.93 },
    ]
  },
  {
    id: 'prod-102',
    codice: 'RSTBE',
    nome: 'Stucco Metallico Beige',
    nomeEn: 'Metallic Filler (Beige)',
    linea: 'Specialkem',
    categoria: 'Stucchi',
    um: 'Lt',
    colore: 'beige',
    confezioni: [
      { confezione: '0,150 Lt', pzConf: 12, barcode: '8024435340120', euroLt: 0, euroPz: 6.26 },
      { confezione: '0,375 Lt', pzConf: 12, barcode: '8024435330145', euroLt: 0, euroPz: 9.86 },
      { confezione: '0,750 Lt', pzConf: 12, barcode: '8024435330121', euroLt: 0, euroPz: 14.93 },
    ]
  },

  // ===== LINEA SIRKEM =====
  {
    id: 'prod-200',
    codice: 'DNAES',
    nome: 'Diluente Nitro Antinebbia',
    nomeEn: 'Anti-fog Nitro Thinner',
    linea: 'Sirkem',
    categoria: 'Diluenti Nitro',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 20, barcode: '8024435880015', euroLt: 3.58, euroPz: 3.58 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435880053', euroLt: 3.37, euroPz: 16.85 },
      { confezione: '20 Lt', pzConf: 1, barcode: '8024435108157', euroLt: 3.17, euroPz: 63.40 },
      { confezione: '25 Lt', pzConf: 1, barcode: '8024435880022', euroLt: 3.17, euroPz: 79.25 },
    ]
  },

  // ===== LINEA GREENPOL =====
  {
    id: 'prod-300',
    codice: 'GPK-25-004-PL',
    nome: 'GPK Degrader',
    nomeEn: 'GPK Degrader',
    linea: 'Greenpol',
    categoria: 'Trattamenti Eco',
    um: 'Kg',
    confezioni: [
      { confezione: '0,3 Kg', pzConf: 12, barcode: '8024435140416', euroLt: 0, euroPz: 23.60 },
      { confezione: '2 Kg', pzConf: 1, barcode: '8024435122467', euroLt: 0, euroPz: 148.00 },
    ]
  },
  {
    id: 'prod-301',
    codice: 'GPK-25-010-LQF',
    nome: 'GPK Full+',
    nomeEn: 'GPK Full+',
    linea: 'Greenpol',
    categoria: 'Trattamenti Eco',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 12, barcode: '8024435143103', euroLt: 17.60, euroPz: 17.60 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435145930', euroLt: 14.80, euroPz: 74.00 },
    ]
  },
  {
    id: 'prod-302',
    codice: 'GPK-25-009-LQB',
    nome: 'GPK Biorep',
    nomeEn: 'GPK Biorep',
    linea: 'Greenpol',
    categoria: 'Trattamenti Eco',
    um: 'Lt',
    confezioni: [
      { confezione: '1 Lt', pzConf: 12, barcode: '8024435103053', euroLt: 25.00, euroPz: 25.00 },
      { confezione: '5 Lt', pzConf: 4, barcode: '8024435145985', euroLt: 21.60, euroPz: 108.00 },
    ]
  },
];

// Informazioni spedizione dal listino
export const shippingInfo = {
  importoMinimo: 300.00,
  contributoTrasportoSottoMinimo: 20.00,
  costoSponda: 20.00,
  costoTranspallet: 30.00,
  costoRiBa: 3.00,
  costoAmministrativoInsoluti: 15.00,
  francoDestino: true,
};

// Categorie prodotti
export const productCategories = [
  'Diluenti',
  'Diluenti Nitro',
  'Diluenti Acrilici',
  'Diluenti Polivalenti',
  'Diluenti Hydro',
  'Diluenti Poliuretanici',
  'Solventi',
  'Stucchi',
  'Ausiliari',
  'Antiruggine',
  'Trattamenti Eco',
  'Vernici',
  'Altri Prodotti',
];

// Linee prodotto
export const productLines = [
  { id: 'green', nome: 'Linea Green', descrizione: 'Prodotti ecologici e sostenibili' },
  { id: 'kemipol', nome: 'Linea Kemipol', descrizione: 'Gamma completa professionale' },
  { id: 'specialkem', nome: 'Linea Specialkem', descrizione: 'Prodotti speciali e stucchi' },
  { id: 'sirkem', nome: 'Linea Sirkem', descrizione: 'Linea economica' },
  { id: 'greenpol', nome: 'Linea Greenpol', descrizione: 'Trattamenti eco-sostenibili' },
];