/**
 * File Overview: ReportAcquisti.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { Download, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { DataTable, Column } from "../components/shared/DataTable";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { getPurchasesSummary, type PurchasesSummaryResponse } from "../api/reports";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

type AcquistoRow = {
  gruppo: string;
  voci: number;
  totale: string;
  media: string;
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
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

/**
 * ReportAcquisti: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ReportAcquisti() {
  const [source, setSource] = useState<"backend" | "fallback">("fallback");
  const [state, setState] = useState<RemoteState>("idle");
  const [report, setReport] = useState<PurchasesSummaryResponse | null>(null);

  /**
   * fetchSummary: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchSummary = () => {
    setState("loading");
    getPurchasesSummary()
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
  };

  useEffect(() => {
    let active = true;
    /**
     * runFetchIfTokenAvailable: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const runFetchIfTokenAvailable = () => {
      if (!active) return;
      const hasToken =
        typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
      if (!hasToken) {
        setState("idle");
        return;
      }
      fetchSummary();
    };

    runFetchIfTokenAvailable();
    window.addEventListener("authSessionReady", runFetchIfTokenAvailable);
    return () => {
      active = false;
      window.removeEventListener("authSessionReady", runFetchIfTokenAvailable);
    };
  }, []);

  const rows = useMemo<AcquistoRow[]>(
    () =>
      (report?.rows ?? []).map((row) => ({
        gruppo: row.group,
        voci: row.entries,
        totale: formatEuro(row.totalCost),
        media: formatEuro(row.averageCost),
      })),
    [report]
  );

  const columns: Column<AcquistoRow>[] = [
    { key: "gruppo", label: "Gruppo", sortable: true },
    { key: "voci", label: "N� Voci", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "totale", label: "Costo Totale", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "media", label: "Costo Medio", sortable: true },
  ];

  /**
   * handleExportCsv: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleExportCsv = () => {
    if (!rows.length) return;
    const header = ["gruppo", "voci", "totale", "media"];
    const csv = [header, ...rows.map((row) => [row.gruppo, row.voci, row.totale, row.media])]
      .map((line) => line.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-acquisti-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Report Acquisti</h1>
            <Badge variant={source === "backend" ? "default" : "secondary"}>
              {source === "backend" ? "Dati backend" : "Fallback"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Analisi costi acquisto da catalogo tecnico reale</p>
        </div>
        <Button size="lg" onClick={handleExportCsv} disabled={!rows.length || state === "loading"}>
          <Download className="mr-2 h-5 w-5" />
          Esporta
        </Button>
      </div>

      <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            I movimenti passivi reali fornitore-per-documento non sono ancora disponibili. Questa vista usa dati backend reali
            `tech.*` (costi catalogo e regole di processo).
          </div>
        </div>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && rows.length === 0}
        loadingMessage="Carico il report acquisti dal backend..."
        emptyMessage="Nessun dato acquisti disponibile."
        errorMessage="Errore nel caricamento report acquisti."
        forbiddenMessage="Il tuo ruolo non puo consultare il report acquisti."
        onRetry={fetchSummary}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Voci catalogo</p>
            <p className="text-2xl font-semibold">{report?.summary.catalogEntries ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Costo totale catalogo</p>
            <p className="text-2xl font-semibold">{formatEuro(report?.summary.catalogCostTotal ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Costo medio</p>
            <p className="text-2xl font-semibold">{formatEuro(report?.summary.catalogCostAverage ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Regola processo (L+T+E)</p>
            <p className="text-2xl font-semibold">
              {formatEuro((report?.processCostRule.labor ?? 0) + (report?.processCostRule.transport ?? 0) + (report?.processCostRule.label ?? 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="Acquisti per Gruppo"
        description={source === "backend" ? "Dati reali da tabelle tecniche backend" : "Backend non disponibile"}
        data={rows}
        columns={columns}
      />
    </div>
  );
}
