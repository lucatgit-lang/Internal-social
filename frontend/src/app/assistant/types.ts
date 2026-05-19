/**
 * File Overview: types.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

export type AssistantFocus = "blocked" | "urgent" | "production" | "late";

export type AssistantIntent =
  | "show_blocked_orders"
  | "late_shipments_count"
  | "open_clients"
  | "priority_summary"
  | "urgent_orders_check"
  | "open_production_to_start"
  | "top_three_issues"
  | "report_profit_today"
  | "report_revenue_today"
  | "report_orders_today"
  | "report_ddt_status"
  | "report_acquisti_summary"
  | "report_avanzamento_summary"
  | "report_order_book_week"
  | "report_order_book_month"
  | "report_overview"
  | "report_voice_briefing"
  | "report_executive_briefing"
  | "what_if_unblock_orders"
  | "what_if_reduce_delays"
  | "kpi_explain_business"
  | "end_of_day_closure"
  | "delay_risk_tomorrow"
  | "department_priority"
  | "meeting_mode"
  | "compare_today_yesterday"
  | "top_clients_risk"
  | "express_shipping_plan"
  | "update_ai_tasks_status"
  | "operational_advice"
  | "open_section"
  | "unknown";

export interface IntentMatch {
  intent: AssistantIntent;
  section?: string;
  context?: string;
}

export interface OperationalSnapshot {
  blockedOrders: number;
  urgentOrders: number;
  productionToStart: number;
  lateShipments: number;
  topIssues: string[];
  derived?: {
    riskLevel: "basso" | "medio" | "alto" | "critico";
    primaryFocus: "blocked" | "urgent" | "late" | "production";
    recommendedSequence: string[];
    lateVsUrgentDelta: number;
    blockedPressure: number;
  };
}

export interface AssistantResult {
  text: string;
  route?: string;
  query?: Record<string, string>;
  focus?: AssistantFocus;
}

export interface AssistantEnhanceRequest {
  text: string;
  intent: AssistantIntent;
  snapshot: OperationalSnapshot;
  userName: string;
  localText: string;
}

export interface AssistantEnhancedResponse {
  text: string;
  suggestion?: string;
  cta?: string;
  tasks?: Array<{
    title: string;
    description?: string;
    priority?: "high" | "medium" | "low";
    dueDate?: string;
    route?: string;
    owner?: string;
  }>;
  scope: "in_scope" | "out_of_scope";
  source: "groq" | "local_fallback";
}
