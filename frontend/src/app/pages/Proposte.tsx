/**
 * File Overview: Proposte.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Factory,
} from "lucide-react";
import { KPICard } from "../components/shared/KPICard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";
import { InfoTooltip } from "../components/ui/info-tooltip";
import { cn } from "../components/ui/utils";
import { DataTable, type Column } from "../components/shared/DataTable";
import { getOrders, type OrderListItem } from "../api/orders";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

type PropostaTab = "approvazione" | "stato" | "archivio";

type PropostaRow = {
  id: string;
  numero: string;
  cliente: string;
  data: string;
  urgenza: string;
  stato: string;
  valore: string;
  valoreNum: number;
  bucket: PropostaTab;
};

/**
 * normalizeStatusBucket: descrive il comportamento principale di questa funzione.
 * @param order Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeStatusBucket(order: OrderListItem): PropostaTab {
  const situazione = (order.situazioneOrdine ?? "").toLowerCase();
  const evasione = (order.statoEvasione ?? "").toLowerCase();

  if (evasione.includes("evas") || evasione.includes("complet") || evasione.includes("closed")) {
    return "archivio";
  }

  if (
    situazione.includes("blocc") ||
    situazione.includes("attes") ||
    evasione.includes("sosp") ||
    evasione.includes("pending")
  ) {
    return "approvazione";
  }

  return "stato";
}

/**
 * normalizeUrgency: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeUrgency(value: string | null): string {
  const raw = (value ?? "").toLowerCase();
  if (raw.includes("urg") || raw.includes("alta") || raw.includes("high")) return "Urgente";
  if (raw.includes("media") || raw.includes("normal")) return "Media";
  return "Normale";
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
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("it-IT");
}

/**
 * formatEuro: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatEuro(value: number | null): string {
  return `EUR ${(value ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 2 })}`;
}

const urgencyBadge: Record<string, string> = {
  Urgente: "bg-destructive/10 text-destructive border-destructive/30",
  Media: "bg-warning/10 text-warning border-warning/20",
  Normale: "bg-muted text-muted-foreground border-border",
};

/**
 * Proposte: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Proposte() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PropostaTab>("approvazione");
  const [state, setState] = useState<RemoteState>("idle");
  const [source, setSource] = useState<"backend" | "offline">("offline");
  const [orders, setOrders] = useState<OrderListItem[]>([]);

  /**
   * fetchOrders: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchOrders = () => {
    setState("loading");
    getOrders({ limit: 100, offset: 0 })
      .then((response) => {
        setOrders(response.data);
        setSource("backend");
        setState("ready");
      })
      .catch((error) => {
        setOrders([]);
        setSource("offline");
        const status = getApiStatusFromError(error);
        setState(status === 403 ? "forbidden" : "error");
      });
  };

  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
    if (!hasToken) {
      setState("idle");
      return;
    }

    fetchOrders();

    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => fetchOrders();
    window.addEventListener("authSessionReady", onAuthReady);
    return () => window.removeEventListener("authSessionReady", onAuthReady);
  }, []);

  const rows = useMemo<PropostaRow[]>(
    () =>
      orders.map((order) => ({
        id: order.id,
        numero: order.externalDocId,
        cliente: order.customer.ragioneSociale ?? "Cliente non associato",
        data: formatDate(order.dataDoc),
        urgenza: normalizeUrgency(order.livelloUrgenza),
        stato: order.statoEvasione ?? order.situazioneOrdine ?? "Sconosciuto",
        valore: formatEuro(order.totaleV1),
        valoreNum: order.totaleV1 ?? 0,
        bucket: normalizeStatusBucket(order),
      })),
    [orders]
  );

  const approvazioneRows = rows.filter((row) => row.bucket === "approvazione");
  const statoRows = rows.filter((row) => row.bucket === "stato");
  const archivioRows = rows.filter((row) => row.bucket === "archivio");

  const columns: Column<PropostaRow>[] = [
    { key: "numero", label: "Ordine", sortable: true, render: (v) => <span className="font-mono font-medium">{v}</span> },
    { key: "cliente", label: "Cliente", sortable: true },
    { key: "data", label: "Data", sortable: true },
    {
      key: "urgenza",
      label: "Priorita",
      render: (v) => <Badge className={urgencyBadge[v] ?? urgencyBadge.Normale}>{v}</Badge>,
    },
    { key: "stato", label: "Stato ERP", sortable: true },
    { key: "valore", label: "Valore", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
  ];

  const visibleRows = activeTab === "approvazione" ? approvazioneRows : activeTab === "stato" ? statoRows : archivioRows;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
              Proposte & Approvazioni
              <InfoTooltip text="Vista backend-first sugli ordini reali. Workflow approva/rifiuta dedicato non ancora migrato server-side in questa sezione." />
            </h1>
            <Badge variant={source === "backend" ? "default" : "secondary"}>
              {source === "backend" ? "Dati backend" : "Backend non disponibile"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Gestione proposte con dati ordini reali</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrders}>
            <Sparkles className="mr-2 h-4 w-4" />
            Aggiorna
          </Button>
          <Button size="lg" className="shadow-lg shadow-primary/20" onClick={() => navigate("/catalogo")}>
            <FileText className="mr-2 h-5 w-5" />
            Nuova Proposta
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <div>
            In questa fase la sezione e in sola lettura backend: classifica ordini reali per coda approvazione/stato/archivio.
            Le azioni operative approva/rifiuta restano da migrare con endpoint dedicati.
          </div>
        </div>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && rows.length === 0}
        loadingMessage="Carico proposte dal backend..."
        emptyMessage="Nessuna proposta disponibile nel backend."
        errorMessage="Errore caricamento proposte backend."
        forbiddenMessage="Il tuo ruolo non puo consultare le proposte."
        onRetry={fetchOrders}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="In Attesa Approvazione"
          value={String(approvazioneRows.length)}
          description="Ordini da verificare"
          icon={Clock}
          iconColor="text-warning"
        />
        <KPICard
          title="In Avanzamento"
          value={String(statoRows.length)}
          description="Ordini attivi"
          icon={Factory}
          iconColor="text-info"
        />
        <KPICard
          title="Archivio"
          value={String(archivioRows.length)}
          description="Ordini completati/chiusi"
          icon={CheckCircle2}
          iconColor="text-success"
        />
        <KPICard
          title="Valore Totale"
          value={formatEuro(rows.reduce((acc, row) => acc + row.valoreNum, 0))}
          description="Somma periodo visualizzato"
          icon={TrendingUp}
          iconColor="text-primary"
        />
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("approvazione")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all",
            activeTab === "approvazione" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="h-4 w-4" />
          In Approvazione
          {approvazioneRows.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-warning text-white text-xs">{approvazioneRows.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab("stato")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all",
            activeTab === "stato" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Factory className="h-4 w-4" />
          Stato Proposta
          {statoRows.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-info text-white text-xs">{statoRows.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab("archivio")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all",
            activeTab === "archivio" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          Archivio
        </button>
      </div>

      <DataTable
        title={
          activeTab === "approvazione"
            ? "Ordini in attesa"
            : activeTab === "stato"
              ? "Ordini in avanzamento"
              : "Ordini archiviati"
        }
        description="Dati reali da sales.orders"
        data={visibleRows}
        columns={columns}
        searchPlaceholder="Cerca ordine o cliente..."
        onRowClick={(row) => navigate(`/proposte/${row.id}`)}
        rowActions={false}
      />
    </div>
  );
}
