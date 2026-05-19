/**
 * File Overview: ProspettoDDT.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { DataTable, type Column } from "../components/shared/DataTable";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { getDdtReport, type DdtReportResponse, type ReportPeriod } from "../api/reports";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

interface DdtRow {
  id: string;
  numero: string;
  data: string;
  ordine: string;
  cliente: string;
  destinazione: string;
  stato: "emesso" | "in_transito" | "consegnato";
}

const statoConfig: Record<DdtRow["stato"], { label: string; color: string }> = {
  emesso: { label: "Emesso", color: "bg-info text-info-foreground" },
  in_transito: { label: "In Transito", color: "bg-warning text-warning-foreground" },
  consegnato: { label: "Consegnato", color: "bg-success text-success-foreground" }
};

/**
 * normalizeStatus: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeStatus(value: string | null): DdtRow["stato"] {
  const status = (value ?? "").toLowerCase();
  if (status.includes("deliver") || status.includes("complete") || status.includes("consegn")) {
    return "consegnato";
  }
  if (status.includes("transit") || status.includes("ship") || status.includes("sped")) {
    return "in_transito";
  }
  return "emesso";
}

/**
 * formatDate: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("it-IT");
}

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
 * ProspettoDDT: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ProspettoDDT() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [report, setReport] = useState<DdtReportResponse | null>(null);
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
    getDdtReport(targetPeriod)
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

  const ddtRows = useMemo<DdtRow[]>(
    () =>
      (report?.recent ?? []).map((item) => ({
        id: item.id,
        numero: item.numero ?? `DDT-${item.id.slice(0, 8).toUpperCase()}`,
        data: formatDate(item.data),
        ordine: item.ordine ?? "-",
        cliente: item.cliente ?? "Cliente non associato",
        destinazione: item.destinazione ?? "-",
        stato: normalizeStatus(item.stato)
      })),
    [report]
  );

  const columns: Column<DdtRow>[] = [
    {
      key: "numero",
      label: "Numero DDT",
      sortable: true,
      render: (v) => <span className="font-mono font-medium">{v}</span>
    },
    { key: "data", label: "Data", sortable: true },
    { key: "ordine", label: "Ordine", sortable: true },
    { key: "cliente", label: "Cliente", sortable: true },
    { key: "destinazione", label: "Destinazione", sortable: true },
    {
      key: "stato",
      label: "Stato",
      render: (v: DdtRow["stato"]) => <Badge className={statoConfig[v].color}>{statoConfig[v].label}</Badge>
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
    const header = ["id", "numero_ddt", "data", "ordine", "cliente", "destinazione", "stato"];
    const csvRows = ddtRows.map((row) => [
      row.id,
      row.numero,
      row.data,
      row.ordine,
      row.cliente,
      row.destinazione,
      statoConfig[row.stato].label,
    ]);
    const csv = [header, ...csvRows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospetto-ddt-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Prospetto DDT</h1>
          <p className="text-muted-foreground mt-1">Documenti di trasporto</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={backendReady ? "default" : "secondary"}>
            {backendReady
              ? report?.source === "backend_shipments_proxy"
                ? "Dati backend (proxy spedizioni)"
                : "Dati backend"
              : "Backend non disponibile"}
          </Badge>
          <Button size="lg" disabled={ddtRows.length === 0 || state === "loading"} onClick={handleExportCsv}>
            <Download className="mr-2 h-5 w-5" />
            Esporta
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
                <p className="text-sm text-muted-foreground">DDT totali</p>
                <p className="text-2xl font-semibold">{backendReady ? report?.summary.total ?? 0 : "N/D"}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Consegnati</p>
                <p className="text-2xl font-semibold">{backendReady ? report?.summary.delivered ?? 0 : "N/D"}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">In transito</p>
                <p className="text-2xl font-semibold">{backendReady ? report?.summary.inTransit ?? 0 : "N/D"}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <RemoteDataState
        state={state}
        empty={state === "ready" && ddtRows.length === 0}
        loadingMessage="Caricamento prospetto DDT..."
        emptyMessage="Nessun DDT disponibile per il periodo selezionato."
        errorMessage="Errore caricamento prospetto DDT."
        forbiddenMessage="Non hai i permessi per consultare i DDT."
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
            <p className="text-sm text-muted-foreground">Caricamento prospetto DDT...</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          title="Documenti di Trasporto"
          description="Elenco DDT del periodo selezionato"
          data={ddtRows}
          columns={columns}
          searchPlaceholder="Cerca per numero DDT, ordine o cliente..."
          rowActions={false}
          exportable={false}
        />
      )}
    </div>
  );
}
