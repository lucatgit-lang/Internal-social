/**
 * File Overview: reportInsights.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

export interface ReportInsights {
  ordiniOggi: number;
  fatturatoOggi: number;
  clientiOggi: number;
  ticketMedioOggi: number;
  guadagnoStimatoOggi: number;
  margineStimatoPercent: number;
  acquistiTotale: number;
  acquistiOrdini: number;
  acquistiMedia: number;
  ddtEmessi: number;
  ddtConsegnati: number;
  ddtInTransito: number;
  avanzamentoMedioProduzione: number;
  ordiniProduzioneInRitardo: number;
  fatturatoIeri: number;
  ordiniIeri: number;
  clientiIeri: number;
  portafoglioOrdiniSettimana: number;
  portafoglioOrdiniMese: number;
  ordiniSettimana: number;
  ordiniMese: number;
}

const ORDINI_GIORNALIERI = [
  { data: "02/04/2026", ordini: 12, fatturato: 45200, clienti: 8 },
  { data: "01/04/2026", ordini: 15, fatturato: 52800, clienti: 10 },
  { data: "31/03/2026", ordini: 10, fatturato: 38400, clienti: 7 },
];

const ACQUISTI = [
  { fornitore: "Chimica Base Italia SpA", ordini: 24, totale: 125400 },
  { fornitore: "Petrolchimica Europa SRL", ordini: 18, totale: 68200 },
  { fornitore: "Containers & Packaging SPA", ordini: 32, totale: 45800 },
];

const DDT = [
  { stato: "emesso" },
  { stato: "consegnato" },
  { stato: "consegnato" },
];

const AVANZAMENTO = [
  { avanzamento: 75, stato: "in_tempo" },
  { avanzamento: 45, stato: "ritardo" },
  { avanzamento: 20, stato: "in_tempo" },
];

const STIMATED_MARGIN = 0.28;

/**
 * getReportInsights: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function getReportInsights(): ReportInsights {
  const today = ORDINI_GIORNALIERI[0];
  const yesterday = ORDINI_GIORNALIERI[1] || ORDINI_GIORNALIERI[0];
  const acquistiTotale = ACQUISTI.reduce((sum, row) => sum + row.totale, 0);
  const acquistiOrdini = ACQUISTI.reduce((sum, row) => sum + row.ordini, 0);
  const ddtEmessi = DDT.filter((row) => row.stato === "emesso").length;
  const ddtConsegnati = DDT.filter((row) => row.stato === "consegnato").length;
  const ddtInTransito = DDT.filter((row) => row.stato === "in_transito").length;
  const ordiniProduzioneInRitardo = AVANZAMENTO.filter((row) => row.stato === "ritardo").length;
  const avanzamentoMedioProduzione = Math.round(
    AVANZAMENTO.reduce((sum, row) => sum + row.avanzamento, 0) / AVANZAMENTO.length
  );
  const ticketMedioOggi = Math.round(today.fatturato / today.ordini);
  const acquistiMedia = Math.round(acquistiTotale / acquistiOrdini);
  const guadagnoStimatoOggi = Math.round(today.fatturato * STIMATED_MARGIN);
  const ordiniSettimana = ORDINI_GIORNALIERI.reduce((sum, row) => sum + row.ordini, 0);
  const ordiniMese = ordiniSettimana * 4;
  const portafoglioOrdiniSettimana = ORDINI_GIORNALIERI.reduce((sum, row) => sum + row.fatturato, 0);
  const portafoglioOrdiniMese = portafoglioOrdiniSettimana * 4;

  return {
    ordiniOggi: today.ordini,
    fatturatoOggi: today.fatturato,
    clientiOggi: today.clienti,
    ticketMedioOggi,
    guadagnoStimatoOggi,
    margineStimatoPercent: Math.round(STIMATED_MARGIN * 100),
    acquistiTotale,
    acquistiOrdini,
    acquistiMedia,
    ddtEmessi,
    ddtConsegnati,
    ddtInTransito,
    avanzamentoMedioProduzione,
    ordiniProduzioneInRitardo,
    fatturatoIeri: yesterday.fatturato,
    ordiniIeri: yesterday.ordini,
    clientiIeri: yesterday.clienti,
    portafoglioOrdiniSettimana,
    portafoglioOrdiniMese,
    ordiniSettimana,
    ordiniMese,
  };
}

/**
 * getTodayVsYesterday: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function getTodayVsYesterday() {
  const report = getReportInsights();
  const fatturatoDelta = report.fatturatoOggi - report.fatturatoIeri;
  const ordiniDelta = report.ordiniOggi - report.ordiniIeri;
  const clientiDelta = report.clientiOggi - report.clientiIeri;
  return { fatturatoDelta, ordiniDelta, clientiDelta };
}

/**
 * getTopRiskClients: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function getTopRiskClients(): string[] {
  return ["Rossi Mario SRL", "Verdi Costruzioni SRL", "Blu Costruzioni SpA"];
}

/**
 * formatCurrency: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
