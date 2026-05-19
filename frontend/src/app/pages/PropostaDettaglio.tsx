/**
 * File Overview: PropostaDettaglio.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Factory,
  FileText,
  Package,
  Truck,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { cn } from "../components/ui/utils";
import { getOrderById, type OrderDetail } from "../api/orders";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

const STEPS = [
  { id: "in_approvazione", label: "In attesa", icon: Clock },
  { id: "approvato", label: "Approvato", icon: CheckCircle2 },
  { id: "in_produzione", label: "In produzione", icon: Factory },
  { id: "completato", label: "Spedizione", icon: Truck },
] as const;

/**
 * normalizeStep: descrive il comportamento principale di questa funzione.
 * @param status Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeStep(status: string): number {
  const value = status.toLowerCase();
  if (value.includes("evas") || value.includes("complet")) return 3;
  if (value.includes("produzion")) return 2;
  if (value.includes("approv")) return 1;
  return 0;
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
 * getUrgencyLabel: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function getUrgencyLabel(value: string | null): string {
  const text = (value ?? "").toLowerCase();
  if (text.includes("urg") || text.includes("alta") || text.includes("high")) return "Urgente";
  if (text.includes("media") || text.includes("normal")) return "Media";
  return "Normale";
}

/**
 * PropostaDettaglio: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function PropostaDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<RemoteState>("idle");
  const [order, setOrder] = useState<OrderDetail | null>(null);

  /**
   * load: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const load = () => {
    if (!id) {
      setState("empty");
      setOrder(null);
      return;
    }

    setState("loading");
    getOrderById(id)
      .then((response) => {
        setOrder(response);
        setState("ready");
      })
      .catch((error) => {
        setOrder(null);
        const status = getApiStatusFromError(error);
        if (status === 403) {
          setState("forbidden");
          return;
        }
        if (status === 404) {
          setState("empty");
          return;
        }
        setState("error");
      });
  };

  useEffect(() => {
    load();
  }, [id]);

  const totalFromItems = useMemo(
    () => (order?.items ?? []).reduce((sum, item) => sum + (item.importoV1 ?? 0), 0),
    [order]
  );

  const total = order?.totaleV1 ?? totalFromItems;
  const urgency = getUrgencyLabel(order?.livelloUrgenza ?? null);
  const statusLabel = order?.statoEvasione ?? order?.situazioneOrdine ?? "Sconosciuto";
  const currentStep = normalizeStep(statusLabel);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/proposte")} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Proposta {order?.externalDocId ?? id}
            </h1>
            {urgency === "Urgente" && <Badge variant="destructive">Urgente</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">Dettaglio ordine backend</p>
        </div>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "empty"}
        loadingMessage="Carico dettaglio proposta dal backend..."
        emptyMessage="Proposta non trovata nel backend."
        errorMessage="Errore caricamento dettaglio proposta."
        forbiddenMessage="Il tuo ruolo non puo consultare questo dettaglio."
        onRetry={load}
      />

      {state === "ready" && order && (
        <>
          <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>
                Workflow approva/rifiuta non ancora migrato server-side in questa vista. I dati mostrati sono in sola lettura.
              </div>
            </div>
          </div>

          <Card className="border-border/50 bg-background/50 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-info to-success" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Stato proposta
              </CardTitle>
              <p className="text-sm text-muted-foreground">Tracciamento stato ordine da backend</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                <div className="hidden md:block absolute top-[28px] left-[50px] right-[50px] h-[2px] bg-border/50 z-0" />
                {STEPS.map((step, idx) => {
                  const done = idx < currentStep;
                  const active = idx === currentStep;
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 w-full md:w-1/4">
                      {idx !== STEPS.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-[24px] top-[48px] bottom-[-16px] w-[2px] md:hidden z-0",
                            done ? "bg-primary" : "bg-border/50"
                          )}
                        />
                      )}
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300",
                          done
                            ? "bg-primary border-primary text-primary-foreground"
                            : active
                              ? "bg-background border-primary text-primary ring-4 ring-primary/20"
                              : "bg-muted border-border text-muted-foreground"
                        )}
                      >
                        {done ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 md:text-center">
                        <p className={cn("text-sm font-bold", active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 shadow-md">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Righe ordine
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                          <Package className="h-5 w-5 text-primary/70" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{item.desArt ?? "Descrizione non disponibile"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(item.quantRiga ?? 0).toLocaleString("it-IT")} x <span className="font-mono">{item.codArt ?? "-"}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-primary text-sm">{formatMoney(item.importoV1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Totale ordine</span>
                  <span className="text-xl font-bold text-primary">{formatMoney(total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Dettagli cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ragione sociale</p>
                  <p className="font-medium text-foreground">{order.customer.ragioneSociale ?? "Cliente non associato"}</p>
                </div>
                <Separator className="bg-border/50" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Data ordine</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(order.dataDoc)}</p>
                </div>
                <Separator className="bg-border/50" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Stato ERP</p>
                  <p className="text-sm font-medium text-foreground">{statusLabel}</p>
                </div>
                <Separator className="bg-border/50" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Urgenza</p>
                  <Badge variant={urgency === "Urgente" ? "destructive" : "secondary"}>{urgency}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
