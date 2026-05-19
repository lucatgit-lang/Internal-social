/**
 * File Overview: Produzione.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, Factory, Package, Play } from "lucide-react";
import { useNavigate } from "react-router";
import { KPICard } from "../components/shared/KPICard";
import { DataTable, type Column } from "../components/shared/DataTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { getProductionJobs, type ProductionJob } from "../api/production";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

type ProductionRow = {
  id: string;
  ordine: string;
  cliente: string;
  priorita: "alta" | "normale";
  stato: "in_coda" | "in_corso" | "completato";
  dataPianificata: string;
};

const statoConfig = {
  in_coda: { label: "In Coda", color: "bg-muted text-muted-foreground" },
  in_corso: { label: "In Corso", color: "bg-info/10 text-info" },
  completato: { label: "Completato", color: "bg-success/10 text-success" },
} as const;

const prioritaConfig = {
  alta: { label: "Alta", color: "bg-warning/10 text-warning border-warning/20" },
  normale: { label: "Normale", color: "bg-muted text-muted-foreground border-border" },
} as const;

/**
 * normalizeStatus: descrive il comportamento principale di questa funzione.
 * @param raw Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeStatus(raw: string | null | undefined): ProductionRow["stato"] {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("complete") || value.includes("done")) return "completato";
  if (value.includes("running") || value.includes("progress")) return "in_corso";
  return "in_coda";
}

/**
 * normalizePriority: descrive il comportamento principale di questa funzione.
 * @param raw Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizePriority(raw: string | null | undefined): ProductionRow["priorita"] {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("high") || value.includes("alt")) return "alta";
  return "normale";
}

/**
 * formatDate: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("it-IT");
}

/**
 * Produzione: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Produzione() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");
  const [state, setState] = useState<RemoteState>("idle");
  const backendReady = source === "backend" && state === "ready";

  /**
   * fetchJobs: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchJobs = () => {
    setState("loading");
    getProductionJobs({ limit: 100, offset: 0 })
      .then((response) => {
        setJobs(response.data);
        setSource("backend");
        setState("ready");
      })
      .catch((error) => {
        setJobs([]);
        setSource("fallback");
        const status = getApiStatusFromError(error);
        setState(status === 403 ? "forbidden" : "error");
      });
  };

  useEffect(() => {
    let active = true;
    const hasToken =
      typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
    if (hasToken) {
      fetchJobs();
    } else {
      setState("idle");
    }

    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => {
      if (!active) return;
      fetchJobs();
    };
    window.addEventListener("authSessionReady", onAuthReady);
    return () => {
      active = false;
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, []);

  const rows = useMemo<ProductionRow[]>(
    () =>
      jobs.map((job) => ({
        id: job.id,
        ordine: job.orderExternalDocId ?? job.id.slice(0, 8).toUpperCase(),
        cliente: job.customerName ?? "Cliente non associato",
        priorita: normalizePriority(job.priority),
        stato: normalizeStatus(job.status),
        dataPianificata: formatDate(job.scheduledDate),
      })),
    [jobs]
  );

  const kpi = useMemo(() => {
    const inCoda = rows.filter((row) => row.stato === "in_coda").length;
    const inCorso = rows.filter((row) => row.stato === "in_corso").length;
    const completati = rows.filter((row) => row.stato === "completato").length;
    const altaPriorita = rows.filter((row) => row.priorita === "alta").length;
    return { inCoda, inCorso, completati, altaPriorita };
  }, [rows]);

  const columns: Column<ProductionRow>[] = [
    {
      key: "ordine",
      label: "Ordine",
      sortable: true,
      render: (value) => <span className="font-mono font-medium">{value}</span>,
    },
    { key: "cliente", label: "Cliente", sortable: true },
    {
      key: "priorita",
      label: "Priorita",
      render: (value: ProductionRow["priorita"]) => (
        <Badge className={`border ${prioritaConfig[value].color}`}>{prioritaConfig[value].label}</Badge>
      ),
    },
    {
      key: "stato",
      label: "Stato",
      render: (value: ProductionRow["stato"]) => (
        <Badge className={statoConfig[value].color}>{statoConfig[value].label}</Badge>
      ),
    },
    { key: "dataPianificata", label: "Data Pianificata", sortable: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Produzione</h1>
          <p className="text-muted-foreground mt-1">
            Lavorazioni reali da `ops.production_jobs` (derivate dagli ordini reali)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={source === "backend" ? "default" : "secondary"}>
            {source === "backend" ? "Dati backend" : "Fallback"}
          </Badge>
          <Button onClick={fetchJobs} variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Aggiorna
          </Button>
        </div>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && rows.length === 0}
        loadingMessage="Carico la coda produzione dal backend..."
        emptyMessage="Nessuna lavorazione disponibile."
        errorMessage="Errore nel caricamento produzione."
        forbiddenMessage="Il tuo ruolo non puo consultare la produzione."
        onRetry={fetchJobs}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="In Coda"
          value={backendReady ? String(kpi.inCoda) : "N/D"}
          icon={Package}
          iconColor="text-warning"
          description={backendReady ? undefined : "backend non disponibile"}
        />
        <KPICard
          title="In Corso"
          value={backendReady ? String(kpi.inCorso) : "N/D"}
          icon={Factory}
          iconColor="text-primary"
          description={backendReady ? undefined : "backend non disponibile"}
        />
        <KPICard
          title="Completati"
          value={backendReady ? String(kpi.completati) : "N/D"}
          icon={Activity}
          iconColor="text-success"
          description={backendReady ? undefined : "backend non disponibile"}
        />
        <KPICard
          title="Alta Priorita"
          value={backendReady ? String(kpi.altaPriorita) : "N/D"}
          icon={AlertCircle}
          iconColor="text-destructive"
          description={backendReady ? undefined : "backend non disponibile"}
        />
      </div>

      <DataTable
        title="Coda Produzione"
        description={backendReady ? "Dati backend reali" : "Backend non disponibile: nessun dato produzione reale"}
        data={rows}
        columns={columns}
        searchPlaceholder="Cerca per ordine o cliente..."
        onRowClick={(row) => navigate(`/produzione/${row.id}`)}
        onView={(row) => navigate(`/produzione/${row.id}`)}
        rowActions={false}
      />
    </div>
  );
}
