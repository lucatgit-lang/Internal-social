/**
 * File Overview: PriorityBar.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { CalendarDays, ListTodo, Sparkles, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { dashboardPriorityItems, type PriorityItem } from "../../data/dashboard-priority";
import { loadAssistantTasks, syncAssistantTasks, TASKS_UPDATED_EVENT } from "../../assistant/aiTasks";
import type { OperationalSnapshot } from "../../assistant/types";

interface PriorityBarProps {
  highlightKey?: PriorityItem["key"] | null;
  snapshot?: OperationalSnapshot;
}

const AI_BLOCK_MODE_KEY = "assistant_ai_block_mode_v1";
type AiBlockMode = "block2" | "block3";

/**
 * isTodayLabel: descrive il comportamento principale di questa funzione.
 * @param label Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function isTodayLabel(label: string): boolean {
  const value = label.toLowerCase();
  return value.includes("oggi") || value.includes("stasera");
}

/**
 * resolveRouteFromIssue: descrive il comportamento principale di questa funzione.
 * @param issue Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function resolveRouteFromIssue(issue: string): string {
  const value = issue.toLowerCase();
  if (value.includes("sped") || value.includes("ritardo")) return "/allestimento";
  if (value.includes("prd") || value.includes("produz")) return "/produzione";
  if (value.includes("ord")) return "/ordini";
  return "/";
}

/**
 * PriorityBar: descrive il comportamento principale di questa funzione.
 * @param highlightKey Input richiesto dalla funzione.
 * @param snapshot Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function PriorityBar({ highlightKey, snapshot }: PriorityBarProps) {
  const navigate = useNavigate();
  const [assistantTasks, setAssistantTasks] = useState(() => loadAssistantTasks());
  const [aiBlockMode, setAiBlockMode] = useState<AiBlockMode>(() => {
    if (typeof window === "undefined") return "block2";
    const value = window.localStorage.getItem(AI_BLOCK_MODE_KEY);
    return value === "block3" ? "block3" : "block2";
  });

  useEffect(() => {
    void syncAssistantTasks(50);
    /**
     * refresh: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const refresh = () => setAssistantTasks(loadAssistantTasks());
    window.addEventListener(TASKS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(TASKS_UPDATED_EVENT, refresh);
  }, []);

  const resolvedPriorityItems = useMemo(() => {
    if (!snapshot) return dashboardPriorityItems;
    return dashboardPriorityItems.map((item) => {
      if (item.key === "blocked") return { ...item, count: snapshot.blockedOrders };
      if (item.key === "urgent") return { ...item, count: snapshot.urgentOrders };
      if (item.key === "production") return { ...item, count: snapshot.productionToStart };
      if (item.key === "late") return { ...item, count: snapshot.lateShipments };
      return item;
    });
  }, [snapshot]);

  const totalTasks = useMemo(
    () => resolvedPriorityItems.reduce((acc, item) => acc + item.count, 0),
    [resolvedPriorityItems]
  );

  const dailyTasks = useMemo(
    () => {
      if (snapshot && snapshot.topIssues.length > 0) {
        return snapshot.topIssues.slice(0, 4);
      }
      if (snapshot) {
        return [
          `${snapshot.blockedOrders} ordini bloccati`,
          `${snapshot.urgentOrders} ordini urgenti da processare`,
          `${snapshot.productionToStart} produzioni da avviare`,
          `${snapshot.lateShipments} spedizioni in ritardo`,
        ].filter((item) => !item.startsWith("0 "));
      }
      return resolvedPriorityItems
        .flatMap((item) => item.tasks)
        .filter((task) => isTodayLabel(task) || task.includes("ORD-") || task.includes("SPED-"))
        .slice(0, 4);
    },
    [resolvedPriorityItems, snapshot]
  );

  const priorityTasks = useMemo(() => {
    const aiItems = assistantTasks.slice(0, 2).map((task) => ({
      text: task.title,
      route: task.route,
      fromAI: true,
    }));

    const baseItems = snapshot
      ? (
          snapshot.topIssues.length > 0
            ? snapshot.topIssues.slice(0, 5).map((issue) => ({
                text: issue,
                route: resolveRouteFromIssue(issue),
                fromAI: false,
              }))
            : [
                { text: `${snapshot.blockedOrders} ordini bloccati`, route: "/ordini", fromAI: false },
                { text: `${snapshot.urgentOrders} ordini urgenti`, route: "/ordini", fromAI: false },
                { text: `${snapshot.productionToStart} produzioni da avviare`, route: "/produzione", fromAI: false },
                { text: `${snapshot.lateShipments} spedizioni in ritardo`, route: "/allestimento", fromAI: false },
              ].filter((item) => !item.text.startsWith("0 "))
        )
      : resolvedPriorityItems
          .flatMap((item) => item.tasks.map((task) => ({ text: task, route: item.route, fromAI: false })))
          .slice(0, 3);

    if (aiBlockMode === "block3") {
      return baseItems.slice(0, 5);
    }

    return [...aiItems, ...baseItems].slice(0, 5);
  }, [assistantTasks, aiBlockMode, resolvedPriorityItems, snapshot]);

  const assistantTasksForBlock3 = useMemo(() => assistantTasks.slice(0, 3), [assistantTasks]);

  /**
   * toggleAiBlockMode: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const toggleAiBlockMode = () => {
    const nextMode: AiBlockMode = aiBlockMode === "block3" ? "block2" : "block3";
    setAiBlockMode(nextMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AI_BLOCK_MODE_KEY, nextMode);
    }
  };

  const calendarDate = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Azioni Prioritarie</h2>
        <Badge variant="outline" className="ml-auto">
          {totalTasks} task
        </Badge>
        {assistantTasks.length > 0 && (
          <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200">
            {assistantTasks.length} AI task
          </Badge>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 hover:shadow-lg transition-all">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-background/60 text-primary">
                <ListTodo className="h-5 w-5" />
              </div>
              <Badge className="rounded-full">{dailyTasks.length}</Badge>
            </div>
            <h3 className="font-semibold mb-2">Task giornalieri</h3>
            <ul className="space-y-1.5 mb-4 flex-1 text-[13px] text-muted-foreground/90 font-medium">
              {dailyTasks.map((task, idx) => (
                <li key={`${task}-${idx}`} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 opacity-60 bg-current" />
                  <span className="truncate leading-tight">{task}</span>
                </li>
              ))}
            </ul>
            <Button size="sm" onClick={() => navigate("/ordini")}>Apri task giornalieri</Button>
          </CardContent>
        </Card>

        <Card
          className={`border-l-4 border-warning/40 bg-gradient-to-br from-warning/15 to-warning/5 hover:shadow-lg transition-all ${
            highlightKey ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
        >
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-background/60 text-warning">
                <Zap className="h-5 w-5" />
              </div>
              <Badge className="rounded-full bg-warning text-warning-foreground">{priorityTasks.length}</Badge>
            </div>
            <h3 className="font-semibold mb-2">Task prioritari</h3>
            <ul className="space-y-1.5 mb-4 flex-1 text-[13px] text-muted-foreground/90 font-medium">
              {priorityTasks.map((task, idx) => (
                <li
                  key={`${task.text}-${idx}`}
                  className="flex items-start gap-1.5 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => navigate(task.route)}
                >
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 opacity-60 bg-current" />
                  <span className="truncate leading-tight">{task.text}</span>
                  {task.fromAI && (
                    <Badge className="ml-1 bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] py-0 px-1.5">
                      AI
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
            <Button size="sm" className="bg-[#0066FF] hover:bg-[#0055FF] text-white" onClick={() => navigate("/")}>Vai ai prioritari</Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-indigo-300 bg-gradient-to-br from-indigo-100/70 to-indigo-50/40 hover:shadow-lg transition-all">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-background/60 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <Badge className="rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                {aiBlockMode === "block3" ? assistantTasksForBlock3.length : 0}
              </Badge>
            </div>
            <h3 className="font-semibold mb-2">Task creati da AI</h3>
            {aiBlockMode === "block3" ? (
              <div className="mb-4 flex-1 space-y-2">
                {assistantTasksForBlock3.length > 0 ? (
                  assistantTasksForBlock3.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-indigo-200 bg-white/80 p-2"
                    >
                      <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-600">{task.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-indigo-300 bg-white/60 p-3 text-[13px] text-muted-foreground">
                    Nessun task AI creato al momento.
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 flex-1 rounded-lg border border-dashed border-indigo-300 bg-white/60 p-3 text-[13px] text-muted-foreground">
                Blocco pronto: attiva l'inserimento AI per popolare questa sezione.
              </div>
            )}
            <Button size="sm" variant="outline" onClick={toggleAiBlockMode}>
              {aiBlockMode === "block3" ? "Disattiva inserimento AI" : "Attiva inserimento AI"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-info/40 bg-gradient-to-br from-info/15 to-info/5 hover:shadow-lg transition-all">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-background/60 text-info">
                <CalendarDays className="h-5 w-5" />
              </div>
              <Badge className="rounded-full bg-info text-info-foreground">Oggi</Badge>
            </div>
            <h3 className="font-semibold mb-2">Calendario</h3>
            <div className="mb-4 flex-1 text-[13px] text-muted-foreground/90 font-medium">
              <p className="capitalize">{calendarDate}</p>
              <p className="mt-2">Finestra consigliata: 09:00 - 12:00 per task ad alta priorita.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/report/ordini")}>Apri calendario operativo <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
