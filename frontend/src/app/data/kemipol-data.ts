/**
 * File Overview: kemipol-data.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

// Dati aziendali Kemipol SRL

export const kemipolCompany = {
  ragioneSociale: 'Kemipol S.r.l.',
  sedeLegale: {
    indirizzo: 'Via Giuseppe Ferrari, 35',
    cap: '00195',
    citta: 'Roma',
    provincia: 'RM',
    paese: 'Italia',
  },
  sedeOperativa: {
    indirizzo: 'Via Del Commercio, snc',
    cap: '64025',
    citta: 'Pineto',
    provincia: 'TE',
    paese: 'Italia',
  },
  contatti: {
    telefono: '+39 085 9461228',
    email: 'info@kemipol.it',
    website: 'www.kemipol.it',
  },
  certificazioni: [
    'ISO 9001:2015',
    'ISO 14001:2015',
    'ISO 45001:2018',
  ],
  settore: 'Produzione e distribuzione diluenti, solventi e prodotti chimici',
};

// Clienti esempio basati sul settore Kemipol
export const kemipolClients = [
  {
    id: 'cli-001',
    ragioneSociale: 'Rossi Mario SRL',
    partitaIva: 'IT12345678901',
    codiceFiscale: 'IT12345678901',
    indirizzo: 'Via Roma 123',
    cap: '00100',
    citta: 'Roma',
    provincia: 'RM',
    telefono: '+39 06 123456',
    email: 'info@rossimario.it',
    pec: 'rossimario@pec.it',
    tipo: 'Rivenditore',
    stato: 'Attivo',
    scontoDefault: 15,
    noteCredito: 'Cliente storico - Pagamento 60gg FM',
  },
  {
    id: 'cli-002',
    ragioneSociale: 'Bianchi Giuseppe SpA',
    partitaIva: 'IT23456789012',
    codiceFiscale: 'IT23456789012',
    indirizzo: 'Corso Italia 456',
    cap: '20100',
    citta: 'Milano',
    provincia: 'MI',
    telefono: '+39 02 987654',
    email: 'ordini@bianchigiuseppe.it',
    pec: 'bianchigiuseppe@pec.it',
    tipo: 'Carrozzeria',
    stato: 'Attivo',
    scontoDefault: 20,
    noteCredito: 'Grande cliente - Ordini mensili',
  },
  {
    id: 'cli-003',
    ragioneSociale: 'Verdi Costruzioni SRL',
    partitaIva: 'IT34567890123',
    codiceFiscale: 'IT34567890123',
    indirizzo: 'Via Nazionale 789',
    cap: '50100',
    citta: 'Firenze',
    provincia: 'FI',
    telefono: '+39 055 456789',
    email: 'acquisti@verdicostruzioni.it',
    pec: 'verdicostruzioni@pec.it',
    tipo: 'Impresa Edile',
    stato: 'Attivo',
    scontoDefault: 10,
    noteCredito: 'Ordini stagionali',
  },
  {
    id: 'cli-004',
    ragioneSociale: 'Neri Industrie SpA',
    partitaIva: 'IT45678901234',
    codiceFiscale: 'IT45678901234',
    indirizzo: 'Zona Industriale 1',
    cap: '10100',
    citta: 'Torino',
    provincia: 'TO',
    telefono: '+39 011 234567',
    email: 'procurement@neriindustrie.it',
    pec: 'neriindustrie@pec.it',
    tipo: 'Industria Metalmeccanica',
    stato: 'Attivo',
    scontoDefault: 25,
    noteCredito: 'Cliente premium - Contratto annuale',
  },
  {
    id: 'cli-005',
    ragioneSociale: 'Gialli Edilizia SRL',
    partitaIva: 'IT56789012345',
    codiceFiscale: 'IT56789012345',
    indirizzo: 'Via Veneto 321',
    cap: '80100',
    citta: 'Napoli',
    provincia: 'NA',
    telefono: '+39 081 654321',
    email: 'ordini@gialliedilizia.it',
    pec: 'gialliedilizia@pec.it',
    tipo: 'Rivenditore Edilizia',
    stato: 'Attivo',
    scontoDefault: 18,
    noteCredito: 'Buon cliente - Pagamento 30gg',
  },
  {
    id: 'cli-006',
    ragioneSociale: 'Blu Costruzioni SpA',
    partitaIva: 'IT67890123456',
    codiceFiscale: 'IT67890123456',
    indirizzo: 'Via Garibaldi 567',
    cap: '40100',
    citta: 'Bologna',
    provincia: 'BO',
    telefono: '+39 051 789012',
    email: 'info@blucostruzioni.it',
    pec: 'blucostruzioni@pec.it',
    tipo: 'General Contractor',
    stato: 'Attivo',
    scontoDefault: 22,
    noteCredito: 'Cliente importante - Volumetria alta',
  },
];

// Fornitori per Kemipol
export const kemipolSuppliers = [
  {
    id: 'sup-001',
    ragioneSociale: 'Chimica Base Italia SpA',
    tipo: 'Materie Prime',
    prodotti: ['Solventi base', 'Acetone tecnico', 'Alcoli'],
    paese: 'Italia',
  },
  {
    id: 'sup-002',
    ragioneSociale: 'Petrolchimica Europa SRL',
    tipo: 'Derivati Petroliferi',
    prodotti: ['Acquaragia', 'Petroleum', 'Idrocarburi'],
    paese: 'Italia',
  },
  {
    id: 'sup-003',
    ragioneSociale: 'Containers & Packaging SPA',
    tipo: 'Imballaggi',
    prodotti: ['Taniche', 'Fusti', 'Etichette'],
    paese: 'Italia',
  },
];

// Magazzini Kemipol
export const kemipolWarehouses = [
  {
    id: 'mag-001',
    nome: 'Magazzino Centrale Pineto',
    indirizzo: 'Via Del Commercio, snc - 64025 Pineto (TE)',
    tipo: 'Principale',
    capacita: '5000 m²',
    responsabile: 'Marco Esposito',
  },
  {
    id: 'mag-002',
    nome: 'Deposito Roma Nord',
    indirizzo: 'Via Ferrari 35 - 00195 Roma',
    tipo: 'Secondario',
    capacita: '800 m²',
    responsabile: 'Laura Bianchi',
  },
];

// Zone di vendita
export const salesAreas = [
  {
    id: 'zone-001',
    nome: 'Centro Italia',
    regioni: ['Lazio', 'Abruzzo', 'Marche', 'Umbria'],
    agente: 'Giovanni Ferretti',
    telefono: '+39 340 1234567',
  },
  {
    id: 'zone-002',
    nome: 'Nord Italia',
    regioni: ['Lombardia', 'Piemonte', 'Veneto', 'Emilia-Romagna'],
    agente: 'Andrea Colombo',
    telefono: '+39 340 2345678',
  },
  {
    id: 'zone-003',
    nome: 'Sud Italia',
    regioni: ['Campania', 'Puglia', 'Sicilia', 'Calabria'],
    agente: 'Francesco Romano',
    telefono: '+39 340 3456789',
  },
];
