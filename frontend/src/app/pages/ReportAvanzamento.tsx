/**
 * File Overview: ReportAvanzamento.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { DataTable, type Column } from "../components/shared/DataTable";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { getOperationsReport, type OperationsReportResponse, type ReportPeriod } from "../api/reports";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

interface AvanzamentoRow {
  id: string;
  ordine: string;
  cliente: string;
  fase: "Produzione" | "Spedizione";
  avanzamento: number;
  scadenza: string;
  stato: "in_tempo" | "ritardo";
}

const statoConfig: Record<AvanzamentoRow["stato"], { label: string; color: string }> = {
  in_tempo: { label: "In Tempo", color: "bg-success text-success-foreground" },
  ritardo: { label: "In Ritardo", color: "bg-destructive text-destructive-foreground" }
};

const periodOptions: Array<{ value: ReportPeriod; label: string }> = [
  { value: "day", label: "Oggi" },
  { value: "week", label: "Settimana corrente" },
  { value: "month", label: "Mese corrente" }
];

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
 * toDisplayDate: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function toDisplayDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("it-IT");
}

/**
 * progressFromProductionStatus: descrive il comportamento principale di questa funzione.
 * @param status Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function progressFromProductionStatus(status: string): number {
  const normalized = status.toLowerCase();
  if (normalized.includes("completed") || normalized.includes("done")) return 100;
  if (normalized.includes("running") || normalized.includes("progress")) return 65;
  return 25;
}

/**
 * progressFromShipmentStatus: descrive il comportamento principale di questa funzione.
 * @param status Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function progressFromShipmentStatus(status: string): number {
  const normalized = status.toLowerCase();
  if (normalized.includes("delivered") || normalized.includes("completed")) return 100;
  if (normalized.includes("shipped") || normalized.includes("transit")) return 75;
  return 35;
}

/**
 * ReportAvanzamento: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ReportAvanzamento() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [report, setReport] = useState<OperationsReportResponse | null>(null);
  const [state, setState] = useState<RemoteState>("idle");
  const backendReady = state === "ready" && Boolean(report);

  /**
   * fetchReport: descrive il comportamento principale di questa funzione.
   * @param targetPeriod Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchReport = (targetPeriod: ReportPeriod) => {
    setState("loading");
    getOperationsReport(targetPeriod)
      .then((response) => {
        setReport(response);
        setState("ready");
      })
      .catch((error) => {
        setReport(null);
        const status = getApiStatusFromError(error);
        setState(status === 403 ? "forbidden" : "error");
      });
  };

  useEffect(() => {
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
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, [period]);

  const rows = useMemo<AvanzamentoRow[]>(() => {
    const productionRows =
      report?.recentProductionJobs.map((item) => {
        const status = item.stato.toLowerCase();
        return {
          id: `prod-${item.id}`,
          ordine: item.ordine ?? "-",
          cliente: item.cliente ?? "Cliente non associato",
          fase: "Produzione" as const,
          avanzamento: progressFromProductionStatus(item.stato),
          scadenza: toDisplayDate(item.data),
          stato: status.includes("pending") ? "ritardo" : "in_tempo"
        };
      }) ?? [];

    const shipmentRows =
      report?.recentShipments.map((item) => {
        const status = item.stato.toLowerCase();
        return {
          id: `ship-${item.id}`,
          ordine: item.ordine ?? "-",
          cliente: item.cliente ?? "Cliente non associato",
          fase: "Spedizione" as const,
          avanzamento: progressFromShipmentStatus(item.stato),
          scadenza: toDisplayDate(item.data),
          stato: status.includes("late") ? "ritardo" : "in_tempo"
        };
      }) ?? [];

    return [...productionRows, ...shipmentRows];
  }, [report]);

  const columns: Column<AvanzamentoRow>[] = [
    {
      key: "ordine",
      label: "Ordine",
      sortable: true,
      render: (v) => <span className="font-mono font-medium">{v}</span>
    },
    { key: "cliente", label: "Cliente", sortable: true },
    { key: "fase", label: "Fase", sortable: true },
    {
      key: "avanzamento",
      label: "Avanzamento",
      render: (v) => (
        <div className="flex items-center gap-2">
          <Progress value={v as number} className="w-20 h-2" />
          <span className="text-sm font-medium">{v}%</span>
        </div>
      )
    },
    { key: "scadenza", label: "Scadenza", sortable: true },
    {
      key: "stato",
      label: "Stato",
      render: (v: AvanzamentoRow["stato"]) => <Badge className={statoConfig[v].color}>{statoConfig[v].label}</Badge>
    }
  ];

  /**
   * handleExportCsv: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleExportCsv = () => {
    const header = ["id", "ordine", "cliente", "fase", "avanzamento_percent", "scadenza", "stato"];
    const csvRows = rows.map((row) => [
      row.id,
      row.ordine,
      row.cliente,
      row.fase,
      row.avanzamento,
      row.scadenza,
      statoConfig[row.stato].label,
    ]);
    const csv = [header, ...csvRows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-avanzamento-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Report Avanzamento</h1>
          <p className="text-muted-foreground mt-1">Stato avanzamento ordini in produzione e spedizione</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={backendReady ? "default" : "secondary"}>
            {backendReady
              ? report?.source === "backend_shipments_proxy"
                ? "Dati backend (proxy spedizioni)"
                : "Dati backend"
              : "Backend non disponibile"}
          </Badge>
          <Button size="lg" disabled={rows.length === 0 || state === "loading"} onClick={handleExportCsv}>
            <Download className="mr-2 h-5 w-5" />
            Esporta
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Periodo</label>
              <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Jobs in attesa</p>
                <p className="text-2xl font-semibold">{backendReady ? report?.production.pending ?? 0 : "N/D"}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Jobs in corso</p>
                <p className="text-2xl font-semibold">{backendReady ? report?.production.running ?? 0 : "N/D"}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Spedizioni totali</p>
                <p className="text-2xl font-semibold">{backendReady ? report?.shipments.total ?? 0 : "N/D"}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Spedizioni in ritardo</p>
                <p className="text-2xl font-semibold">{backendReady ? report?.shipments.late ?? 0 : "N/D"}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <RemoteDataState
        state={state}
        empty={state === "ready" && rows.length === 0}
        loadingMessage="Caricamento report avanzamento..."
        emptyMessage="Nessun dato operativo disponibile per il periodo selezionato."
        errorMessage="Errore caricamento report avanzamento."
        forbiddenMessage="Non hai i permessi per consultare il report avanzamento."
        onRetry={() => {
          const hasToken =
            typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
          if (!hasToken) return;
          fetchReport(period);
        }}
      />

      {state === "loading" ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Caricamento report avanzamento...</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Cerca per ordine o cliente..."
          rowActions={false}
          exportable={false}
        />
      )}
    </div>
  );
}
