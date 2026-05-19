/**
 * File Overview: AvviaProduzioneModal.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { notify } from "../../utils/notifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { InfoTooltip } from "../ui/info-tooltip";
import { AlertCircle, ArrowRight, Clock, Package, Play } from "lucide-react";
import { getProductionJobs, type ProductionJob } from "../../api/production";
import { getApiStatusFromError, type RemoteState } from "../shared/RemoteDataState";

interface OrderDetail {
  id: string;
  label: string;
  client: string;
  volume: string;
  timeEst: string;
  status: "pronto" | "in_attesa";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOrderId?: string;
}

/**
 * normalizeStatus: descrive il comportamento principale di questa funzione.
 * @param raw Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeStatus(raw: string | null | undefined): OrderDetail["status"] {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("queue") || value.includes("planned") || value.includes("ready")) return "pronto";
  return "in_attesa";
}

/**
 * normalizeVolume: descrive il comportamento principale di questa funzione.
 * @param priority Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeVolume(priority: string | null | undefined): string {
  const value = (priority ?? "").toLowerCase();
  if (value.includes("high") || value.includes("alta")) return "Priorita alta";
  return "Priorita normale";
}

/**
 * mapJobsToOrders: descrive il comportamento principale di questa funzione.
 * @param jobs Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function mapJobsToOrders(jobs: ProductionJob[]): OrderDetail[] {
  return jobs.map((job) => ({
    id: job.id,
    label: job.orderExternalDocId ?? `JOB-${job.id.slice(0, 8).toUpperCase()}`,
    client: job.customerName ?? "Cliente non associato",
    volume: normalizeVolume(job.priority),
    timeEst: "Stimato: 3h 00m",
    status: normalizeStatus(job.status),
  }));
}

/**
 * AvviaProduzioneModal: descrive il comportamento principale di questa funzione.
 * @param open Input richiesto dalla funzione.
 * @param onOpenChange Input richiesto dalla funzione.
 * @param initialOrderId Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function AvviaProduzioneModal({ open, onOpenChange, initialOrderId }: Props) {
  const navigate = useNavigate();
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [state, setState] = useState<RemoteState>("idle");
  const [jobs, setJobs] = useState<ProductionJob[]>([]);

  const combinedOrders = useMemo(() => mapJobsToOrders(jobs), [jobs]);
  const selectedOrder = combinedOrders.find((o) => o.id === selectedOrderId);

  const loadJobs = React.useCallback(() => {
    setState("loading");
    getProductionJobs({ limit: 100, offset: 0 })
      .then((response) => {
        setJobs(response.data);
        setState("ready");
      })
      .catch((error) => {
        setJobs([]);
        const status = getApiStatusFromError(error);
        setState(status === 403 ? "forbidden" : "error");
      });
  }, []);

  React.useEffect(() => {
    if (open) {
      loadJobs();
      if (initialOrderId) {
        setSelectedOrderId(initialOrderId);
      }
    } else {
      setSelectedOrderId("");
      setState("idle");
      setJobs([]);
    }
  }, [initialOrderId, loadJobs, open]);

  /**
   * handleConfirm: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleConfirm = () => {
    if (!selectedOrder) return;
    notify.success(
      "Produzione pronta",
      `Job ${selectedOrder.label} selezionato. Apertura reparto produzione per avanzamento operativo.`,
      {
        action: {
          label: "Apri Produzione",
          onClick: () => navigate("/produzione"),
        },
      }
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Play className="h-6 w-6 text-primary fill-primary" />
            Avvia Produzione
            <InfoTooltip text="Lista alimentata da backend ops.production_jobs. In questa fase il modal e consultivo e apre la sezione Produzione." />
          </DialogTitle>
          <DialogDescription>
            Seleziona il job produzione da monitorare nel reparto operativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>
                Modal backend-first in sola lettura. L'avvio transazionale della produzione verra collegato a endpoint dedicato.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Scegli job dalla coda backend:</label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger className="w-full text-lg h-12">
                <SelectValue placeholder="Seleziona un job produzione..." />
              </SelectTrigger>
              <SelectContent>
                {combinedOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{order.label}</span>
                      <span>- {order.client}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state === "loading" && <p className="text-sm text-muted-foreground">Caricamento coda produzione...</p>}
          {state === "forbidden" && <p className="text-sm text-destructive">Il tuo ruolo non puo consultare la coda produzione.</p>}
          {state === "error" && <p className="text-sm text-destructive">Errore nel caricamento della coda produzione.</p>}
          {state === "ready" && combinedOrders.length === 0 && (
            <p className="text-sm text-muted-foreground">Nessun job produzione disponibile nel backend.</p>
          )}

          {selectedOrder && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Package className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Job</p>
                    <p className="text-base font-bold">{selectedOrder.label}</p>
                  </CardContent>
                </Card>
                <Card className="bg-warning/5 border-warning/20 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Clock className="h-5 w-5 text-warning mb-2" />
                    <p className="text-sm text-muted-foreground">Tempo Stimato</p>
                    <p className="text-base font-bold">{selectedOrder.timeEst}</p>
                  </CardContent>
                </Card>
                <Card className="bg-info/5 border-info/20 shadow-sm col-span-2">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <ArrowRight className="h-5 w-5 text-info mb-2" />
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="text-base font-semibold">{selectedOrder.client}</p>
                    <Badge variant="outline" className="mt-2">{selectedOrder.volume}</Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annulla
                </Button>
                <Button
                  className="gap-2 px-8 shadow-lg shadow-primary/25 bg-[#0066FF] hover:bg-[#0055FF] text-white"
                  onClick={handleConfirm}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Apri Produzione
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
