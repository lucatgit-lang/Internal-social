/**
 * File Overview: snapshot.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import type { OrdineAgente } from "../contexts/OrderFlowContext";
import { dashboardPriorityItems } from "../data/dashboard-priority";
import type { OperationalSnapshot } from "./types";

type RiskLevel = NonNullable<OperationalSnapshot["derived"]>["riskLevel"];

/**
 * getBaseCount: descrive il comportamento principale di questa funzione.
 * @param key Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function getBaseCount(key: "blocked" | "urgent" | "production" | "late"): number {
  return dashboardPriorityItems.find((item) => item.key === key)?.count ?? 0;
}

/**
 * buildOperationalSnapshot: descrive il comportamento principale di questa funzione.
 * @param orders Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function buildOperationalSnapshot(orders: OrdineAgente[]): OperationalSnapshot {
  const dynamicBlocked = orders.filter((order) => order.stato === "rifiutato").length;
  const dynamicUrgent = orders.filter(
    (order) => order.priorita === "urgente" && order.stato !== "completato"
  ).length;
  const dynamicProductionToStart = orders.filter(
    (order) => order.stato === "approvato_contabilita"
  ).length;

  const blockedOrders = Math.max(getBaseCount("blocked"), dynamicBlocked);
  const urgentOrders = Math.max(getBaseCount("urgent"), dynamicUrgent);
  const productionToStart = Math.max(getBaseCount("production"), dynamicProductionToStart);
  const lateShipments = getBaseCount("late");
  const lateVsUrgentDelta = lateShipments - urgentOrders;
  const blockedPressure = blockedOrders + Math.max(0, lateShipments - 1);

  const ranked = [
    { key: "blocked" as const, score: blockedOrders * 1.3 + lateShipments * 0.4 },
    { key: "late" as const, score: lateShipments * 1.5 + urgentOrders * 0.2 },
    { key: "urgent" as const, score: urgentOrders * 1.2 },
    { key: "production" as const, score: productionToStart * 0.9 },
  ].sort((a, b) => b.score - a.score);

  const primaryFocus = ranked[0]?.key ?? "urgent";

  const totalPressure = blockedOrders + urgentOrders + productionToStart + lateShipments;
  const riskLevel: RiskLevel =
    totalPressure >= 20 ? "critico" : totalPressure >= 13 ? "alto" : totalPressure >= 7 ? "medio" : "basso";

  const sequenceLabel: Record<(typeof ranked)[number]["key"], string> = {
    blocked: "Sblocca ordini bloccati",
    late: "Riduci spedizioni in ritardo",
    urgent: "Processa ordini urgenti",
    production: "Avvia lavorazioni in produzione",
  };

  const recommendedSequence = ranked.slice(0, 3).map((item) => sequenceLabel[item.key]);

  return {
    blockedOrders,
    urgentOrders,
    productionToStart,
    lateShipments,
    topIssues: [
      `${blockedOrders} ordini bloccati`,
      `${urgentOrders} ordini urgenti da processare`,
      `${lateShipments} spedizioni in ritardo`,
    ],
    derived: {
      riskLevel,
      primaryFocus,
      recommendedSequence,
      lateVsUrgentDelta,
      blockedPressure,
    },
  };
}
