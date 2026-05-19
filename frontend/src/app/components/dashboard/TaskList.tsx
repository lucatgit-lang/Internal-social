/**
 * File Overview: TaskList.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { CheckCircle2, Circle, Clock, ArrowRight, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { loadAssistantTasks, syncAssistantTasks, TASKS_UPDATED_EVENT, type DashboardTaskItem } from "../../assistant/aiTasks";
import type { OperationalSnapshot } from "../../assistant/types";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "done";
  dueDate: string;
  route: string;
  owner?: string;
  source?: "assistant";
}

interface TaskListProps {
  snapshot?: OperationalSnapshot;
}

/**
 * toTask: descrive il comportamento principale di questa funzione.
 * @param input Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function toTask(input: DashboardTaskItem): Task {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    priority: input.priority,
    status: input.status,
    dueDate: input.dueDate,
    route: input.route,
    owner: input.owner,
    source: input.source,
  };
}

/**
 * routeFromIssue: descrive il comportamento principale di questa funzione.
 * @param issue Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function routeFromIssue(issue: string): string {
  const value = issue.toLowerCase();
  if (value.includes("sped") || value.includes("ritardo")) return "/allestimento";
  if (value.includes("prd") || value.includes("produz")) return "/produzione";
  if (value.includes("ord")) return "/ordini";
  return "/";
}

/**
 * deriveSnapshotTasks: descrive il comportamento principale di questa funzione.
 * @param snapshot Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function deriveSnapshotTasks(snapshot?: OperationalSnapshot): Task[] {
  if (!snapshot) return [];

  const fromTopIssues = snapshot.topIssues.slice(0, 6).map((issue, index) => ({
    id: `ops-${index + 1}`,
    title: issue,
    description: "Task operativo generato dallo stato reale della dashboard",
    priority: index < 2 ? ("high" as const) : ("medium" as const),
    status: "pending" as const,
    dueDate: "Oggi",
    route: routeFromIssue(issue),
  }));

  if (fromTopIssues.length > 0) {
    return fromTopIssues;
  }

  const fallbackDerived: Task[] = [];
  if (snapshot.blockedOrders > 0) {
    fallbackDerived.push({
      id: "ops-blocked",
      title: `${snapshot.blockedOrders} ordini bloccati da sbloccare`,
      description: "Priorita alta: blocchi ordini impattano consegne e cassa.",
      priority: "high",
      status: "pending",
      dueDate: "Oggi",
      route: "/ordini",
    });
  }
  if (snapshot.urgentOrders > 0) {
    fallbackDerived.push({
      id: "ops-urgent",
      title: `${snapshot.urgentOrders} ordini urgenti da processare`,
      description: "Priorita operativa: ridurre ritardi sulle richieste urgenti.",
      priority: "high",
      status: "pending",
      dueDate: "Oggi",
      route: "/ordini",
    });
  }
  if (snapshot.productionToStart > 0) {
    fallbackDerived.push({
      id: "ops-production",
      title: `${snapshot.productionToStart} produzioni da avviare`,
      description: "Allineare produzione e spedizioni pianificate.",
      priority: "medium",
      status: "pending",
      dueDate: "Oggi",
      route: "/produzione",
    });
  }
  if (snapshot.lateShipments > 0) {
    fallbackDerived.push({
      id: "ops-late",
      title: `${snapshot.lateShipments} spedizioni in ritardo`,
      description: "Gestire ritardi logistici e riallineare la consegna.",
      priority: "high",
      status: "pending",
      dueDate: "Oggi",
      route: "/allestimento",
    });
  }

  return fallbackDerived;
}

const priorityConfig = {
  high: {
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Alta",
    icon: Flag,
  },
  medium: {
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Media",
    icon: Flag,
  },
  low: {
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    label: "Bassa",
    icon: Flag,
  },
};

const statusConfig = {
  pending: {
    label: "Da fare",
    color: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In corso",
    color: "bg-info text-info-foreground",
  },
  done: {
    label: "Completato",
    color: "bg-success text-success-foreground",
  },
};

/**
 * TaskList: descrive il comportamento principale di questa funzione.
 * @param snapshot Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function TaskList({ snapshot }: TaskListProps) {
  const [assistantTasks, setAssistantTasks] = useState<Task[]>(() => loadAssistantTasks().map(toTask));
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    void syncAssistantTasks(50);
    /**
     * refreshAssistantTasks: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const refreshAssistantTasks = () => {
      setAssistantTasks(loadAssistantTasks().map(toTask));
    };

    window.addEventListener(TASKS_UPDATED_EVENT, refreshAssistantTasks);
    return () => window.removeEventListener(TASKS_UPDATED_EVENT, refreshAssistantTasks);
  }, []);

  const tasks = useMemo(() => {
    const operationalTasks = deriveSnapshotTasks(snapshot);
    const merged = [...assistantTasks, ...operationalTasks];
    return merged.map((task) => ({
      ...task,
      status: completedTaskIds.has(task.id) ? ("done" as const) : task.status,
    }));
  }, [assistantTasks, completedTaskIds, snapshot]);

  /**
   * toggleTaskStatus: descrive il comportamento principale di questa funzione.
   * @param taskId Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const toggleTaskStatus = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const pendingTasks = tasks.filter((task) => task.status !== "done");
  const completedTasks = tasks.filter((task) => task.status === "done");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Le Tue Attivita</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pendingTasks.length} attive</Badge>
            <Badge className="bg-success text-success-foreground">{completedTasks.length} completate</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">Nessuna attivita in sospeso</p>
          </div>
        ) : (
          tasks.map((task) => {
            const priorityConf = priorityConfig[task.priority];
            const statusConf = statusConfig[task.status];
            const PriorityIcon = priorityConf.icon;

            return (
              <div
                key={task.id}
                className={`group flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${
                  task.status === "done"
                    ? "bg-success/5 border-success/20 opacity-60"
                    : "bg-card hover:bg-accent/5 border-border"
                }`}
              >
                <button onClick={() => toggleTaskStatus(task.id)} className="mt-0.5 flex-shrink-0">
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`font-semibold ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {task.source === "assistant" && (
                        <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200">Creato da AI</Badge>
                      )}
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${priorityConf.bg}`}>
                        <PriorityIcon className={`h-3 w-3 ${priorityConf.color}`} />
                        <span className={`text-xs font-medium ${priorityConf.color}`}>{priorityConf.label}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{task.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={statusConf.color}>
                        {statusConf.label}
                      </Badge>
                      {task.owner && (
                        <Badge variant="outline" className="text-[10px]">
                          Owner: {task.owner}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.dueDate}
                      </span>
                    </div>

                    {task.status !== "done" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(task.route)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Vai
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
