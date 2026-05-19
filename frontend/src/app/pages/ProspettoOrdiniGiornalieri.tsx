/**
 * File Overview: ProspettoOrdiniGiornalieri.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { DataTable, Column } from "../components/shared/DataTable";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { getOrdersDailyOverview, type OrdersDailyOverviewResponse } from "../api/reports";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

type DailyRow = {
  data: string;
  ordini: number;
  clienti: number;
  fatturato: string;
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
 * ProspettoOrdiniGiornalieri: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ProspettoOrdiniGiornalieri() {
  const [source, setSource] = useState<"backend" | "fallback">("fallback");
  const [state, setState] = useState<RemoteState>("idle");
  const [report, setReport] = useState<OrdersDailyOverviewResponse | null>(null);

  /**
   * fetchDaily: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchDaily = () => {
    setState("loading");
    getOrdersDailyOverview(30)
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
     * runFetch: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const runFetch = () => {
      if (!active) return;
      const hasToken =
        typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
      if (!hasToken) {
        setState("idle");
        return;
      }
      fetchDaily();
    };

    runFetch();
    window.addEventListener("authSessionReady", runFetch);
    return () => {
      active = false;
      window.removeEventListener("authSessionReady", runFetch);
    };
  }, []);

  const rows = useMemo<DailyRow[]>(
    () =>
      (report?.data ?? []).map((item) => ({
        data: item.label,
        ordini: item.orders,
        clienti: item.clients,
        fatturato: formatEuro(item.revenue),
      })),
    [report]
  );

  const columns: Column<DailyRow>[] = [
    { key: "data", label: "Data", sortable: true },
    { key: "ordini", label: "N� Ordini", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "clienti", label: "N� Clienti", sortable: true },
    { key: "fatturato", label: "Fatturato", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
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
    const header = ["data", "ordini", "clienti", "fatturato"];
    const csv = [header, ...rows.map((row) => [row.data, row.ordini, row.clienti, row.fatturato])]
      .map((line) => line.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospetto-ordini-giornalieri-${new Date().toISOString().slice(0, 10)}.csv`;
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
            <h1 className="text-3xl font-semibold tracking-tight">Prospetto Ordini Giornalieri</h1>
            <Badge variant={source === "backend" ? "default" : "secondary"}>
              {source === "backend" ? "Dati backend" : "Fallback"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Riepilogo ordini per giornata (ultimi 30 giorni)</p>
        </div>
        <Button size="lg" onClick={handleExportCsv} disabled={!rows.length || state === "loading"}>
          <Download className="mr-2 h-5 w-5" />
          Esporta
        </Button>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && rows.length === 0}
        loadingMessage="Carico il prospetto ordini giornalieri dal backend..."
        emptyMessage="Nessun dato disponibile nel periodo richiesto."
        errorMessage="Errore nel caricamento del prospetto ordini giornalieri."
        forbiddenMessage="Il tuo ruolo non puo accedere a questo report."
        onRetry={fetchDaily}
      />

      <DataTable
        title="Andamento Giornaliero Ordini"
        description={source === "backend" ? "Dati reali da analytics backend" : "Backend non disponibile"}
        data={rows}
        columns={columns}
      />
    </div>
  );
}
