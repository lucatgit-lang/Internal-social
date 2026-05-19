/**
 * File Overview: Clienti.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { Users, TrendingUp, UserPlus, Building2 } from "lucide-react";
import { useNavigate } from "react-router";
import { KPICard } from "../components/shared/KPICard";
import { DataTable, Column } from "../components/shared/DataTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { getCustomers, type CustomerListItem } from "../api/customers";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

type ClienteRow = {
  id: string;
  ragioneSociale: string;
  piva: string;
  tipo: string;
  citta: string;
  provincia: string;
  stato: "attivo" | "non_attivo" | "nuovo";
};

const statoConfig = {
  attivo: { label: "Attivo", color: "bg-success text-success-foreground" },
  non_attivo: { label: "Non Attivo", color: "bg-muted text-muted-foreground" },
  nuovo: { label: "Nuovo", color: "bg-primary text-primary-foreground" },
} as const;

/**
 * normalizeStatus: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeStatus(value: string | null | undefined): ClienteRow["stato"] {
  const raw = (value ?? "").toLowerCase().trim();
  if (raw.includes("nuov")) return "nuovo";
  if (raw.includes("non")) return "non_attivo";
  return "attivo";
}

/**
 * toClienteRow: descrive il comportamento principale di questa funzione.
 * @param item Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function toClienteRow(item: CustomerListItem): ClienteRow {
  const piva = item.partitaIva ?? item.codiceFiscale ?? item.externalCode ?? "-";
  return {
    id: item.id,
    ragioneSociale: item.ragioneSociale,
    piva,
    tipo: item.externalCode ? "erp" : "manuale",
    citta: item.comune ?? "-",
    provincia: item.provincia ?? "-",
    stato: normalizeStatus(item.stato),
  };
}

/**
 * Clienti: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Clienti() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ClienteRow[]>([]);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");
  const [state, setState] = useState<RemoteState>("idle");
  const backendReady = source === "backend" && state === "ready";

  /**
   * fetchCustomers: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchCustomers = () => {
    setState("loading");
    (async () => {
      const limit = 100;
      let offset = 0;
      const all: CustomerListItem[] = [];
      for (let page = 0; page < 50; page += 1) {
        const response = await getCustomers({ limit, offset });
        all.push(...response.data);
        if (response.data.length < limit || offset + limit >= response.meta.total) {
          break;
        }
        offset += limit;
      }
      return all;
    })()
      .then((all) => {
        setRows(all.map(toClienteRow));
        setSource("backend");
        setState("ready");
      })
      .catch((error) => {
        setRows([]);
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
      fetchCustomers();
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
      fetchCustomers();
    };
    window.addEventListener("authSessionReady", onAuthReady);
    return () => {
      active = false;
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, []);

  const kpi = useMemo(() => {
    const totali = rows.length;
    const attivi = rows.filter((item) => item.stato === "attivo").length;
    const nuovi = rows.filter((item) => item.stato === "nuovo").length;
    const conPiva = rows.filter((item) => item.piva !== "-").length;
    return { totali, attivi, nuovi, conPiva };
  }, [rows]);

  const columns: Column<ClienteRow>[] = [
    {
      key: "ragioneSociale",
      label: "Ragione Sociale",
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{row.piva}</p>
        </div>
      ),
    },
    {
      key: "citta",
      label: "Localita",
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="text-sm">{value}</p>
          <p className="text-xs text-muted-foreground">{row.provincia}</p>
        </div>
      ),
    },
    { key: "tipo", label: "Fonte", sortable: true },
    {
      key: "stato",
      label: "Stato",
      render: (value: ClienteRow["stato"]) => (
        <Badge className={statoConfig[value].color}>{statoConfig[value].label}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clienti</h1>
          <p className="text-muted-foreground mt-1">Anagrafica clienti alimentata da dati reali backend</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={source === "backend" ? "default" : "secondary"}>
            {source === "backend" ? "Dati backend" : "Fallback"}
          </Badge>
          <Button size="lg" className="shadow-lg shadow-primary/20" disabled>
            <UserPlus className="mr-2 h-5 w-5" />
            Nuovo Cliente
          </Button>
        </div>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && rows.length === 0}
        loadingMessage="Carico i clienti dal backend..."
        emptyMessage="Nessun cliente disponibile."
        errorMessage="Errore nel caricamento clienti."
        forbiddenMessage="Il tuo ruolo non puo consultare la lista clienti."
        onRetry={fetchCustomers}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Clienti Totali"
          value={backendReady ? String(kpi.totali) : "N/D"}
          icon={Users}
          iconColor="text-primary"
          description={backendReady ? "record disponibili" : "backend non disponibile"}
        />
        <KPICard
          title="Clienti Attivi"
          value={backendReady ? String(kpi.attivi) : "N/D"}
          change={{
            value: backendReady
              ? `${kpi.totali > 0 ? Math.round((kpi.attivi / kpi.totali) * 100) : 0}%`
              : "N/D",
            trend: "neutral",
          }}
          icon={TrendingUp}
          iconColor="text-success"
          description={backendReady ? "sul totale" : "backend non disponibile"}
        />
        <KPICard
          title="Nuovi Clienti"
          value={backendReady ? String(kpi.nuovi) : "N/D"}
          icon={UserPlus}
          iconColor="text-info"
          description={backendReady ? "stato anagrafico" : "backend non disponibile"}
        />
        <KPICard
          title="Con P.IVA/CF"
          value={backendReady ? String(kpi.conPiva) : "N/D"}
          icon={Building2}
          iconColor="text-accent-purple"
          description={backendReady ? "anagrafiche valorizzate" : "backend non disponibile"}
        />
      </div>

      <DataTable
        title="Anagrafica Clienti"
        description={
          backendReady
            ? "Elenco completo clienti dal backend"
            : "Backend non disponibile: nessun dato cliente reale"
        }
        data={rows}
        columns={columns}
        searchPlaceholder="Cerca per ragione sociale o P.IVA..."
        onRowClick={(row) => navigate(`/clienti/${row.id}`)}
        onView={(row) => navigate(`/clienti/${row.id}`)}
        rowActions={false}
      />
    </div>
  );
}
