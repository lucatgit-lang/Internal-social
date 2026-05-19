/**
 * File Overview: ProduzioneDettaglio.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Activity, ArrowLeft, CheckCircle2, Clock, Factory, Package } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getProductionJobById, updateProductionJobStatus, type ProductionJobDetailResponse } from "../api/production";
import { toast } from "sonner";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

type SourceMode = "backend" | "fallback";

type DetailModel = {
  id: string;
  status: string;
  priority: string;
  orderCode: string;
  customerName: string;
  totalValue: number;
  items: Array<{
    id: string;
    description: string;
    code: string;
    quantity: number;
    totalValue: number;
  }>;
};

/**
 * progressFromStatus: descrive il comportamento principale di questa funzione.
 * @param status Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function progressFromStatus(status: string): number {
  const value = status.toLowerCase();
  if (value.includes("complete") || value.includes("done")) return 100;
  if (value.includes("progress") || value.includes("running")) return 60;
  return 15;
}

/**
 * normalizeBackendDetail: descrive il comportamento principale di questa funzione.
 * @param payload Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeBackendDetail(payload: ProductionJobDetailResponse["data"]): DetailModel {
  return {
    id: payload.id,
    status: payload.status,
    priority: payload.priority,
    orderCode: payload.order.externalDocId ? `#${payload.order.externalDocId}` : payload.id.slice(0, 8).toUpperCase(),
    customerName: payload.order.customerName ?? "Cliente non associato",
    totalValue: payload.order.totaleV1 ?? 0,
    items: payload.items.map((item, index) => ({
      id: item.id,
      description: item.description ?? `Riga ${index + 1}`,
      code: item.code ?? "-",
      quantity: item.quantity ?? 0,
      totalValue: item.totalValue ?? 0
    }))
  };
}

/**
 * ProduzioneDettaglio: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ProduzioneDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [source, setSource] = useState<SourceMode>("fallback");
  const [detail, setDetail] = useState<DetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [remoteState, setRemoteState] = useState<RemoteState>("idle");
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * fetchDetail: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchDetail = () => {
    if (!id) {
      setLoading(false);
      setRemoteState("idle");
      return;
    }
    setLoading(true);
    setRemoteState("loading");
    getProductionJobById(id)
      .then((response) => {
        const normalized = normalizeBackendDetail(response.data);
        setDetail(normalized);
        setSource("backend");
        setProgress(progressFromStatus(normalized.status));
        setRemoteState("ready");
      })
      .catch((error) => {
        setSource("fallback");
        setDetail(null);
        const status = getApiStatusFromError(error);
        setRemoteState(status === 403 ? "forbidden" : "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));

    if (hasToken) {
      fetchDetail();
    } else {
      setSource("fallback");
      setDetail(null);
      setLoading(false);
      setRemoteState("idle");
    }

    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => fetchDetail();
    window.addEventListener("authSessionReady", onAuthReady);

    return () => {
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, [id]);

  /**
   * handleStatusUpdate: descrive il comportamento principale di questa funzione.
   * @param nextStatus Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleStatusUpdate = async (nextStatus: string) => {
    if (!detail || source !== "backend") return;
    setUpdating(true);
    try {
      const response = await updateProductionJobStatus(detail.id, nextStatus);
      const status = response.data.status;
      setDetail((prev) => (prev ? { ...prev, status } : prev));
      setProgress(progressFromStatus(status));
      toast.success("Stato produzione aggiornato");
    } catch {
      toast.error("Aggiornamento stato non riuscito");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Caricamento dettaglio produzione...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <RemoteDataState
          state={remoteState}
          empty={false}
          loadingMessage="Caricamento dettaglio produzione dal backend..."
          errorMessage="Errore nel caricamento del dettaglio produzione."
          forbiddenMessage="Il tuo ruolo non puo consultare questo job di produzione."
          onRetry={fetchDetail}
        />
        <h2 className="text-2xl font-bold">Produzione non trovata</h2>
        <Button onClick={() => navigate("/produzione")}>Torna alla Produzione</Button>
      </div>
    );
  }

  const totalQty = detail.items.reduce((acc, item) => acc + item.quantity, 0);
  const producedQty = Math.floor((totalQty * progress) / 100);
  const isCompleted = progress >= 100;

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start justify-between bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/produzione")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Torna indietro
            </Button>
            <Badge variant={source === "backend" ? "default" : "secondary"}>
              {source === "backend" ? "Dati backend" : "Fallback"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Dettaglio Produzione {detail.orderCode}</h1>
            <Badge variant={isCompleted ? "secondary" : "default"} className="uppercase tracking-wider text-xs bg-info/10 text-info hover:bg-info/20">
              {detail.status}
            </Badge>
            {isCompleted && (
              <Badge className="bg-success text-success-foreground px-2">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Terminato
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground pt-1">
            <Factory className="h-4 w-4" />
            <span className="font-medium text-foreground">{detail.customerName}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <Activity className={`h-5 w-5 ${isCompleted ? "text-success" : "text-info animate-pulse"}`} />
            <span className="font-semibold text-lg">{progress}%</span>
          </div>
          {source === "backend" && (
            <div className="flex gap-2">
              {!isCompleted && (
                <Button variant="outline" onClick={() => void handleStatusUpdate("in_progress")} disabled={updating}>
                  Avvia
                </Button>
              )}
              {!isCompleted && (
                <Button onClick={() => void handleStatusUpdate("completed")} disabled={updating}>
                  Completa
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantita da produrre</p>
              <p className="text-2xl font-bold">{totalQty} pz</p>
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-4" />
          <p className="text-xs text-right mt-2 text-muted-foreground">
            {producedQty} / {totalQty} completati
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priorita</p>
              <p className="text-2xl font-bold capitalize">{detail.priority}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Factory className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valore ordine</p>
              <p className="text-2xl font-bold">
                EUR {detail.totalValue.toLocaleString("it-IT", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Dettaglio linee di produzione</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/10 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Prodotto</th>
                <th className="px-5 py-3 text-left font-medium">Codice</th>
                <th className="px-5 py-3 text-right font-medium">Totale (pz)</th>
                <th className="px-5 py-3 text-right font-medium">Valore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {detail.items.length === 0 ? (
                <tr>
                  <td className="px-5 py-4 text-muted-foreground" colSpan={4}>
                    Nessuna riga prodotto disponibile.
                  </td>
                </tr>
              ) : (
                detail.items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-5 py-4 font-medium">{item.description}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end sm:justify-start">
                        <span className="font-mono text-xs">{item.code}</span>
                        {item.code && item.code !== "-" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() =>
                              navigate(`/tecnico/distinte?productCode=${encodeURIComponent(item.code)}`)
                            }
                          >
                            BOM
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">{item.quantity}</td>
                    <td className="px-5 py-4 text-right">
                      EUR {item.totalValue.toLocaleString("it-IT", { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
