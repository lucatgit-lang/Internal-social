/**
 * File Overview: Fabbisogno.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { ClipboardList, AlertTriangle, TrendingUp, Package, Sparkles, ArrowRight, BrainCircuit } from "lucide-react";
import { KPICard } from "../components/shared/KPICard";
import { DataTable, Column } from "../components/shared/DataTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { getMaterialNeeds, type MaterialNeedsResponse } from "../api/reports";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

type FabbisognoRow = {
  codice: string;
  materiale: string;
  fabbisogno: string;
  valore: string;
  ordini: number;
  urgenza: "alta" | "media" | "bassa";
};

const urgenzaConfig = {
  alta: { label: "Alta", color: "bg-destructive text-destructive-foreground" },
  media: { label: "Media", color: "bg-warning text-warning-foreground" },
  bassa: { label: "Bassa", color: "bg-muted text-muted-foreground" },
} as const;

/**
 * formatNumber: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatNumber(value: number): string {
  return value.toLocaleString("it-IT", { maximumFractionDigits: 2 });
}

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
 * Fabbisogno: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Fabbisogno() {
  const navigate = useNavigate();
  const [showAIPromo, setShowAIPromo] = useState(false);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");
  const [state, setState] = useState<RemoteState>("idle");
  const [report, setReport] = useState<MaterialNeedsResponse | null>(null);

  /**
   * fetchNeeds: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchNeeds = () => {
    setState("loading");
    getMaterialNeeds()
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
    const timer = setTimeout(() => setShowAIPromo(true), 500);
    return () => clearTimeout(timer);
  }, []);

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
      fetchNeeds();
    };

    runFetchIfTokenAvailable();
    window.addEventListener("authSessionReady", runFetchIfTokenAvailable);
    return () => {
      active = false;
      window.removeEventListener("authSessionReady", runFetchIfTokenAvailable);
    };
  }, []);

  const rows = useMemo<FabbisognoRow[]>(
    () =>
      (report?.rows ?? []).map((item) => ({
        codice: item.code,
        materiale: item.name,
        fabbisogno: formatNumber(item.requestedQty),
        valore: formatEuro(item.estimatedValue),
        ordini: item.ordersCount,
        urgenza: item.urgency,
      })),
    [report]
  );

  const columns: Column<FabbisognoRow>[] = [
    { key: "codice", label: "Codice", sortable: true, render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: "materiale", label: "Materiale", sortable: true },
    { key: "fabbisogno", label: "Fabbisogno (30gg)", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "ordini", label: "Ordini Coinvolti", sortable: true },
    { key: "valore", label: "Valore Stimato", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "urgenza", label: "Urgenza", render: (v: keyof typeof urgenzaConfig) => <Badge className={urgenzaConfig[v].color}>{urgenzaConfig[v].label}</Badge> },
  ];

  return (
    <div className="space-y-8">
      <Dialog open={showAIPromo} onOpenChange={setShowAIPromo}>
        <DialogContent className="sm:max-w-xl bg-background/95 backdrop-blur-xl border-primary/20">
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-primary/20 ring-1 ring-primary/30">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2">
              Nuovo Fabbisogno AI
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-bold px-2 py-0.5 animate-bounce">
                FASE BETA
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Abbiamo rivoluzionato la gestione degli acquisti. Ora l'Intelligenza Artificiale lavora per te come un vero trader.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="bg-primary/10 p-2 rounded-lg mt-1">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-foreground">Previsioni di Mercato</h4>
                <p className="text-sm text-muted-foreground">L'AI analizza in tempo reale i trend dei prezzi per solventi e materie prime, suggerendo il momento ottimale per acquistare.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="bg-primary/10 p-2 rounded-lg mt-1">
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-foreground">Scraping Notizie & Insight</h4>
                <p className="text-sm text-muted-foreground">Ottieni argomentazioni solide basate su notizie globali (es. blocchi di canali, carenze asiatiche) per condurre trattative vantaggiose con i fornitori.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center mt-4">
            <Button variant="ghost" onClick={() => setShowAIPromo(false)}>
              Rimani qui
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group"
              onClick={() => {
                setShowAIPromo(false);
                navigate("/fabbisogno/ai");
              }}
            >
              Prova Fabbisogno AI
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Fabbisogno Materiali</h1>
            <Badge variant={source === "backend" ? "default" : "secondary"}>
              {source === "backend" ? "Dati backend" : "Fallback"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Pianificazione fabbisogni su ordini reali (ultimi 30 giorni)</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10 shadow-sm shadow-primary/10 group relative overflow-hidden"
            onClick={() => navigate("/fabbisogno/ai")}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
            <Sparkles className="mr-2 h-4 w-4" />
            Passa a Fabbisogno AI
            <Badge className="ml-2 h-5 text-[10px] bg-primary text-primary-foreground font-bold border-none">BETA</Badge>
          </Button>
          <Button size="lg" className="shadow-lg shadow-primary/20" onClick={fetchNeeds}>
            <Package className="mr-2 h-5 w-5" />
            Aggiorna
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            Questa vista usa dati reali backend da ordini/righe ordine. Le giacenze fisiche e i fornitori reali non sono ancora
            integrati in questo modulo.
          </div>
        </div>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && rows.length === 0}
        loadingMessage="Carico il fabbisogno materiali dal backend..."
        emptyMessage="Nessun fabbisogno disponibile nel periodo selezionato."
        errorMessage="Errore nel caricamento del fabbisogno materiali."
        forbiddenMessage="Il tuo ruolo non puo accedere al fabbisogno materiali."
        onRetry={fetchNeeds}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Materiali Critici" value={String(report?.summary.criticalMaterials ?? 0)} icon={AlertTriangle} iconColor="text-destructive" />
        <KPICard title="Materiali Monitorati" value={String(report?.summary.totalMaterials ?? 0)} icon={ClipboardList} iconColor="text-warning" />
        <KPICard title="Valore Fabbisogno" value={formatEuro(report?.summary.totalEstimatedValue ?? 0)} icon={TrendingUp} iconColor="text-primary" />
        <KPICard title="Ordini Coinvolti" value={String(report?.summary.activeOrders ?? 0)} icon={Package} iconColor="text-success" />
      </div>

      <DataTable title="Analisi Fabbisogno" data={rows} columns={columns} searchPlaceholder="Cerca materiale o codice..." />
    </div>
  );
}
