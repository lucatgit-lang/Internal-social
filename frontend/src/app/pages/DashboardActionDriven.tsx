/**
 * File Overview: DashboardActionDriven.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { PriorityBar } from "../components/dashboard/PriorityBar";
import { QuickActionCenter } from "../components/dashboard/QuickActionCenter";
import { TaskList } from "../components/dashboard/TaskList";
import { ActionableKPIs } from "../components/dashboard/ActionableKPIs";
import { OperationalHealthCard } from "../components/dashboard/OperationalHealthCard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { InfoTooltip } from "../components/ui/info-tooltip";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";
import type { AssistantFocus, OperationalSnapshot } from "../assistant/types";
import { getDashboardPrioritySnapshot, getDashboardSummary, type DashboardSummaryResponse } from "../api/dashboard";
import { getOrdersReport, type OrdersReportResponse } from "../api/reports";

const EMPTY_SNAPSHOT: OperationalSnapshot = {
  blockedOrders: 0,
  urgentOrders: 0,
  productionToStart: 0,
  lateShipments: 0,
  topIssues: [],
};

/**
 * DashboardActionDriven: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function DashboardActionDriven() {
  const [searchParams] = useSearchParams();
  const assistFocus = searchParams.get("assistFocus") as AssistantFocus | null;
  const [snapshot, setSnapshot] = useState<OperationalSnapshot>(EMPTY_SNAPSHOT);
  const [snapshotSource, setSnapshotSource] = useState<"backend" | "fallback">("fallback");
  const [snapshotState, setSnapshotState] = useState<RemoteState>("idle");
  const [ordersReport, setOrdersReport] = useState<OrdersReportResponse | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryResponse | null>(null);
  const today = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  useEffect(() => {
    let active = true;
    const hasAccessToken =
      typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
    /**
     * fetchRemoteSnapshot: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const fetchRemoteSnapshot = async () => {
      setSnapshotState("loading");
      const [snapshotResult, weekReportResult, monthReportResult, summaryResult] = await Promise.allSettled([
        getDashboardPrioritySnapshot(),
        getOrdersReport("week"),
        getOrdersReport("month"),
        getDashboardSummary(),
      ]);
      if (!active) return;

      const snapshotOk = snapshotResult.status === "fulfilled";
      const summaryOk = summaryResult.status === "fulfilled";
      const monthOk = monthReportResult.status === "fulfilled";
      const weekOk = weekReportResult.status === "fulfilled";

      setSnapshot(snapshotOk ? snapshotResult.value : EMPTY_SNAPSHOT);
      setDashboardSummary(summaryOk ? summaryResult.value : null);
      setOrdersReport(
        monthOk
          ? {
              ...monthReportResult.value,
              series: weekOk ? weekReportResult.value.series : monthReportResult.value.series,
            }
          : null
      );

      if (snapshotOk || summaryOk || monthOk || weekOk) {
        setSnapshotSource("backend");
        setSnapshotState("ready");
        return;
      }

      setSnapshotSource("fallback");
      const firstError =
        snapshotResult.status === "rejected"
          ? snapshotResult.reason
          : summaryResult.status === "rejected"
            ? summaryResult.reason
            : monthReportResult.status === "rejected"
              ? monthReportResult.reason
              : weekReportResult.status === "rejected"
                ? weekReportResult.reason
                : null;
      const status = getApiStatusFromError(firstError);
      setSnapshotState(status === 403 ? "forbidden" : "error");
    };

    if (hasAccessToken) {
      void fetchRemoteSnapshot();
    } else {
      setSnapshot(EMPTY_SNAPSHOT);
      setOrdersReport(null);
      setDashboardSummary(null);
      setSnapshotSource("fallback");
      setSnapshotState("idle");
    }
    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => {
      void fetchRemoteSnapshot();
    };
    window.addEventListener("authSessionReady", onAuthReady);

    return () => {
      active = false;
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, []);

  const chartData = useMemo(
    () =>
      (ordersReport?.series ?? []).map((item) => ({
        day: item.label,
        ordini: item.orders,
      })),
    [ordersReport]
  );
  const backendReady = snapshotSource === "backend" && snapshotState === "ready";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="capitalize">{today}</span>
          <Badge variant="secondary" className="ml-2">
            {snapshotSource === "backend" ? "Dati backend" : "Fallback"}
          </Badge>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Benvenuto, Admin Kemipol
            <InfoTooltip text="Questa e la tua Dashboard. Da qui vedi KPI automatizzati, flusso ordini e priorita." />
          </h1>
          <p className="text-muted-foreground mt-1">Ecco una panoramica delle tue attivita di oggi</p>
        </div>
      </div>

      <RemoteDataState
        state={snapshotState}
        empty={false}
        loadingMessage="Aggiorno priorita operative dal backend..."
        errorMessage="Impossibile aggiornare lo snapshot operativo dal backend."
        forbiddenMessage="Il tuo ruolo non puo leggere lo snapshot dashboard dal backend."
        onRetry={() => {
          const hasAccessTokenNow =
            typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
          if (!hasAccessTokenNow) {
            setSnapshot(EMPTY_SNAPSHOT);
            setOrdersReport(null);
            setDashboardSummary(null);
            setSnapshotSource("fallback");
            setSnapshotState("idle");
            return;
          }
          setSnapshotState("loading");
          void (async () => {
            const [snapshotResult, weekReportResult, monthReportResult, summaryResult] = await Promise.allSettled([
              getDashboardPrioritySnapshot(),
              getOrdersReport("week"),
              getOrdersReport("month"),
              getDashboardSummary(),
            ]);

            const snapshotOk = snapshotResult.status === "fulfilled";
            const summaryOk = summaryResult.status === "fulfilled";
            const monthOk = monthReportResult.status === "fulfilled";
            const weekOk = weekReportResult.status === "fulfilled";

            setSnapshot(snapshotOk ? snapshotResult.value : EMPTY_SNAPSHOT);
            setDashboardSummary(summaryOk ? summaryResult.value : null);
            setOrdersReport(
              monthOk
                ? {
                    ...monthReportResult.value,
                    series: weekOk ? weekReportResult.value.series : monthReportResult.value.series,
                  }
                : null
            );

            if (snapshotOk || summaryOk || monthOk || weekOk) {
              setSnapshotSource("backend");
              setSnapshotState("ready");
              return;
            }

            setSnapshotSource("fallback");
            const firstError =
              snapshotResult.status === "rejected"
                ? snapshotResult.reason
                : summaryResult.status === "rejected"
                  ? summaryResult.reason
                  : monthReportResult.status === "rejected"
                    ? monthReportResult.reason
                    : weekReportResult.status === "rejected"
                      ? weekReportResult.reason
                      : null;
            const status = getApiStatusFromError(firstError);
            setSnapshotState(status === 403 ? "forbidden" : "error");
          })();
        }}
      />

      <PriorityBar highlightKey={assistFocus} snapshot={snapshot} />
      <OperationalHealthCard snapshot={snapshot} />

      <QuickActionCenter summary={dashboardSummary} backendReady={backendReady} />
      <ActionableKPIs
        snapshot={snapshot}
        monthlySummary={ordersReport?.summary}
        backendReady={backendReady}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TaskList snapshot={snapshot} />
        </div>

        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Attivita Settimanale
                </CardTitle>
                <Badge variant="outline">Questa settimana</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis key="xaxis" dataKey="day" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis key="yaxis" className="text-xs" tickLine={false} axisLine={false} />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar key="bar-ordini" dataKey="ordini" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Ordini ricevuti (settimana)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
