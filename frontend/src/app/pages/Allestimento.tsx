/**
 * File Overview: Allestimento.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Truck, Package, MapPin, CheckCircle2, FilterX, Play } from "lucide-react";
import { KPICard } from "../components/shared/KPICard";
import { DataTable, type Column } from "../components/shared/DataTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { InfoTooltip } from "../components/ui/info-tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { getShipments, type Shipment } from "../api/shipments";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

const statoConfig = {
  in_produzione: { label: "In Produzione (In attesa)", color: "bg-info/10 text-info border-info/20" },
  in_preparazione: { label: "In Preparazione", color: "bg-warning text-warning-foreground" },
  da_movimentare: { label: "Da Movimentare", color: "bg-info text-info-foreground" },
  pronto: { label: "Pronto", color: "bg-success text-success-foreground" },
  spedito: { label: "Spedito", color: "bg-muted text-muted-foreground" },
} as const;

type AllestimentoStatus = keyof typeof statoConfig;

type AllestimentoRow = {
  id: string;
  ordine: string;
  cliente: string;
  indirizzo: string;
  data: string;
  stato: AllestimentoStatus;
  tempoStimato: number;
};

/**
 * normalizeShipmentStatus: descrive il comportamento principale di questa funzione.
 * @param status Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeShipmentStatus(status: string | null | undefined): AllestimentoStatus {
  const value = (status ?? "").toLowerCase();
  if (value.includes("deliver") || value.includes("complete")) return "spedito";
  if (value.includes("ship") || value.includes("transit")) return "pronto";
  if (value.includes("move")) return "da_movimentare";
  if (value.includes("prod")) return "in_produzione";
  return "in_preparazione";
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
 * toDateKey: descrive il comportamento principale di questa funzione.
 * @param displayDate Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function toDateKey(displayDate: string): string {
  const [day, month, year] = displayDate.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * Allestimento: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Allestimento() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("tutti");
  const [dateFilter, setDateFilter] = useState<string>("tutte");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");
  const [state, setState] = useState<RemoteState>("idle");
  const backendReady = source === "backend" && state === "ready";

  /**
   * fetchShipments: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchShipments = () => {
    setState("loading");
    getShipments({ limit: 100, offset: 0 })
      .then((response) => {
        setShipments(response.data);
        setSource("backend");
        setState("ready");
      })
      .catch((error) => {
        setShipments([]);
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
      fetchShipments();
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
      fetchShipments();
    };

    window.addEventListener("authSessionReady", onAuthReady);
    return () => {
      active = false;
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, []);

  const rows = useMemo<AllestimentoRow[]>(
    () =>
      shipments.map((shipment) => ({
        id: shipment.id,
        ordine: shipment.orderExternalDocId ?? shipment.id.slice(0, 8).toUpperCase(),
        cliente: shipment.customerName ?? "Cliente non associato",
        indirizzo: shipment.destination ?? "Destinazione non disponibile",
        data: formatDate(shipment.plannedDate),
        stato: normalizeShipmentStatus(shipment.status),
        tempoStimato: 0,
      })),
    [shipments]
  );

  const filteredData = useMemo(() => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    return rows.filter((item) => {
      if (statusFilter !== "tutti" && item.stato !== statusFilter) return false;
      if (dateFilter === "oggi") return toDateKey(item.data) === todayKey;
      if (dateFilter === "ieri") return toDateKey(item.data) === yesterdayKey;
      return true;
    });
  }, [rows, statusFilter, dateFilter]);

  const activeFiltersCount = (statusFilter !== "tutti" ? 1 : 0) + (dateFilter !== "tutte" ? 1 : 0);

  const allestimentoKpi = useMemo(() => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const inPreparazione = rows.filter((item) => item.stato === "in_preparazione").length;
    const pronti = rows.filter((item) => item.stato === "pronto").length;
    const speditiOggi = rows.filter((item) => item.stato === "spedito" && toDateKey(item.data) === todayKey).length;
    const inTransito = rows.filter((item) => item.stato === "pronto").length;
    return { inPreparazione, pronti, speditiOggi, inTransito };
  }, [rows]);

  /**
   * resetFilters: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const resetFilters = () => {
    setStatusFilter("tutti");
    setDateFilter("tutte");
  };

  const filterComponent = (
    <div className="flex flex-col sm:flex-row items-end gap-4 w-full">
      <div className="w-full sm:w-64">
        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Stato Spedizione</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full bg-background border-border/50 shadow-sm">
            <SelectValue placeholder="Seleziona stato..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti gli stati</SelectItem>
            <SelectItem value="in_produzione">In Produzione</SelectItem>
            <SelectItem value="in_preparazione">In Preparazione</SelectItem>
            <SelectItem value="da_movimentare">Da Movimentare</SelectItem>
            <SelectItem value="pronto">Pronto</SelectItem>
            <SelectItem value="spedito">Spedito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-64">
        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Data di Spedizione</label>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full bg-background border-border/50 shadow-sm">
            <SelectValue placeholder="Seleziona periodo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutte">Tutte le date</SelectItem>
            <SelectItem value="oggi">Oggi</SelectItem>
            <SelectItem value="ieri">Ieri</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          onClick={resetFilters}
          className="w-full sm:w-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <FilterX className="w-4 h-4 mr-2" />
          Rimuovi Filtri
        </Button>
      )}
    </div>
  );

  const columns: Column<AllestimentoRow>[] = [
    {
      key: "ordine",
      label: "Ordine",
      sortable: true,
      render: (value) => <span className="font-mono font-medium">{value}</span>,
    },
    { key: "cliente", label: "Cliente", sortable: true },
    {
      key: "indirizzo",
      label: "Destinazione",
      render: (value) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    { key: "data", label: "Data Spedizione", sortable: true },
    {
      key: "tempoStimato",
      label: "Tempo Stimato",
      render: (_, item) =>
        item.stato === "in_produzione" || item.stato === "in_preparazione" ? (
          <span className="text-muted-foreground">In lavorazione</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "stato",
      label: "Stato",
      render: (value: AllestimentoStatus) => <Badge className={statoConfig[value].color}>{statoConfig[value].label}</Badge>,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            Allestimento
            <InfoTooltip text="Dati caricati da ops.shipments backend. Nessun dato business statico in questa vista." />
          </h1>
          <p className="text-muted-foreground mt-1">Preparazione e logistica spedizioni</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={source === "backend" ? "default" : "secondary"}>
            {source === "backend" ? "Dati backend" : "Fallback"}
          </Badge>
          <Button onClick={fetchShipments} variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Aggiorna
          </Button>
          <Button size="lg" className="shadow-lg shadow-primary/20">
            <Truck className="mr-2 h-5 w-5" />
            Nuova Spedizione
          </Button>
        </div>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && rows.length === 0}
        loadingMessage="Carico le spedizioni dal backend..."
        emptyMessage="Nessuna spedizione disponibile nel backend."
        errorMessage="Errore nel caricamento delle spedizioni backend."
        forbiddenMessage="Il tuo ruolo non puo accedere ai dati spedizioni backend."
        onRetry={fetchShipments}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="In Preparazione"
          value={backendReady ? String(allestimentoKpi.inPreparazione) : "N/D"}
          icon={Package}
          iconColor="text-warning"
          description={backendReady ? undefined : "backend non disponibile"}
        />
        <KPICard
          title="Pronti"
          value={backendReady ? String(allestimentoKpi.pronti) : "N/D"}
          description={backendReady ? "Per la spedizione" : "backend non disponibile"}
          icon={CheckCircle2}
          iconColor="text-success"
        />
        <KPICard
          title="Spediti Oggi"
          value={backendReady ? String(allestimentoKpi.speditiOggi) : "N/D"}
          icon={Truck}
          iconColor="text-primary"
          description={backendReady ? undefined : "backend non disponibile"}
        />
        <KPICard
          title="In Transito"
          value={backendReady ? String(allestimentoKpi.inTransito) : "N/D"}
          icon={MapPin}
          iconColor="text-info"
          description={backendReady ? undefined : "backend non disponibile"}
        />
      </div>

      <DataTable
        title="Spedizioni"
        description={backendReady ? "Dati backend reali" : "Backend non disponibile: nessun dato spedizioni reale"}
        data={filteredData}
        columns={columns}
        searchPlaceholder="Cerca per ordine o cliente..."
        filterComponent={filterComponent}
        onView={(row) => {
          navigate(`/allestimento/${row.id}`);
        }}
        onRowClick={(row) => {
          navigate(`/allestimento/${row.id}`);
        }}
        rowActions={false}
      />
    </div>
  );
}
