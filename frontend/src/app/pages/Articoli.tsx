/**
 * File Overview: Articoli.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { Package, TrendingUp, AlertTriangle, Archive } from "lucide-react";
import { KPICard } from "../components/shared/KPICard";
import { DataTable, Column } from "../components/shared/DataTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { getTechnicalProducts, getTechnicalSdsAteco } from "../api/technical";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

const statoConfig = {
  disponibile: { label: "Disponibile", color: "bg-success text-success-foreground" },
  sotto_minimo: { label: "Sotto Minimo", color: "bg-warning text-warning-foreground" },
  esaurito: { label: "Esaurito", color: "bg-destructive text-destructive-foreground" },
  non_disponibile: { label: "Dato non disponibile", color: "bg-muted text-muted-foreground" },
};

type ArticoloRow = {
  id: string;
  codice: string;
  descrizione: string;
  categoria: string;
  giacenza: number | null;
  minimo: number | null;
  prezzo: string;
  stato: keyof typeof statoConfig;
  barcode: string;
  hasSds: boolean;
  hasAteco: boolean;
  source: "backend" | "demo";
};

/**
 * Articoli: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Articoli() {
  const navigate = useNavigate();
  const [backendRows, setBackendRows] = useState<ArticoloRow[]>([]);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");
  const [state, setState] = useState<RemoteState>("idle");
  const backendReady = source === "backend" && state === "ready";

  /**
   * fetchTechnicalFlags: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
   */
  const fetchTechnicalFlags = async (): Promise<{ sdsCodes: Set<string>; hasAtecoCatalog: boolean }> => {
    const sdsAccumulator = new Set<string>();
    let atecoAvailable = false;
    const limit = 200;
    let offset = 0;

    for (let page = 0; page < 20; page += 1) {
      const result = await getTechnicalSdsAteco({ limit, offset });
      for (const ref of result.data.sdsRefs) {
        const code = ref.productCode?.trim().toUpperCase();
        if (code) {
          sdsAccumulator.add(code);
        }
      }
      if (result.data.atecoCodes.length > 0) {
        atecoAvailable = true;
      }
      if (result.data.sdsRefs.length < limit) {
        break;
      }
      offset += limit;
    }

    return {
      sdsCodes: sdsAccumulator,
      hasAtecoCatalog: atecoAvailable,
    };
  };

  /**
   * fetchProducts: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchProducts = () => {
    setState("loading");
    Promise.all([getTechnicalProducts({ limit: 200, offset: 0, listinoOnly: true }), fetchTechnicalFlags()])
      .then(([response, technicalFlags]) => {
        const mapped: ArticoloRow[] = response.data.map((product) => {
          const code = product.code.trim().toUpperCase();
          return {
            id: product.id,
            codice: product.code,
            descrizione: product.name ?? `Prodotto ${product.code}`,
            categoria: product.productLine ?? "Tecnico",
            giacenza: null,
            minimo: null,
            prezzo: `EUR ${product.unitCost.toFixed(2)}`,
            stato: "non_disponibile",
            barcode: product.code,
            hasSds: technicalFlags.sdsCodes.has(code),
            hasAteco: technicalFlags.hasAtecoCatalog,
            source: "backend",
          };
        });
        setBackendRows(mapped);
        setSource("backend");
        setState("ready");
      })
      .catch((error) => {
        setBackendRows([]);
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
      fetchProducts();
    } else {
      setSource("fallback");
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
      fetchProducts();
    };
    window.addEventListener("authSessionReady", onAuthReady);
    return () => {
      active = false;
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, []);

  const tableData: ArticoloRow[] = useMemo(() => {
    return backendRows;
  }, [backendRows]);

  const backendMode = source === "backend";

  const underMinimumCount = useMemo(
    () =>
      tableData.filter(
        (row) => typeof row.giacenza === "number" && typeof row.minimo === "number" && row.giacenza < row.minimo
      ).length,
    [tableData]
  );

  const productLinesCount = useMemo(() => new Set(tableData.map((row) => row.categoria)).size, [tableData]);

  const columns: Column<ArticoloRow>[] = [
    {
      key: "codice",
      label: "Codice",
      sortable: true,
      render: (value) => <span className="font-mono font-medium">{value}</span>,
    },
    {
      key: "descrizione",
      label: "Descrizione",
      sortable: true,
    },
    {
      key: "categoria",
      label: "Categoria",
      sortable: true,
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "hasSds",
      label: "SDS/ATECO",
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.hasSds ? "default" : "outline"} className="text-xs">
            {row.hasSds ? "SDS OK" : "SDS N/D"}
          </Badge>
          <Badge variant={row.hasAteco ? "secondary" : "outline"} className="text-xs">
            {row.hasAteco ? "ATECO OK" : "ATECO N/D"}
          </Badge>
        </div>
      ),
    },
    {
      key: "giacenza",
      label: "Giacenza",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{typeof value === "number" ? value : "N/D"}</span>
          {typeof value === "number" && typeof row.minimo === "number" && value < row.minimo && (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
        </div>
      ),
    },
    {
      key: "minimo",
      label: "Minimo",
      sortable: true,
      render: (value) => <span className="text-muted-foreground">{typeof value === "number" ? value : "N/D"}</span>,
    },
    {
      key: "prezzo",
      label: "Prezzo",
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: "stato",
      label: "Stato",
      render: (value: keyof typeof statoConfig) => (
        <Badge className={statoConfig[value].color}>{statoConfig[value].label}</Badge>
      ),
    },
    {
      key: "id",
      label: "BOM",
      render: (_, row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/tecnico/distinte?productCode=${encodeURIComponent(row.codice)}`);
          }}
        >
          Distinta
        </Button>
      ),
    },
  ];

  const filterComponent = (
    <div className="grid gap-4 md:grid-cols-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Linea Prodotto</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Tutte le linee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte</SelectItem>
            <SelectItem value="Green">Linea Green</SelectItem>
            <SelectItem value="Kemipol">Linea Kemipol</SelectItem>
            <SelectItem value="Specialkem">Linea Specialkem</SelectItem>
            <SelectItem value="Sirkem">Linea Sirkem</SelectItem>
            <SelectItem value="Greenpol">Linea Greenpol</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Stato</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Tutti gli stati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="disponibile">Disponibile</SelectItem>
            <SelectItem value="sotto_minimo">Sotto Minimo</SelectItem>
            <SelectItem value="esaurito">Esaurito</SelectItem>
            <SelectItem value="non_disponibile">Dato non disponibile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Prezzo Min</label>
        <input
          type="number"
          placeholder="EUR 0"
          className="flex h-10 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Prezzo Max</label>
        <input
          type="number"
          placeholder="EUR 500"
          className="flex h-10 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Catalogo Prodotti Kemipol</h1>
          <p className="text-muted-foreground mt-1">Diluenti, solventi e prodotti chimici professionali - Listino 2026</p>
          <p className="text-xs mt-1 text-muted-foreground">
            Fonte dati: {backendMode ? "backend tecnico reale" : state === "loading" ? "caricamento backend..." : "backend non disponibile"}
          </p>
        </div>
        <Button size="lg" className="shadow-lg shadow-primary/20">
          <Package className="mr-2 h-5 w-5" />
          Nuovo Articolo
        </Button>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && tableData.length === 0}
        loadingMessage="Carico gli articoli tecnici dal backend..."
        emptyMessage="Nessun articolo tecnico disponibile dal backend."
        errorMessage="Errore nel caricamento articoli backend."
        forbiddenMessage="Il tuo ruolo non puo consultare il catalogo tecnico."
        onRetry={fetchProducts}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Articoli Catalogati"
          value={backendReady ? tableData.length.toString() : "N/D"}
          description={backendReady ? "Prodotti da backend tecnico" : "backend non disponibile"}
          icon={Package}
          iconColor="text-primary"
        />
        <KPICard
          title="Linee Prodotto"
          value={backendReady ? productLinesCount.toString() : "N/D"}
          description={backendReady ? "Linee prodotto dal backend tecnico" : "backend non disponibile"}
          icon={TrendingUp}
          iconColor="text-success"
        />
        <KPICard
          title="Sotto Minimo"
          value={backendReady ? underMinimumCount.toString() : "N/D"}
          description={backendReady ? "Stock non ancora integrato: KPI parziale" : "backend non disponibile"}
          icon={AlertTriangle}
          iconColor="text-warning"
        />
        <KPICard
          title="Categorie"
          value={backendReady ? productLinesCount.toString() : "N/D"}
          description={backendReady ? "Categorie dal backend tecnico" : "backend non disponibile"}
          icon={Archive}
          iconColor="text-info"
        />
      </div>

      <DataTable
        title="Catalogo Articoli Kemipol"
        description={
          backendReady
            ? "Prodotti chimici professionali dal backend tecnico"
            : "Backend non disponibile: nessun articolo reale caricato"
        }
        data={tableData}
        columns={columns}
        searchPlaceholder="Cerca per codice, descrizione o barcode..."
        onRowClick={(row) =>
          navigate(`/tecnico/distinte?productCode=${encodeURIComponent(row.codice)}`)
        }
        onView={(row) =>
          navigate(`/tecnico/distinte?productCode=${encodeURIComponent(row.codice)}`)
        }
        onEdit={(row) => console.log("Edit", row)}
        onDelete={(row) => console.log("Delete", row)}
        filterComponent={filterComponent}
      />
    </div>
  );
}
