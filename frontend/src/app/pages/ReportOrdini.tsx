/**
 * File Overview: ReportOrdini.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { getOrdersReport, type OrdersReportResponse, type ReportPeriod } from "../api/reports";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

const STATUS_COLORS = [
  "var(--color-success)",
  "var(--color-info)",
  "var(--color-warning)",
  "var(--color-destructive)",
  "var(--color-primary)",
  "var(--color-accent-purple)"
];

const periodLabel: Record<ReportPeriod, string> = {
  day: "Oggi",
  week: "Settimana corrente",
  month: "Mese corrente"
};

/**
 * formatEuro: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatEuro(value: number): string {
  return `EUR ${value.toLocaleString("it-IT", { maximumFractionDigits: 2 })}`;
}

/**
 * escapeCsv: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function escapeCsv(value: string | number): string {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

/**
 * ReportOrdini: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ReportOrdini() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [report, setReport] = useState<OrdersReportResponse | null>(null);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");
  const [state, setState] = useState<RemoteState>("idle");
  const backendReady = source === "backend" && state === "ready" && Boolean(report);

  useEffect(() => {
    let active = true;
    /**
     * fetchReport: descrive il comportamento principale di questa funzione.
     * @param targetPeriod Input richiesto dalla funzione.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const fetchReport = (targetPeriod: ReportPeriod) => {
      setState("loading");
      getOrdersReport(targetPeriod)
        .then((response) => {
          if (!active) return;
          setReport(response);
          setSource("backend");
          setState("ready");
        })
        .catch((error) => {
          if (!active) return;
          setReport(null);
          setSource("fallback");
          const status = getApiStatusFromError(error);
          setState(status === 403 ? "forbidden" : "error");
        });
    };

    /**
     * runFetchIfTokenAvailable: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const runFetchIfTokenAvailable = () => {
      const hasToken =
        typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
      if (!hasToken) {
        setState("idle");
        return;
      }
      fetchReport(period);
    };

    runFetchIfTokenAvailable();

    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => runFetchIfTokenAvailable();

    window.addEventListener("authSessionReady", onAuthReady);
    return () => {
      active = false;
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, [period]);

  const chartByStatus = useMemo(
    () =>
      (report?.byStatus ?? []).map((item, index) => ({
        nome: item.name,
        valore: item.value,
        color: STATUS_COLORS[index % STATUS_COLORS.length]
      })),
    [report]
  );

  /**
   * handleExportCsv: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleExportCsv = () => {
    if (!report) return;
    const header = ["tipo", "etichetta", "valore_1", "valore_2"];
    const summaryRows = [
      ["summary", "ordini_totali", report.summary.totalOrders, ""],
      ["summary", "ordini_completati", report.summary.completedOrders, ""],
      ["summary", "ordini_bloccati", report.summary.blockedOrders, ""],
      ["summary", "ordini_in_attesa", report.summary.pendingOrders, ""],
      ["summary", "valore_totale", report.summary.totalValue, ""],
    ];
    const seriesRows = report.series.map((item) => ["trend", item.label, item.orders, item.totalValue]);
    const statusRows = report.byStatus.map((item) => ["status", item.name, item.value, ""]);
    const rows = [...summaryRows, ...seriesRows, ...statusRows];
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-ordini-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Report Ordini</h1>
          <p className="text-muted-foreground mt-1">Analisi e statistiche ordini</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={source === "backend" ? "default" : "secondary"}>
            {source === "backend" ? "Dati backend" : "Fallback"}
          </Badge>
          <Button
            size="lg"
            className="shadow-lg shadow-primary/20"
            disabled={!report || state === "loading"}
            onClick={handleExportCsv}
          >
            <Download className="mr-2 h-5 w-5" />
            Esporta Report
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Periodo</label>
              <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Oggi</SelectItem>
                  <SelectItem value="week">Settimana corrente</SelectItem>
                  <SelectItem value="month">Mese corrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 grid gap-3 md:grid-cols-3">
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Ordini totali</p>
                  <p className="text-2xl font-semibold">{backendReady ? report?.summary.totalOrders ?? 0 : "N/D"}</p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Ordini completati</p>
                  <p className="text-2xl font-semibold">{backendReady ? report?.summary.completedOrders ?? 0 : "N/D"}</p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Valore periodo</p>
                  <p className="text-2xl font-semibold">{backendReady ? formatEuro(report?.summary.totalValue ?? 0) : "N/D"}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <RemoteDataState
        state={state}
        empty={state === "ready" && !report}
        loadingMessage="Caricamento report ordini..."
        emptyMessage="Nessun dato report disponibile."
        errorMessage="Errore caricamento report ordini."
        forbiddenMessage="Non hai i permessi per consultare i report ordini."
        onRetry={() => {
          const hasToken =
            typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
          if (!hasToken) return;
          setState("loading");
          getOrdersReport(period)
            .then((response) => {
              setReport(response);
              setSource("backend");
              setState("ready");
            })
            .catch((error) => {
              setReport(null);
              setSource("fallback");
              const status = getApiStatusFromError(error);
              setState(status === 403 ? "forbidden" : "error");
            });
        }}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Trend ordini ({periodLabel[period]})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state === "loading" ? (
              <p className="text-sm text-muted-foreground">Caricamento report ordini...</p>
            ) : (report?.series.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report?.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="orders" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun dato disponibile per il periodo selezionato.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuzione per stato evasione</CardTitle>
          </CardHeader>
          <CardContent>
            {state === "loading" ? (
              <p className="text-sm text-muted-foreground">Caricamento distribuzione stati...</p>
            ) : chartByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartByStatus} dataKey="valore" nameKey="nome" cx="50%" cy="50%" outerRadius={100} label>
                    {chartByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun dato disponibile per gli stati ordine.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
