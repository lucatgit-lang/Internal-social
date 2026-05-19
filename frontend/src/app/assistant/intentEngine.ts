/**
 * File Overview: intentEngine.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import type { IntentMatch } from "./types";

/**
 * normalizeText: descrive il comportamento principale di questa funzione.
 * @param raw Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * includesAny: descrive il comportamento principale di questa funzione.
 * @param text Input richiesto dalla funzione.
 * @param terms Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

const sectionRoutes: Array<{ section: string; terms: string[] }> = [
  { section: "/", terms: ["dashboard", "home", "pagina principale"] },
  { section: "/ordini", terms: ["ordini", "ordine"] },
  { section: "/clienti", terms: ["clienti", "cliente"] },
  { section: "/produzione", terms: ["produzione", "produzioni"] },
  { section: "/allestimento", terms: ["allestimento", "spedizioni", "spedizione"] },
  { section: "/articoli", terms: ["articoli", "articolo"] },
  { section: "/catalogo", terms: ["catalogo"] },
  { section: "/proposte", terms: ["proposte", "proposta"] },
  { section: "/report/ordini", terms: ["report"] },
];

/**
 * detectIntent: descrive il comportamento principale di questa funzione.
 * @param rawText Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function detectIntent(rawText: string): IntentMatch {
  const text = normalizeText(rawText);

  if (!text) return { intent: "unknown" };

  if (includesAny(text, ["ordini bloccati", "mostrami gli ordini bloccati", "bloccat"])) {
    return { intent: "show_blocked_orders" };
  }

  if (
    includesAny(text, ["spedizioni in ritardo", "ritardo oggi", "quante spedizioni", "spedizioni ritardo"])
  ) {
    return { intent: "late_shipments_count" };
  }

  if (includesAny(text, ["apri la sezione clienti", "apri clienti", "vai ai clienti"])) {
    return { intent: "open_clients" };
  }

  if (
    includesAny(text, ["riepilogo delle priorita", "priorita di oggi", "riepilogo priorita", "sintesi priorita"])
  ) {
    return { intent: "priority_summary" };
  }

  if (
    includesAny(text, [
      "ordini urgenti da processare",
      "ci sono ordini urgenti",
      "ordini urgenti",
      "quanti ordini urgenti",
    ])
  ) {
    return { intent: "urgent_orders_check" };
  }

  if (
    includesAny(text, [
      "apri produzione",
      "lavorazioni da avviare",
      "da avviare in produzione",
      "filtrami le lavorazioni",
    ])
  ) {
    return { intent: "open_production_to_start" };
  }

  if (includesAny(text, ["3 problemi piu importanti", "tre problemi", "problemi della dashboard"])) {
    return { intent: "top_three_issues" };
  }

  if (
    includesAny(text, [
      "guadagno spedizioni",
      "guadagno di oggi",
      "profitto di oggi",
      "quanto guadagno oggi",
      "utile di oggi",
      "margine di oggi",
    ])
  ) {
    return { intent: "report_profit_today" };
  }

  if (
    includesAny(text, [
      "fatturato di oggi",
      "incasso di oggi",
      "ricavi di oggi",
      "quanto abbiamo fatturato",
      "quanto abbiamo incassato oggi",
    ])
  ) {
    return { intent: "report_revenue_today" };
  }

  if (
    includesAny(text, [
      "quanti ordini oggi",
      "ordini di oggi",
      "numero ordini oggi",
      "volume ordini oggi",
      "media per ordine oggi",
    ])
  ) {
    return { intent: "report_orders_today" };
  }

  if (
    includesAny(text, [
      "stato ddt",
      "quanti ddt emessi",
      "quanti ddt consegnati",
      "ddt di oggi",
      "situazione ddt",
      "documenti di trasporto",
    ])
  ) {
    return { intent: "report_ddt_status" };
  }

  if (
    includesAny(text, [
      "portafoglio ordini settimana",
      "portafoglio settimanale ordini",
      "ordini in portafoglio settimana",
      "valore ordini settimana",
      "quanti ordini in settimana",
    ])
  ) {
    return { intent: "report_order_book_week" };
  }

  if (
    includesAny(text, [
      "portafoglio ordini mese",
      "portafoglio mensile ordini",
      "ordini in portafoglio mese",
      "valore ordini mese",
      "quanti ordini nel mese",
    ])
  ) {
    return { intent: "report_order_book_month" };
  }

  if (
    includesAny(text, [
      "report acquisti",
      "quanto stiamo spendendo",
      "totale acquisti",
      "media acquisti",
      "spesa fornitori",
      "andamento acquisti",
    ])
  ) {
    return { intent: "report_acquisti_summary" };
  }

  if (
    includesAny(text, [
      "report avanzamento",
      "stato avanzamento ordini",
      "avanzamento produzione",
      "ordini in ritardo in produzione",
      "media avanzamento produzione",
    ])
  ) {
    return { intent: "report_avanzamento_summary" };
  }

  if (
    includesAny(text, [
      "briefing executive",
      "briefing esecutivo",
      "briefing in 10 secondi",
      "report executive",
      "riassunto executive",
      "dammi solo 3 numeri",
      "fammi un briefing veloce",
      "briefing ceo",
    ])
  ) {
    return { intent: "report_executive_briefing" };
  }

  if (
    includesAny(text, [
      "se sblocco",
      "se sblocco ordini",
      "cosa cambia se sblocco",
      "what if ordini bloccati",
      "simulazione ordini bloccati",
    ])
  ) {
    return { intent: "what_if_unblock_orders" };
  }

  if (
    includesAny(text, [
      "se riduco i ritardi",
      "se riduco spedizioni in ritardo",
      "what if ritardi",
      "simulazione ritardi",
      "impatto se riduco ritardi",
    ])
  ) {
    return { intent: "what_if_reduce_delays" };
  }

  if (
    includesAny(text, [
      "spiegami i kpi",
      "spiega kpi",
      "impatto business",
      "cosa significa per il business",
      "leggi i kpi in modo business",
      "fammi capire i numeri",
    ])
  ) {
    return { intent: "kpi_explain_business" };
  }

  if (
    includesAny(text, [
      "chiusura giornata",
      "chiudi giornata",
      "fine giornata",
      "riepilogo fine giornata",
    ])
  ) {
    return { intent: "end_of_day_closure" };
  }

  if (
    includesAny(text, [
      "rischi ritardo domani",
      "rischio ritardi domani",
      "domani rischiamo ritardi",
      "previsione ritardi domani",
    ])
  ) {
    return { intent: "delay_risk_tomorrow" };
  }

  if (
    includesAny(text, [
      "priorita per reparto",
      "priorita logistica",
      "priorita produzione",
      "priorita back office",
      "priorita commerciale",
      "priorita amministrazione",
    ])
  ) {
    let context = "operations";
    if (includesAny(text, ["logistica", "spedizioni", "allestimento"])) context = "logistica";
    else if (includesAny(text, ["produzione", "lavorazioni"])) context = "produzione";
    else if (includesAny(text, ["back office", "ordini"])) context = "backoffice";
    else if (includesAny(text, ["commerciale", "clienti"])) context = "commerciale";
    else if (includesAny(text, ["amministrazione", "contabilita", "fatture"])) context = "amministrazione";
    return { intent: "department_priority", context };
  }

  if (
    includesAny(text, [
      "modalita riunione",
      "formato riunione",
      "fammi una sintesi per riunione",
      "briefing riunione",
    ])
  ) {
    return { intent: "meeting_mode" };
  }

  if (
    includesAny(text, [
      "oggi vs ieri",
      "confronto con ieri",
      "come siamo rispetto a ieri",
      "confronta oggi e ieri",
    ])
  ) {
    return { intent: "compare_today_yesterday" };
  }

  if (
    includesAny(text, [
      "clienti a rischio",
      "top clienti a rischio",
      "quali clienti rischiano ritardi",
      "clienti con rischio ritardo",
    ])
  ) {
    return { intent: "top_clients_risk" };
  }

  if (
    includesAny(text, [
      "piano spedizioni espresso",
      "piano 2 ore spedizioni",
      "riduci ritardi subito",
      "piano rapido spedizioni",
    ])
  ) {
    return { intent: "express_shipping_plan" };
  }

  if (
    includesAny(text, [
      "aggiorna stato task ai",
      "chiudi task ai",
      "task ai completati",
      "segna task ai",
    ])
  ) {
    return { intent: "update_ai_tasks_status" };
  }

  if (
    includesAny(text, [
      "briefing report",
      "briefing di oggi",
      "report parlato",
      "fammi un briefing",
      "briefing operativo",
      "riassunto vocale report",
      "sintesi vocale report",
      "briefing in 20 secondi",
    ])
  ) {
    return { intent: "report_voice_briefing" };
  }

  if (
    includesAny(text, [
      "report di oggi",
      "riepilogo report",
      "sintesi report",
      "panoramica report",
      "fammi un report",
    ])
  ) {
    return { intent: "report_overview" };
  }

  if (
    includesAny(text, [
      "come posso migliorare",
      "come migliorare",
      "cosa mi consigli",
      "dammi un suggerimento",
      "ottimizzare la produzione",
      "spedire il prima possibile",
      "come faccio a spedire prima",
      "quale priorita devo seguire",
      "come posso ottimizzare",
    ])
  ) {
    return { intent: "operational_advice" };
  }

  if (includesAny(text, ["apri", "vai", "mostrami"])) {
    const route = sectionRoutes.find((item) => includesAny(text, item.terms));
    if (route) return { intent: "open_section", section: route.section };
  }

  return { intent: "unknown" };
}
