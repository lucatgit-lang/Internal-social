/**
 * File Overview: operationalHealth.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import type { OperationalSnapshot } from "./types";

export interface OperationalHealth {
  score: number;
  level: "ottimo" | "buono" | "attenzione" | "critico";
  drivers: string[];
  anomalies: Array<{
    label: string;
    route: string;
    severity: "high" | "medium";
  }>;
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
 * calculateOperationalHealth: descrive il comportamento principale di questa funzione.
 * @param snapshot Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function calculateOperationalHealth(snapshot: OperationalSnapshot): OperationalHealth {
  let score = 100;
  const drivers: string[] = [];
  const anomalies: OperationalHealth["anomalies"] = [];

  const blockedPenalty = snapshot.blockedOrders * 6;
  const latePenalty = snapshot.lateShipments * 7;
  const urgentPenalty = Math.max(0, snapshot.urgentOrders - 3) * 4;
  const productionPenalty = Math.max(0, snapshot.productionToStart - 3) * 3;

  score -= blockedPenalty + latePenalty + urgentPenalty + productionPenalty;
  score = clamp(score, 0, 100);

  if (snapshot.blockedOrders > 0) {
    drivers.push(`-${blockedPenalty} per ordini bloccati`);
    anomalies.push({
      label: `${snapshot.blockedOrders} ordini bloccati`,
      route: "/ordini",
      severity: snapshot.blockedOrders >= 5 ? "high" : "medium",
    });
  }

  if (snapshot.lateShipments > 0) {
    drivers.push(`-${latePenalty} per spedizioni in ritardo`);
    anomalies.push({
      label: `${snapshot.lateShipments} spedizioni in ritardo`,
      route: "/allestimento",
      severity: snapshot.lateShipments >= 4 ? "high" : "medium",
    });
  }

  if (snapshot.urgentOrders > 0) {
    drivers.push(`-${urgentPenalty} per ordini urgenti`);
    anomalies.push({
      label: `${snapshot.urgentOrders} ordini urgenti`,
      route: "/",
      severity: snapshot.urgentOrders >= 8 ? "high" : "medium",
    });
  }

  let level: OperationalHealth["level"] = "ottimo";
  if (score < 35) level = "critico";
  else if (score < 55) level = "attenzione";
  else if (score < 75) level = "buono";

  if (drivers.length === 0) {
    drivers.push("+0 penalita oggi, operativita stabile");
  }

  return {
    score,
    level,
    drivers: drivers.slice(0, 3),
    anomalies: anomalies.slice(0, 3),
  };
}
