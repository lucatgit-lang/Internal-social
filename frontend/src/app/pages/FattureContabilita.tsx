/**
 * File Overview: FattureContabilita.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock,
  Euro,
  FileText,
  User,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "../components/ui/badge";
import { InfoTooltip } from "../components/ui/info-tooltip";
import { getOrders, type OrderListItem } from "../api/orders";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

/**
 * formatMoney: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatMoney(value: number | null | undefined): string {
  return `EUR ${(value ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 2 })}`;
}

/**
 * isAccountingQueue: descrive il comportamento principale di questa funzione.
 * @param order Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function isAccountingQueue(order: OrderListItem): boolean {
  const situazione = (order.situazioneOrdine ?? "").toLowerCase();
  const evasione = (order.statoEvasione ?? "").toLowerCase();

  if (evasione.includes("evas") || evasione.includes("complet") || evasione.includes("closed")) {
    return false;
  }

  return (
    situazione.includes("approv") ||
    situazione.includes("contab") ||
    evasione.includes("approv") ||
    evasione.includes("pending")
  );
}

/**
 * urgencyLabel: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function urgencyLabel(value: string | null): "Urgente" | "Media" | "Normale" {
  const raw = (value ?? "").toLowerCase();
  if (raw.includes("urg") || raw.includes("alta") || raw.includes("high")) return "Urgente";
  if (raw.includes("media") || raw.includes("normal")) return "Media";
  return "Normale";
}

/**
 * FattureContabilita: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function FattureContabilita() {
  const navigate = useNavigate();
  const [state, setState] = useState<RemoteState>("idle");
  const [source, setSource] = useState<"backend" | "offline">("offline");
  const [orders, setOrders] = useState<OrderListItem[]>([]);

  /**
   * load: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const load = () => {
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

    load();

    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => load();
    window.addEventListener("authSessionReady", onAuthReady);
    return () => window.removeEventListener("authSessionReady", onAuthReady);
  }, []);

  const queue = useMemo(() => orders.filter(isAccountingQueue), [orders]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Fatture e Contabilita
            <InfoTooltip text="Vista backend-first della coda contabile su ordini reali. Approvazione contabile server-side non ancora attivata in questa pagina." />
          </h1>
          <Badge variant={source === "backend" ? "default" : "secondary"}>
            {source === "backend" ? "Dati backend" : "Backend non disponibile"}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Coda contabile basata su ordini reali.
        </p>
      </div>

      <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            In questa fase la pagina e in sola lettura backend: consultazione coda contabile e dettaglio proposta. Azione "Accetta Proposta" da migrare con endpoint dedicato.
          </div>
        </div>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && queue.length === 0}
        loadingMessage="Carico coda contabile dal backend..."
        emptyMessage="Nessuna proposta in coda contabile nel backend."
        errorMessage="Errore caricamento coda contabile backend."
        forbiddenMessage="Il tuo ruolo non puo consultare la sezione contabile."
        onRetry={load}
      />

      <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Proposte in attesa area contabile
          </h2>
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
            {queue.length} da gestire
          </Badge>
        </div>

        {queue.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center bg-background/50">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-emerald-700" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Nessuna proposta in attesa</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              Non risultano ordini in coda contabile nel backend.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {queue.map((order) => {
              const urgency = urgencyLabel(order.livelloUrgenza);
              return (
                <div
                  key={order.id}
                  className="p-6 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between hover:bg-muted/5 transition-colors"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xl text-primary">{order.externalDocId}</span>
                      <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 font-medium">
                        In attesa contabilita
                      </Badge>
                      {urgency === "Urgente" && (
                        <Badge variant="destructive" className="uppercase text-[10px] font-bold">Urgente</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{order.customer.ragioneSociale ?? "Cliente non associato"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span>Cliente ERP</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Euro className="w-4 h-4 text-emerald-700" />
                        </div>
                        <span className="font-bold text-emerald-700 text-base">{formatMoney(order.totaleV1)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span>{order.statoEvasione ?? order.situazioneOrdine ?? "Stato non disponibile"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                    <button
                      onClick={() => navigate(`/proposte/${order.id}`)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
                    >
                      Vedi Dettagli <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
