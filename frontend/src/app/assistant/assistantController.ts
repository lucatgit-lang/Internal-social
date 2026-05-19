/**
 * File Overview: assistantController.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import type { OperationalSnapshot, AssistantResult, IntentMatch } from "./types";
import { formatCurrency, getReportInsights, getTodayVsYesterday, getTopRiskClients } from "./reportInsights";

const NOT_READY_MESSAGE =
  "Sono ancora in fase di programmazione, a breve Luca mi fara diventare piu intelligente.";

/**
 * buildPriorityAdvice: descrive il comportamento principale di questa funzione.
 * @param snapshot Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function buildPriorityAdvice(snapshot: OperationalSnapshot): string {
  if (snapshot.lateShipments === 0) {
    if (snapshot.blockedOrders > 0) {
      return "Suggerimento operativo: priorita agli ordini bloccati, sono il collo di bottiglia principale.";
    }
    if (snapshot.productionToStart > 0) {
      return "Suggerimento operativo: puoi spostare priorita su produzione da avviare.";
    }
    return "Suggerimento operativo: oggi non vedo criticita alte, puoi mantenere priorita su ordini urgenti.";
  }

  if (snapshot.lateShipments >= snapshot.blockedOrders && snapshot.lateShipments >= snapshot.urgentOrders) {
    return "Suggerimento operativo: metti in priorita le spedizioni in ritardo, poi passa agli ordini bloccati.";
  }

  if (snapshot.blockedOrders > snapshot.lateShipments) {
    return "Suggerimento operativo: prima sblocca gli ordini bloccati, poi chiudi le spedizioni in ritardo.";
  }

  return "Suggerimento operativo: allinea subito logistica e produzione sulle spedizioni in ritardo piu vicine alla consegna.";
}

/**
 * clamp: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @param min Input richiesto dalla funzione.
 * @param max Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * executeIntent: descrive il comportamento principale di questa funzione.
 * @param match Input richiesto dalla funzione.
 * @param snapshot Input richiesto dalla funzione.
 * @param userName Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export function executeIntent(
  match: IntentMatch,
  snapshot: OperationalSnapshot,
  userName: string
): AssistantResult {
  const report = getReportInsights();
  const delta = getTodayVsYesterday();

  switch (match.intent) {
    case "show_blocked_orders":
      return {
        text: `Ho trovato ${snapshot.blockedOrders} ordini bloccati. Ti porto subito sulla dashboard con il focus corretto.`,
        route: "/",
        query: { assistFocus: "blocked" },
        focus: "blocked",
      };
    case "late_shipments_count":
      {
        const advice = buildPriorityAdvice(snapshot);
        return {
          text: `Oggi risultano ${snapshot.lateShipments} spedizioni in ritardo. ${advice} Apro la dashboard e ti evidenzio la card.`,
          route: "/",
          query: { assistFocus: "late" },
          focus: "late",
        };
      }
    case "open_clients":
      return {
        text: "Apro subito la sezione clienti.",
        route: "/clienti",
      };
    case "priority_summary":
      return {
        text: `Ecco le priorita di oggi, ${userName}: ${snapshot.topIssues[0]}, ${snapshot.topIssues[1]} e ${snapshot.topIssues[2]}.`,
        route: "/",
      };
    case "urgent_orders_check":
      return {
        text:
          snapshot.urgentOrders > 0
            ? `Si, ci sono ${snapshot.urgentOrders} ordini urgenti da processare.`
            : "Al momento non risultano ordini urgenti da processare.",
        route: "/",
        query: { assistFocus: "urgent" },
        focus: "urgent",
      };
    case "open_production_to_start":
      return {
        text: `Apro Produzione e filtro le lavorazioni da avviare. In coda ora ne risultano ${snapshot.productionToStart}.`,
        route: "/produzione",
        query: { tab: "da_avviare" },
        focus: "production",
      };
    case "top_three_issues":
      return {
        text: `I tre problemi principali sono: ${snapshot.topIssues[0]}, ${snapshot.topIssues[1]}, ${snapshot.topIssues[2]}.`,
        route: "/",
      };
    case "report_profit_today":
      return {
        text: `In base alle spedizioni di oggi, il guadagno stimato e ${formatCurrency(report.guadagnoStimatoOggi)}, con margine medio del ${report.margineStimatoPercent}%.`,
        route: "/report/prospetto-ordini-giornalieri",
      };
    case "report_revenue_today":
      return {
        text: `Oggi hai fatturato ${formatCurrency(report.fatturatoOggi)} su ${report.ordiniOggi} ordini.`,
        route: "/report/prospetto-ordini-giornalieri",
      };
    case "report_orders_today":
      return {
        text: `Oggi risultano ${report.ordiniOggi} ordini, con ticket medio di ${formatCurrency(report.ticketMedioOggi)}.`,
        route: "/report/prospetto-ordini-giornalieri",
      };
    case "report_ddt_status":
      return {
        text: `Nel report DDT vedo ${report.ddtEmessi} emessi, ${report.ddtConsegnati} consegnati e ${report.ddtInTransito} in transito.`,
        route: "/report/prospetto-ddt",
      };
    case "report_order_book_week":
      return {
        text: `Portafoglio ordini settimana: ${report.ordiniSettimana} ordini per un valore di ${formatCurrency(report.portafoglioOrdiniSettimana)}.`,
        route: "/report/ordini",
      };
    case "report_order_book_month":
      return {
        text: `Portafoglio ordini mese: ${report.ordiniMese} ordini per un valore di ${formatCurrency(report.portafoglioOrdiniMese)}.`,
        route: "/report/ordini",
      };
    case "report_acquisti_summary":
      return {
        text: `Sugli acquisti hai ${report.acquistiOrdini} ordini fornitori per ${formatCurrency(report.acquistiTotale)} totali. Spesa media ${formatCurrency(report.acquistiMedia)}.`,
        route: "/report/acquisti",
      };
    case "report_avanzamento_summary":
      return {
        text: `Avanzamento produzione medio al ${report.avanzamentoMedioProduzione}%. Ordini in ritardo in produzione: ${report.ordiniProduzioneInRitardo}.`,
        route: "/report/avanzamento",
      };
    case "report_overview":
      return {
        text: `Report rapido: fatturato oggi ${formatCurrency(report.fatturatoOggi)}, guadagno stimato ${formatCurrency(report.guadagnoStimatoOggi)}, DDT consegnati ${report.ddtConsegnati}.`,
        route: "/report/ordini",
      };
    case "report_voice_briefing":
      return {
        text: `Briefing rapido. Oggi fatturato ${formatCurrency(report.fatturatoOggi)}. Guadagno stimato ${formatCurrency(report.guadagnoStimatoOggi)}. Hai ${snapshot.lateShipments} spedizioni in ritardo e ${snapshot.blockedOrders} ordini bloccati. Priorita: riduci prima i ritardi, poi sblocca gli ordini. Vuoi che ti apro i report?`,
        route: "/report/ordini",
      };
    case "report_executive_briefing":
      return {
        text: `Executive briefing: fatturato ${formatCurrency(report.fatturatoOggi)}, guadagno stimato ${formatCurrency(report.guadagnoStimatoOggi)}, spedizioni in ritardo ${snapshot.lateShipments}.`,
        route: "/report/ordini",
      };
    case "what_if_unblock_orders":
      {
        const toUnblock = clamp(Math.ceil(snapshot.blockedOrders * 0.4), 1, 5);
        const estDelayReduction = clamp(Math.round(toUnblock * 0.6), 1, snapshot.lateShipments || 1);
        return {
          text: `Se sblocchi ${toUnblock} ordini nelle prossime ore, puoi ridurre fino a ${estDelayReduction} ritardi spedizione oggi.`,
          route: "/ordini",
          query: { assistFocus: "blocked" },
        };
      }
    case "what_if_reduce_delays":
      {
        const reduced = clamp(Math.ceil(snapshot.lateShipments * 0.5), 1, snapshot.lateShipments || 1);
        const gain = Math.round((report.guadagnoStimatoOggi / Math.max(report.ordiniOggi, 1)) * reduced);
        return {
          text: `Se riduci di ${reduced} i ritardi oggi, proteggi circa ${formatCurrency(gain)} di margine operativo.`,
          route: "/allestimento",
          query: { assistFocus: "late" },
        };
      }
    case "kpi_explain_business":
      return {
        text: `KPI business: ${snapshot.lateShipments} ritardi aumentano rischio cliente, ${snapshot.blockedOrders} bloccati fermano cassa, margine stimato oggi ${report.margineStimatoPercent}%.`,
        route: "/report/ordini",
      };
    case "end_of_day_closure":
      return {
        text: `Chiusura giornata: fatturato ${formatCurrency(report.fatturatoOggi)}, guadagno stimato ${formatCurrency(report.guadagnoStimatoOggi)}, task critici ${snapshot.blockedOrders + snapshot.lateShipments}. Priorita di domani: ridurre ritardi e chiudere ordini bloccati.`,
        route: "/report/ordini",
      };
    case "delay_risk_tomorrow":
      return {
        text:
          snapshot.lateShipments + snapshot.blockedOrders >= 8
            ? "Rischio ritardi domani alto. Ti consiglio piano spedizioni espresso e sblocco ordini entro oggi."
            : "Rischio ritardi domani medio-basso. Mantieni monitoraggio su urgenze e allestimento.",
        route: "/allestimento",
      };
    case "department_priority":
      {
        const dept = match.context || "operations";
        if (dept === "logistica") {
          return {
            text: "Priorita logistica: riduci ritardi spedizioni, conferma DDT bloccati, poi riallinea consegne cliente.",
            route: "/allestimento",
          };
        }
        if (dept === "produzione") {
          return {
            text: "Priorita produzione: avvia lavorazioni ferme, sblocca ordini in coda, poi recupera ritardi sui lotti urgenti.",
            route: "/produzione",
          };
        }
        if (dept === "backoffice") {
          return {
            text: "Priorita back office: sblocca ordini sospesi e valida rapidamente le approvazioni in attesa.",
            route: "/ordini",
          };
        }
        if (dept === "commerciale") {
          return {
            text: "Priorita commerciale: contatta subito i clienti a rischio ritardo e conferma nuove date realistiche.",
            route: "/clienti",
          };
        }
        if (dept === "amministrazione") {
          return {
            text: "Priorita amministrazione: allinea fatture aperte con urgenze operative e libera ordini pronti.",
            route: "/fatture",
          };
        }
        return {
          text: "Priorita reparto: ordini bloccati, ritardi spedizioni, poi avanzamento produzione.",
          route: "/",
        };
      }
    case "meeting_mode":
      return {
        text: `Modalita riunione. Punto 1: ${snapshot.topIssues[0]}. Punto 2: fatturato ${formatCurrency(report.fatturatoOggi)}. Punto 3: margine stimato ${report.margineStimatoPercent}%. Decisione: priorita a ritardi e blocchi. Next step: piano operativo nelle prossime 2 ore.`,
        route: "/report/ordini",
      };
    case "compare_today_yesterday":
      return {
        text: `Confronto oggi vs ieri: fatturato ${delta.fatturatoDelta >= 0 ? "in crescita" : "in calo"} di ${formatCurrency(Math.abs(delta.fatturatoDelta))}, ordini ${delta.ordiniDelta >= 0 ? "+" : ""}${delta.ordiniDelta}, clienti ${delta.clientiDelta >= 0 ? "+" : ""}${delta.clientiDelta}.`,
        route: "/report/prospetto-ordini-giornalieri",
      };
    case "top_clients_risk":
      {
        const clients = getTopRiskClients();
        return {
          text: `Clienti a rischio oggi: ${clients[0]}, ${clients[1]} e ${clients[2]}. Consiglio contatto immediato con proposta data certa.`,
          route: "/clienti",
        };
      }
    case "express_shipping_plan":
      return {
        text: "Piano spedizioni espresso: 30 minuti su DDT critici, 60 minuti su priorita consegne, 30 minuti su conferme clienti.",
        route: "/allestimento",
      };
    case "update_ai_tasks_status":
      return {
        text: "Posso aggiornare i task AI adesso. Dimmi se li segno in corso o completati.",
      };
    case "operational_advice":
      return {
        text: `Analizzando i dati di oggi, partirei da ${snapshot.topIssues[0].toLowerCase()} e poi ${snapshot.topIssues[1].toLowerCase()}. Se vuoi ti preparo una priorita operativa piu dettagliata.`,
      };
    case "open_section":
      return {
        text: "Perfetto, apro la sezione richiesta.",
        route: match.section || "/",
      };
    case "unknown":
    default:
      return {
        text: NOT_READY_MESSAGE,
      };
  }
}
