/**
 * File Overview: CommandCenter.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

﻿import { X, Sparkles, Mic, Send, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useNavigate } from "react-router";
import { useUser } from "../../contexts/UserContext";
import { detectIntent } from "../../assistant/intentEngine";
import { executeIntent } from "../../assistant/assistantController";
import { enhanceAssistantResponse } from "../../assistant/enhancedResponse";
import {
  appendAssistantTasks,
  createFallbackAdviceTasks,
  markAssistantTasksDone,
  markAssistantTasksInProgress,
  syncAssistantTasks,
  type DashboardTaskItem,
} from "../../assistant/aiTasks";
import {
  appendAssistantHistory,
  HISTORY_UPDATED_EVENT,
  loadAssistantHistory,
  syncAssistantHistory,
  type AssistantHistoryEntry,
} from "../../assistant/history";
import { formatCurrency, getReportInsights } from "../../assistant/reportInsights";
import {
  createVoiceRecognizer,
  getAvailableVoices,
  isRecommendedGoogleVoice,
  prepareVoice,
  resolveInitialPreferredVoiceId,
  speakText,
  type BrowserVoiceOption,
  type VoiceRecognizerController,
} from "../../assistant/voiceRuntime";
import { loadPreferredVoice, savePreferredVoice } from "../../assistant/voiceSettings";
import type {
  AssistantEnhanceRequest,
  AssistantEnhancedResponse,
  OperationalSnapshot,
} from "../../assistant/types";
import { getDashboardPrioritySnapshot } from "../../api/dashboard";

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AssistantActionButton {
  label: string;
  route: string;
  query?: Record<string, string>;
}

const suggestedPrompts = [
  "Fammi un briefing executive in 10 secondi",
  "Fammi la chiusura giornata",
  "Rischiamo ritardi domani?",
  "Priorita reparto logistica",
  "Confronto oggi vs ieri",
  "Portafoglio ordini settimana",
  "Portafoglio ordini mese",
  "Mostrami gli ordini bloccati",
  "Quante spedizioni sono in ritardo oggi?",
  "In base alle spedizioni di oggi qual e il guadagno?",
  "Fammi un briefing report in 20 secondi",
  "Apri la sezione clienti",
  "Fammi il riepilogo delle priorita di oggi",
  "Ci sono ordini urgenti da processare?",
  "Apri produzione e filtrami le lavorazioni da avviare",
  "Leggimi i 3 problemi piu importanti della dashboard",
  "Spiegami i KPI in ottica business",
  "Se sblocco ordini adesso cosa cambia?",
];

const quickActions = [
  { icon: "📊", label: "Report", action: "/report/ordini" },
  { icon: "📦", label: "Ordini", action: "/ordini" },
  { icon: "👥", label: "Clienti", action: "/clienti" },
  { icon: "🏭", label: "Produzione", action: "/produzione" },
];

const confirmableIntents = new Set([
  "show_blocked_orders",
  "late_shipments_count",
  "priority_summary",
  "urgent_orders_check",
  "open_production_to_start",
  "top_three_issues",
  "report_profit_today",
  "report_revenue_today",
  "report_orders_today",
  "report_ddt_status",
  "report_order_book_week",
  "report_order_book_month",
  "report_acquisti_summary",
  "report_avanzamento_summary",
  "report_overview",
  "report_voice_briefing",
  "report_executive_briefing",
  "what_if_unblock_orders",
  "what_if_reduce_delays",
  "kpi_explain_business",
  "end_of_day_closure",
  "delay_risk_tomorrow",
  "department_priority",
  "meeting_mode",
  "compare_today_yesterday",
  "top_clients_risk",
  "express_shipping_plan",
  "update_ai_tasks_status",
]);

const DAILY_BRIEFING_KEY = "assistant_daily_briefing_v1";
const ANOMALY_ALERT_KEY = "assistant_anomaly_alert_v1";
const FOLLOW_UP_MS = 30 * 60 * 1000;

const demoScript = [
  "Fammi un briefing executive in 10 secondi",
  "Quante spedizioni sono in ritardo oggi?",
  "In base alle spedizioni di oggi qual e il guadagno?",
  "Se sblocco ordini adesso cosa cambia?",
  "Spiegami i KPI in ottica business",
  "Confronto oggi vs ieri",
];

const positiveConfirmations = [
  "si",
  "sì",
  "ok",
  "va bene",
  "procedi",
  "mostra",
  "apri",
  "certo",
  "confermo",
];

const negativeConfirmations = [
  "no",
  "non ora",
  "annulla",
  "ferma",
  "aspetta",
  "dopo",
];

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
 * buildRouteWithQuery: descrive il comportamento principale di questa funzione.
 * @param route Input richiesto dalla funzione.
 * @param query Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function buildRouteWithQuery(route: string, query?: Record<string, string>): string {
  if (!query || Object.keys(query).length === 0) return route;
  const params = new URLSearchParams(query);
  return `${route}?${params.toString()}`;
}

/**
 * mergeEnhancedText: descrive il comportamento principale di questa funzione.
 * @param baseText Input richiesto dalla funzione.
 * @param suggestion Input richiesto dalla funzione.
 * @param cta Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function mergeEnhancedText(baseText: string, suggestion?: string, cta?: string): string {
  const chunks = [baseText];
  if (suggestion) chunks.push(`Suggerimento: ${suggestion}`);
  if (cta) chunks.push(cta);
  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * resolveActionButtons: descrive il comportamento principale di questa funzione.
 * @param intent Input richiesto dalla funzione.
 * @param route Input richiesto dalla funzione.
 * @param query Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function resolveActionButtons(intent: string, route?: string, query?: Record<string, string>): AssistantActionButton[] {
  const actions: AssistantActionButton[] = [];
  if (route) actions.push({ label: "Apri sezione", route, query });

  if (intent === "show_blocked_orders" || intent === "what_if_unblock_orders") {
    actions.push({ label: "Vai a Ordini", route: "/ordini" });
  }
  if (intent === "late_shipments_count" || intent === "express_shipping_plan") {
    actions.push({ label: "Vai a Allestimento", route: "/allestimento" });
  }
  if (intent.startsWith("report_") || intent === "compare_today_yesterday" || intent === "meeting_mode") {
    actions.push({ label: "Apri Report", route: "/report/ordini" });
  }
  if (intent === "top_clients_risk" || intent === "department_priority") {
    actions.push({ label: "Apri Clienti", route: "/clienti" });
  }

  const seen = new Set<string>();
  return actions
    .filter((item) => {
      const key = `${item.label}|${item.route}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

/**
 * splitMultiStepCommand: descrive il comportamento principale di questa funzione.
 * @param raw Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function splitMultiStepCommand(raw: string): string[] {
  return raw
    .split(/\bpoi\b|,|;| e poi /gi)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * isMultiStepCommand: descrive il comportamento principale di questa funzione.
 * @param raw Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function isMultiStepCommand(raw: string): boolean {
  const normalized = normalizeText(raw);
  return normalized.includes(" poi ") || raw.includes(",") || raw.includes(";");
}

/**
 * buildExecutiveBriefingText: descrive il comportamento principale di questa funzione.


 * @param userName Input richiesto dalla funzione.


 * @param snapshot Input richiesto dalla funzione.


 * @returns Valore restituito dalla funzione secondo il contratto corrente.


 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).


 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.


 */


function buildExecutiveBriefingText(
  userName: string,
  snapshot: OperationalSnapshot
): string {
  const report = getReportInsights();
  return `Briefing ${userName}. Fatturato ${formatCurrency(report.fatturatoOggi)}. Guadagno stimato ${formatCurrency(report.guadagnoStimatoOggi)}. Ritardi spedizioni ${snapshot.lateShipments}.`;
}

/**
 * mapEnhancedTasksToDashboard: descrive il comportamento principale di questa funzione.
 * @param tasks Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function mapEnhancedTasksToDashboard(tasks: NonNullable<AssistantEnhancedResponse["tasks"]>): DashboardTaskItem[] {
  const seed = Date.now();
  return tasks.map((task, index) => ({
    id: `ai-groq-${seed + index}`,
    title: task.title,
    description: task.description || "Task operativo suggerito dall'assistente.",
    priority: task.priority || "medium",
    status: "pending",
    dueDate: task.dueDate || "Oggi",
    route: task.route || "/",
    owner: task.owner || "Operations",
    source: "assistant",
  }));
}

/**
 * CommandCenter: descrive il comportamento principale di questa funzione.
 * @param isOpen Input richiesto dalla funzione.
 * @param onClose Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function CommandCenter({ isOpen, onClose }: CommandCenterProps) {
  const [message, setMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [voiceHint, setVoiceHint] = useState("");
  const [pendingNavigation, setPendingNavigation] = useState<{ route: string; query?: Record<string, string> } | null>(null);
  const [pendingTaskUpdate, setPendingTaskUpdate] = useState<"ask" | null>(null);
  const [actionButtons, setActionButtons] = useState<AssistantActionButton[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voiceOptions, setVoiceOptions] = useState<BrowserVoiceOption[]>([]);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<AssistantHistoryEntry[]>(() =>
    loadAssistantHistory()
  );
  const [snapshot, setSnapshot] = useState<OperationalSnapshot>({
    blockedOrders: 0,
    urgentOrders: 0,
    productionToStart: 0,
    lateShipments: 0,
    topIssues: [
      "Nessun ordine bloccato",
      "Nessun ordine urgente da processare",
      "Nessuna spedizione in ritardo",
    ],
  });

  const recognizerRef = useRef<VoiceRecognizerController | null>(null);
  const hasWelcomedRef = useRef(false);
  const lastTranscriptRef = useRef("");
  const processedTranscriptRef = useRef("");
  const followUpTimerRef = useRef<number | null>(null);
  const demoModeRef = useRef(false);

  const navigate = useNavigate();
  const { user } = useUser();

  const userName = user?.name || "Admin";

  const loadSnapshot = useCallback(() => {
    void getDashboardPrioritySnapshot()
      .then((nextSnapshot) => setSnapshot(nextSnapshot))
      .catch(() => {
        // Mantiene lo snapshot corrente in fallback.
      });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const currentVoice = loadPreferredVoice();
    void getAvailableVoices("it").then((voices) => {
      setVoiceOptions(voices);
      void (async () => {
        let initialVoiceId = currentVoice;
        if (!initialVoiceId) {
          const resolved = await resolveInitialPreferredVoiceId();
          initialVoiceId = resolved.voiceId;
          if (resolved.message) {
            setVoiceHint(resolved.message);
          }
          if (initialVoiceId) {
            savePreferredVoice(initialVoiceId);
          }
        }

        setSelectedVoiceId(initialVoiceId);
        if (initialVoiceId) {
          const readiness = await prepareVoice(initialVoiceId);
          if (readiness.message) {
            setVoiceHint(readiness.message);
          }
        }
      })();

      if (!currentVoice && voices.length > 0) {
        setShowVoicePicker(true);
      } else {
        setShowVoicePicker(false);
      }
    });
  }, [isOpen]);

  const say = useCallback((text: string) => {
    try {
      void speakText(text, {
        lang: "it-IT",
        voiceId: selectedVoiceId || undefined,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (message) => {
          setIsSpeaking(false);
          setVoiceHint(message);
        },
      });
    } catch {
      setIsSpeaking(false);
      setVoiceHint("Risposta vocale non disponibile in questo browser.");
    }
  }, [selectedVoiceId]);

  const scheduleFollowUp = useCallback(() => {
    if (followUpTimerRef.current) {
      window.clearTimeout(followUpTimerRef.current);
    }
    followUpTimerRef.current = window.setTimeout(() => {
      const msg = "Follow-up operativo: vuoi che segni i task AI come in corso? Dimmi si oppure no.";
      setPendingTaskUpdate("ask");
      setLastResponse(msg);
      say(msg);
    }, FOLLOW_UP_MS);
  }, [say]);

  const navigateFromPending = useCallback(
    (route: string, query?: Record<string, string>) => {
      navigate(buildRouteWithQuery(route, query));
      onClose();
    },
    [navigate, onClose]
  );

  const runAssistant = useCallback(
    async (text: string) => {
      const normalized = text.trim();
      if (!normalized) return;
      setVoiceHint(`Comando ricevuto: "${normalized}"`);
      const normalizedCompare = normalizeText(normalized);

      if (pendingNavigation) {
        const isYes = positiveConfirmations.some((term) => normalizedCompare.includes(term));
        const isNo = negativeConfirmations.some((term) => normalizedCompare.includes(term));

        if (isYes) {
          const confirmText = "Perfetto, te le mostro subito sul gestionale.";
          setLastResponse(confirmText);
          setActionButtons([]);
          say(confirmText);
          const { route, query } = pendingNavigation;
          setPendingNavigation(null);
          window.setTimeout(() => navigateFromPending(route, query), 250);
          return;
        }

        if (isNo) {
          const cancelText = "Va bene, resto qui e continuo ad assisterti.";
          setLastResponse(cancelText);
          setActionButtons([]);
          setPendingNavigation(null);
          say(cancelText);
          return;
        }

        const helpText = "Dimmi solo si per aprire la schermata, oppure no per restare qui.";
        setLastResponse(helpText);
        setActionButtons([]);
        say(helpText);
        return;
      }

      if (pendingTaskUpdate) {
        const isYes = positiveConfirmations.some((term) => normalizedCompare.includes(term));
        const isNo = negativeConfirmations.some((term) => normalizedCompare.includes(term));

        if (isYes) {
          const progressed = await markAssistantTasksInProgress(3);
          const done = await markAssistantTasksDone(1);
          const msg = `Perfetto. Ho aggiornato ${progressed + done} task AI.`;
          setPendingTaskUpdate(null);
          setLastResponse(msg);
          setActionButtons([]);
          say(msg);
          appendAssistantHistory({ command: normalized, response: msg });
          return;
        }

        if (isNo) {
          const msg = "Va bene, mantengo i task AI invariati.";
          setPendingTaskUpdate(null);
          setLastResponse(msg);
          setActionButtons([]);
          say(msg);
          appendAssistantHistory({ command: normalized, response: msg });
          return;
        }

        const msg = "Dimmi si per aggiornare i task AI, oppure no per lasciarli invariati.";
        setLastResponse(msg);
        setActionButtons([]);
        say(msg);
        return;
      }

      if (isMultiStepCommand(normalized)) {
        const steps = splitMultiStepCommand(normalized).slice(0, 4);
        if (steps.length > 1) {
          let finalRoute: { route: string; query?: Record<string, string> } | null = null;
          const summaries: string[] = [];

          for (const step of steps) {
            const stepIntent = detectIntent(step);
            const stepResult = executeIntent(stepIntent, snapshot, userName);
            summaries.push(stepResult.text);
            if (stepResult.route) {
              finalRoute = { route: stepResult.route, query: stepResult.query };
            }
          }

          const sequenceText = `Eseguo ${steps.length} richieste in sequenza. ${summaries.join(" ")}`;
          setLastResponse(sequenceText);
          setActionButtons(
            finalRoute ? [{ label: "Apri ultimo step", route: finalRoute.route, query: finalRoute.query }] : []
          );
          say(sequenceText);
          appendAssistantHistory({
            command: normalized,
            response: sequenceText,
            route: finalRoute?.route,
          });
          if (finalRoute) {
            navigateFromPending(finalRoute.route, finalRoute.query);
          }
          return;
        }
      }

      const intent = detectIntent(normalized);
      const result = executeIntent(intent, snapshot, userName);
      let responseText = result.text;
      let createdTasksCount = 0;

      if (intent.intent === "update_ai_tasks_status") {
        setPendingTaskUpdate("ask");
        const ask = "Vuoi che segni adesso i task AI come in corso? Dimmi si oppure no.";
        setLastResponse(ask);
        setActionButtons([]);
        say(ask);
        appendAssistantHistory({ command: normalized, response: ask });
        return;
      }

      const payload: AssistantEnhanceRequest = {
        text: normalized,
        intent: intent.intent,
        snapshot,
        userName,
        localText: result.text,
      };

      const enhanced = await enhanceAssistantResponse(payload);
      if (enhanced) {
        if (enhanced.scope === "out_of_scope") {
          setPendingNavigation(null);
          setLastResponse(enhanced.text);
          setActionButtons([]);
          say(enhanced.text);
          appendAssistantHistory({
            command: normalized,
            response: enhanced.text,
          });
          return;
        }

        responseText = mergeEnhancedText(enhanced.text, enhanced.suggestion, enhanced.cta);
          if (
            intent.intent === "operational_advice" ||
            intent.intent === "what_if_unblock_orders" ||
            intent.intent === "what_if_reduce_delays" ||
            intent.intent === "express_shipping_plan" ||
            intent.intent === "department_priority"
          ) {
            const generatedTasks = enhanced.tasks?.length
              ? mapEnhancedTasksToDashboard(enhanced.tasks)
              : createFallbackAdviceTasks(snapshot);
            createdTasksCount = await appendAssistantTasks(generatedTasks);
          }
        } else if (
          intent.intent === "operational_advice" ||
          intent.intent === "what_if_unblock_orders" ||
          intent.intent === "what_if_reduce_delays" ||
          intent.intent === "express_shipping_plan" ||
          intent.intent === "department_priority"
        ) {
          createdTasksCount = await appendAssistantTasks(createFallbackAdviceTasks(snapshot));
        }

      if (createdTasksCount > 0) {
        responseText = `${responseText} Ho creato ${createdTasksCount} task operativi nella dashboard.`;
        scheduleFollowUp();
      }

      const shouldAskConfirmation =
        Boolean(result.route) && confirmableIntents.has(intent.intent) && !demoModeRef.current;

      if (shouldAskConfirmation && result.route) {
        const askText = `${responseText} Se vuoi te le mostro sul gestionale. Dimmi si oppure no.`;
        setPendingNavigation({ route: result.route, query: result.query });
        setLastResponse(askText);
        setActionButtons(resolveActionButtons(intent.intent, result.route, result.query));
        say(askText);
        appendAssistantHistory({
          command: normalized,
          response: askText,
          route: result.route,
        });
        return;
      }

      setLastResponse(responseText);
      setActionButtons(resolveActionButtons(intent.intent, result.route, result.query));
      say(responseText);
      appendAssistantHistory({
        command: normalized,
        response: responseText,
        route: result.route,
      });

      if (result.route) {
        navigateFromPending(result.route, result.query);
      }
    },
    [navigateFromPending, pendingNavigation, pendingTaskUpdate, say, scheduleFollowUp, snapshot, userName]
  );

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setVoiceHint("");
      setLiveTranscript("");
      setLastResponse("");
      setPendingNavigation(null);
      setPendingTaskUpdate(null);
      setActionButtons([]);

      if (!hasWelcomedRef.current) {
        const greeting = `Ciao ${userName}, sono pronto ad aiutarti.`;
        setLastResponse(greeting);
        say(greeting);
        hasWelcomedRef.current = true;
      }

      const todayKey = new Date().toISOString().slice(0, 10);
      const briefingStamp = window.localStorage.getItem(DAILY_BRIEFING_KEY);
      if (briefingStamp !== todayKey) {
        const dailyBrief = buildExecutiveBriefingText(userName, snapshot);
        setLastResponse(dailyBrief);
        say(dailyBrief);
        window.localStorage.setItem(DAILY_BRIEFING_KEY, todayKey);
      }
    } else {
      setIsAnimating(false);
      hasWelcomedRef.current = false;
      setIsListening(false);
      setIsSpeaking(false);
      setLiveTranscript("");
      setPendingNavigation(null);
      setPendingTaskUpdate(null);
      setActionButtons([]);
      lastTranscriptRef.current = "";
      processedTranscriptRef.current = "";
      recognizerRef.current?.destroy();
      recognizerRef.current = null;
      if (followUpTimerRef.current) {
        window.clearTimeout(followUpTimerRef.current);
        followUpTimerRef.current = null;
      }
    }
  }, [isOpen, say, snapshot, userName]);

  useEffect(() => {
    if (!isOpen) return;
    loadSnapshot();
  }, [isOpen, loadSnapshot]);

  useEffect(() => {
    if (!isOpen) return;
    const anomalyLevel =
      snapshot.lateShipments >= 5 || snapshot.blockedOrders >= 5 || snapshot.urgentOrders >= 8;
    if (!anomalyLevel) return;

    const todayKey = new Date().toISOString().slice(0, 10);
    const alertStamp = window.localStorage.getItem(ANOMALY_ALERT_KEY);
    if (alertStamp === todayKey) return;

    const alertText = `Alert: vedo ${snapshot.blockedOrders} ordini bloccati e ${snapshot.lateShipments} ritardi spedizione. Priorita alta su ordini e logistica.`;
    setLastResponse(alertText);
    say(alertText);
    window.localStorage.setItem(ANOMALY_ALERT_KEY, todayKey);
  }, [isOpen, say, snapshot.blockedOrders, snapshot.lateShipments, snapshot.urgentOrders]);

  useEffect(() => {
    /**
     * handleEsc: descrive il comportamento principale di questa funzione.
     * @param e Input richiesto dalla funzione.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    recognizerRef.current = createVoiceRecognizer({
      lang: "it-IT",
      onResult: ({ transcript, isFinal }) => {
        setLiveTranscript(transcript);
        lastTranscriptRef.current = transcript;
        if (isFinal) {
          processedTranscriptRef.current = transcript;
          setMessage(transcript);
          runAssistant(transcript);
        }
      },
      onStart: () => {
        setVoiceHint("Ti ascolto...");
        setIsListening(true);
      },
      onEnd: () => {
        setIsListening(false);
        const candidate = lastTranscriptRef.current.trim();
        if (candidate && processedTranscriptRef.current !== candidate) {
          processedTranscriptRef.current = candidate;
          setMessage(candidate);
          runAssistant(candidate);
        }
      },
      onError: (error) => {
        setVoiceHint(`Voice unavailable: ${error}`);
        setIsListening(false);
      },
    });

    return () => {
      recognizerRef.current?.destroy();
      recognizerRef.current = null;
    };
  }, [isOpen, runAssistant]);

  useEffect(() => {
    /**
     * refreshHistory: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const refreshHistory = () => setHistoryEntries(loadAssistantHistory());
    window.addEventListener(HISTORY_UPDATED_EVENT, refreshHistory);
    void syncAssistantHistory(20);
    void syncAssistantTasks(50);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, refreshHistory);
  }, []);

  if (!isOpen) return null;

  /**
   * handleSubmit: descrive il comportamento principale di questa funzione.
   * @param e Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    runAssistant(message);
    setMessage("");
  };

  /**
   * handleSuggestionClick: descrive il comportamento principale di questa funzione.
   * @param suggestion Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    runAssistant(suggestion);
  };

  /**
   * handleQuickAction: descrive il comportamento principale di questa funzione.
   * @param action Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleQuickAction = (action: string) => {
    navigate(action);
    onClose();
  };

  /**
   * handleExportBriefing: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleExportBriefing = async () => {
    const history = loadAssistantHistory();
    const latest = history[0];
    const content = [
      `Briefing esportato - ${new Date().toLocaleString("it-IT")}`,
      `Utente: ${userName}`,
      "",
      `Comando: ${latest?.command || "Briefing automatico"}`,
      `Risposta: ${latest?.response || lastResponse || "Nessun briefing disponibile."}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(content);
      setVoiceHint("Briefing copiato negli appunti. Pronto per WhatsApp o email.");
    } catch {
      setVoiceHint("Non riesco a copiare ora. Riprova tra un attimo.");
    }
  };

  /**
   * runDemoMode: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const runDemoMode = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    demoModeRef.current = true;
    setVoiceHint("Demo mode attiva: eseguo una sequenza guidata.");
    try {
      for (const step of demoScript) {
        // eslint-disable-next-line no-await-in-loop
        await runAssistant(step);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => window.setTimeout(resolve, 900));
      }
      setVoiceHint("Demo mode completata.");
    } finally {
      demoModeRef.current = false;
      setIsDemoRunning(false);
    }
  };

  /**
   * toggleListening: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const toggleListening = () => {
    if (!recognizerRef.current?.supported) {
      setVoiceHint("Il browser non supporta il riconoscimento vocale. Usa il testo.");
      return;
    }

    if (isListening) {
      try {
        recognizerRef.current.stop();
        setVoiceHint("Ascolto fermato.");
      } catch {
        setVoiceHint("Non riesco a fermare il microfono in questo momento.");
      }
    } else {
      // STT deve poter partire anche senza voce TTS selezionata.
      // La selezione voce serve solo per la risposta parlata.
      if (!selectedVoiceId) {
        setShowVoicePicker(true);
        setVoiceHint("Microfono attivo. Nessuna voce selezionata: usero la voce browser predefinita per parlare.");
      }
      setLiveTranscript("");
      lastTranscriptRef.current = "";
      processedTranscriptRef.current = "";
      try {
        recognizerRef.current.start();
        setVoiceHint("Microfono attivo. Parla ora.");
      } catch {
        setVoiceHint("Microfono non disponibile ora, riprova tra un attimo.");
      }
    }
  };

  /**
   * handleSelectVoice: descrive il comportamento principale di questa funzione.
   * @param voiceId Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleSelectVoice = async (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    savePreferredVoice(voiceId);
    setShowVoicePicker(false);
    const chosen = voiceOptions.find((voice) => voice.id === voiceId);
    setVoiceHint(`Carico voce: ${chosen?.label || voiceId}`);
    const readiness = await prepareVoice(voiceId);
    if (!readiness.ready) {
      setVoiceHint("Voce non pronta, usero fallback browser.");
    } else if (readiness.provider === "piper") {
      setVoiceHint(`Voce impostata: ${chosen?.label || voiceId}`);
    } else {
      setVoiceHint("Voce browser impostata.");
    }
    if (readiness.message) {
      setVoiceHint(readiness.message);
    }
    say(`Perfetto. Da ora usero la voce ${chosen?.label || voiceId}.`);
  };

  /**
   * handlePreviewVoice: descrive il comportamento principale di questa funzione.
   * @param voiceId Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handlePreviewVoice = (voiceId: string) => {
    const chosen = voiceOptions.find((voice) => voice.id === voiceId);
    const previewLang = chosen?.lang || "it-IT";
    void speakText("Ciao, questa e una prova voce del tuo assistente.", {
      lang: previewLang,
      voiceId,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: (error) => {
        setIsSpeaking(false);
        setVoiceHint(error);
      },
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-[#e0e7ff] via-[#ddd6fe] to-[#e9d5ff] transition-opacity duration-500 overflow-y-auto overflow-x-hidden ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`fixed top-0 left-0 right-0 pt-6 pb-4 flex items-center justify-between px-6 md:px-8 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20 transition-all duration-700 ${
          isAnimating ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
        style={{ transitionDelay: "100ms" }}
      >
        <button
          onClick={onClose}
          className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/80 backdrop-blur-md shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_6px_20px_rgba(0,0,0,0.12)] flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Chiudi"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
        <div className="text-base md:text-lg font-semibold text-gray-800">Assistente AI</div>
        <div className="h-10 w-10 md:h-12 md:w-12" />
      </div>

      <div className="min-h-full w-full flex flex-col pt-20 md:pt-24 pb-8 px-4 md:px-6">
        <div className="m-auto w-full max-w-3xl flex flex-col items-center gap-6 md:gap-10">
          <div
            className={`transition-all duration-700 ease-out ${
              isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="p-2 md:p-10 flex flex-col items-center">
              <h2 className="hidden md:block text-2xl md:text-3xl font-bold text-gray-800 mb-2">Ciao, {userName}!</h2>
              <p className="text-gray-600 mb-4 md:mb-8 text-center text-sm md:text-base">
                {isListening ? "Ti ascolto..." : isSpeaking ? "Sto rispondendo..." : "Pronto ad aiutarti"}
              </p>

              <div className="relative mb-6 md:mb-8">
                <div className={`absolute inset-0 bg-gradient-to-b from-blue-400/30 to-transparent rounded-full blur-2xl md:blur-3xl ${isListening ? "animate-pulse" : ""}`} />
                <button
                  onClick={toggleListening}
                  className={`group relative h-32 w-32 md:h-56 md:w-56 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening
                      ? "scale-110 shadow-[0_0_100px_rgba(59,130,246,0.8)]"
                      : "scale-100 shadow-[0_0_60px_rgba(59,130,246,0.4)] hover:shadow-[0_0_80px_rgba(59,130,246,0.6)] hover:-translate-y-1"
                  } active:!scale-95 active:!translate-y-2 active:!shadow-[0_0_30px_rgba(59,130,246,0.9)]`}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#1e3a8a] via-[#3b82f6] to-[#67e8f9] shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.4),inset_20px_20px_40px_rgba(255,255,255,0.6)] transition-all duration-300 overflow-hidden">
                    <div className={`absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0%,rgba(255,255,255,0.4)_25%,transparent_50%,rgba(96,165,250,0.6)_75%,transparent_100%)] blur-2xl mix-blend-overlay transition-all duration-300 ${isListening ? "animate-[spin_4s_linear_infinite]" : "animate-[spin_8s_linear_infinite]"}`} />
                  </div>
                  <div className="absolute top-[5%] left-[15%] w-[70%] h-[35%] rounded-[100%] bg-gradient-to-b from-white/70 to-transparent rotate-[-15deg] blur-[2px] pointer-events-none opacity-80" />
                  <Sparkles className="relative z-10 h-10 w-10 md:h-20 md:w-20 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 w-full max-w-2xl mt-2 md:mt-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.action)}
                    className="bg-white/60 backdrop-blur-md rounded-[1.5rem] md:rounded-3xl shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_6px_16px_rgba(0,0,0,0.1)] p-3 md:p-4 flex flex-col items-center gap-1 md:gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <span className="text-2xl md:text-3xl">{action.icon}</span>
                    <span className="text-xs md:text-sm font-medium text-gray-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`transition-all duration-700 ease-out w-full ${
              isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
              {showVoicePicker && (
                <div className="w-full mb-4 rounded-2xl bg-white/80 border border-white/50 p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    Scegli la voce dell'assistente (gratis, open-source locale)
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    Google italiano e consigliata quando disponibile. Se non presente, usero automaticamente una voce italiana alternativa.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-auto pr-1">
                    {voiceOptions.map((voice) => (
                      <div
                        key={voice.id}
                        className={`rounded-xl border p-3 ${
                          selectedVoiceId === voice.id ? "border-primary bg-primary/5" : "border-border bg-white/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800">{voice.label}</p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                  voice.provider === "piper"
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {voice.provider === "piper" ? "Piper" : "Browser"}
                              </span>
                              {isRecommendedGoogleVoice(voice) && (
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  Consigliata
                                </span>
                              )}
                              {selectedVoiceId === voice.id && (
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-primary/15 text-primary border border-primary/30">
                                  Attiva
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">{voice.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewVoice(voice.id)}
                            >
                              Prova
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSelectVoice(voice.id)}
                            >
                              Usa
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {voiceOptions.length === 0 && (
                      <p className="text-sm text-gray-700">
                        Nessuna voce aggiuntiva rilevata. Usero la voce predefinita del browser.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-nowrap md:flex-wrap justify-start md:justify-center overflow-x-auto w-[calc(100vw-2rem)] md:w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 md:gap-3 mb-6 md:mb-8 pb-2 px-1 snap-x">
                {suggestedPrompts.slice(0, 5).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="flex-shrink-0 snap-center bg-white/40 backdrop-blur-md rounded-full shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.06)] hover:bg-white/60 px-4 md:px-5 py-2 text-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="text-gray-700 font-medium text-xs md:text-sm whitespace-nowrap">{prompt}</span>
                  </button>
                ))}
              </div>

              <div className="w-full mb-4 rounded-2xl bg-white/60 border border-white/40 p-4 text-sm text-gray-700 space-y-1">
                {voiceHint && <p className="font-medium text-primary">{voiceHint}</p>}
                {liveTranscript && (
                  <p>
                    <span className="font-semibold">Hai detto:</span> {liveTranscript}
                  </p>
                )}
                {lastResponse && (
                  <p>
                    <span className="font-semibold">Assistente:</span> {lastResponse}
                  </p>
                )}
                {historyEntries.length > 0 && (
                  <div className="mt-3 border-t border-white/50 pt-2">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Cronologia recente</p>
                    <ul className="space-y-1 text-xs text-gray-600 max-h-20 overflow-auto">
                      {historyEntries.slice(0, 3).map((item) => (
                        <li key={item.id} className="truncate">
                          {item.command}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {actionButtons.length > 0 && (
                <div className="w-full mb-4 flex flex-wrap gap-2">
                  {actionButtons.map((action, index) => (
                    <Button
                      key={`${action.label}-${action.route}-${index}`}
                      type="button"
                      size="sm"
                      variant={index === 0 ? "default" : "outline"}
                      onClick={() => navigateFromPending(action.route, action.query)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative flex items-center gap-2 p-1.5 md:p-2 rounded-full bg-white/80 backdrop-blur-md shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_8px_32px_rgba(0,0,0,0.12)]">
                  <Input
                    type="text"
                    placeholder="Chiedimi qualsiasi cosa..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 border-0 bg-transparent text-gray-800 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-lg px-4 md:px-6 py-3 md:py-4 h-auto"
                  />
                  <button
                    type="submit"
                    className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_4px_12px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.5)] flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
                  >
                    <Send className="h-4 w-4 md:h-6 md:w-6 text-white ml-0.5 md:ml-1" />
                  </button>
                </div>
              </form>

              <p className="text-sm text-gray-600 text-center mt-6">
                Premi <kbd className="px-2 py-1 rounded-lg bg-white/40 backdrop-blur-sm text-gray-700 font-mono shadow-[inset_0_1px_4px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.05)] text-xs">ESC</kbd> per chiudere
              </p>

              <Button
                type="button"
                variant="ghost"
                onClick={toggleListening}
                className="mt-3 text-sm text-gray-700"
              >
                <Mic className="mr-2 h-4 w-4" />
                {isListening ? "Ferma ascolto" : "Attiva microfono"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="mt-2 flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={handleExportBriefing}>
                  Esporta briefing
                </Button>
                <Button type="button" size="sm" onClick={runDemoMode} disabled={isDemoRunning}>
                  {isDemoRunning ? "Demo in corso..." : "Demo mode"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
