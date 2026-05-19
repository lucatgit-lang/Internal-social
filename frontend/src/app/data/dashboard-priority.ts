/**
 * File Overview: dashboard-priority.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

export type PriorityType = "critical" | "urgent" | "warning" | "info";

export interface PriorityItem {
  id: string;
  key: "blocked" | "urgent" | "production" | "late";
  title: string;
  count: number;
  type: PriorityType;
  action: string;
  actionLabel: string;
  route: string;
  tasks: string[];
}

export const dashboardPriorityItems: PriorityItem[] = [
  {
    id: "1",
    key: "blocked",
    title: "Ordini Bloccati",
    count: 5,
    type: "critical",
    action: "Risolvi Ora",
    actionLabel: "Risolvi",
    route: "/ordini",
    tasks: [
      "ORD-102: Mancanza fusti 200L",
      "ORD-098: Attesa approvazione fido",
      "ORD-115: Ritardo fornitore resine",
      "ORD-104: Revisione qualità necessaria",
      "ORD-122: Indirizzo di consegna errato",
    ],
  },
  {
    id: "2",
    key: "urgent",
    title: "Ordini Urgenti",
    count: 8,
    type: "urgent",
    action: "Processa",
    actionLabel: "Processa",
    route: "/ordini",
    tasks: [
      "ORD-130: Consegna entro stasera",
      "ORD-131: Cliente prioritario",
      "ORD-128: Richiesta express Toluene",
      "ORD-135: Sostituzione lotto difettoso",
      "ORD-140: Richiesta direzione",
    ],
  },
  {
    id: "3",
    key: "production",
    title: "Produzioni da Avviare",
    count: 5,
    type: "warning",
    action: "Avvia Produzione",
    actionLabel: "Avvia Produzione",
    route: "/produzione",
    tasks: [
      "PRD-201: Smalto lucido bianco",
      "PRD-202: Fondo epossidico",
      "PRD-204: Solvente miscela X1",
      "PRD-205: Vernice poliuretanica",
      "PRD-207: Trasparente opaco",
    ],
  },
  {
    id: "4",
    key: "late",
    title: "Spedizioni in Ritardo",
    count: 5,
    type: "info",
    action: "Gestisci",
    actionLabel: "Gestisci",
    route: "/allestimento",
    tasks: [
      "SPED-045: Corriere non arrivato",
      "SPED-042: Pallet non completato",
      "SPED-048: Documenti mancanti",
      "SPED-050: Merce da ricontrollare",
      "SPED-051: Ripianificazione autista",
    ],
  },
];
