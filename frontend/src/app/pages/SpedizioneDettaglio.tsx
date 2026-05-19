/**
 * File Overview: SpedizioneDettaglio.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  Package,
  Printer,
  Truck
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { KPICard } from "../components/shared/KPICard";
import { getShipmentById, updateShipmentStatus, type ShipmentDetailResponse } from "../api/shipments";
import { toast } from "sonner";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

type SourceMode = "backend" | "fallback";

type ShipmentDetailModel = {
  id: string;
  status: string;
  orderCode: string;
  customerName: string;
  destination: string;
  plannedDate: string;
  items: Array<{
    id: string;
    code: string;
    description: string;
    quantity: number;
  }>;
  ddt: Array<{
    id: string;
    numero: string;
    dataDoc: string;
    status: string;
  }>;
};

/**
 * prettyDate: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function prettyDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("it-IT");
}

/**
 * normalizeStatusLabel: descrive il comportamento principale di questa funzione.
 * @param status Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeStatusLabel(status: string): string {
  const value = status.toLowerCase();
  if (value.includes("deliver") || value.includes("complete")) return "Spedito";
  if (value.includes("ship") || value.includes("transit")) return "Pronto";
  if (value.includes("move")) return "Da Movimentare";
  return "In Preparazione";
}

/**
 * normalizeShipmentDetail: descrive il comportamento principale di questa funzione.
 * @param payload Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeShipmentDetail(payload: ShipmentDetailResponse["data"]): ShipmentDetailModel {
  return {
    id: payload.id,
    status: payload.status,
    orderCode: payload.order.externalDocId ? `#${payload.order.externalDocId}` : payload.id.slice(0, 8).toUpperCase(),
    customerName: payload.order.customerName ?? "Cliente non associato",
    destination: payload.destination ?? payload.order.customerAddress ?? payload.order.customerCity ?? "Destinazione non disponibile",
    plannedDate: prettyDate(payload.plannedDate ?? payload.order.dataConsegna),
    items: payload.items.map((item, index) => ({
      id: item.id,
      code: item.code ?? "-",
      description: item.description ?? `Riga ${index + 1}`,
      quantity: item.quantity ?? 0
    })),
    ddt: payload.ddt.map((item) => ({
      id: item.id,
      numero: item.numero ?? `DDT-${item.id.slice(0, 6).toUpperCase()}`,
      dataDoc: prettyDate(item.dataDoc),
      status: item.status ?? "emesso"
    }))
  };
}

/**
 * SpedizioneDettaglio: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function SpedizioneDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [source, setSource] = useState<SourceMode>("fallback");
  const [detail, setDetail] = useState<ShipmentDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [remoteState, setRemoteState] = useState<RemoteState>("idle");
  const [updating, setUpdating] = useState(false);

  /**
   * fetchShipmentDetail: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchShipmentDetail = () => {
    if (!id) {
      setLoading(false);
      setRemoteState("idle");
      return;
    }

    setLoading(true);
    setRemoteState("loading");
    getShipmentById(id)
      .then((response) => {
        setDetail(normalizeShipmentDetail(response.data));
        setSource("backend");
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

    if (!hasToken) {
      setLoading(false);
      setSource("fallback");
      setDetail(null);
      setRemoteState("idle");
    } else {
      fetchShipmentDetail();
    }

    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => fetchShipmentDetail();
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
      const response = await updateShipmentStatus(detail.id, nextStatus);
      const status = response.data.status;
      setDetail((prev) => (prev ? { ...prev, status } : prev));
      toast.success("Stato spedizione aggiornato");
    } catch {
      toast.error("Aggiornamento stato non riuscito");
    } finally {
      setUpdating(false);
    }
  };

  const totalPackages = useMemo(
    () => (detail ? detail.items.reduce((acc, item) => acc + item.quantity, 0) : 0),
    [detail]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Caricamento dettaglio spedizione...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <RemoteDataState
          state={remoteState}
          empty={false}
          loadingMessage="Caricamento dettaglio spedizione dal backend..."
          errorMessage="Errore nel caricamento del dettaglio spedizione."
          forbiddenMessage="Il tuo ruolo non puo consultare questa spedizione."
          onRetry={fetchShipmentDetail}
        />
        <h2 className="text-2xl font-bold">Spedizione non trovata</h2>
        <Button onClick={() => navigate("/allestimento")}>Torna all'allestimento</Button>
      </div>
    );
  }

  const isCompleted = normalizeStatusLabel(detail.status) === "Spedito";

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start justify-between bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/allestimento")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Torna indietro
            </Button>
            <Badge variant={source === "backend" ? "default" : "secondary"}>
              {source === "backend" ? "Dati backend" : "Fallback"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Scheda Spedizione {detail.orderCode}</h1>
            <Badge variant={isCompleted ? "secondary" : "default"} className="uppercase tracking-wider text-xs">
              {normalizeStatusLabel(detail.status)}
            </Badge>
            {isCompleted && (
              <Badge className="bg-success text-success-foreground px-2">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Evasa
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground pt-1">
            <MapPin className="h-4 w-4" />
            <span className="font-medium text-foreground">{detail.customerName}</span> - {detail.destination}
          </div>
        </div>

        {source === "backend" && (
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <Button variant="outline" onClick={() => void handleStatusUpdate("in_transit")} disabled={updating}>
                <Truck className="h-4 w-4 mr-2" /> In transito
              </Button>
            )}
            {!isCompleted && (
              <Button onClick={() => void handleStatusUpdate("delivered")} disabled={updating}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Segna spedita
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <KPICard title="Prodotti da spedire" value={String(detail.items.length)} icon={Package} />
        <KPICard title="Colli totali stimati" value={String(totalPackages)} icon={Truck} />
        <KPICard title="Data prevista" value={detail.plannedDate} icon={Clock} />
      </div>

      <Tabs defaultValue="prodotti" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1.5 rounded-xl h-auto">
          <TabsTrigger value="prodotti" className="rounded-lg py-3 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
            Prodotti
          </TabsTrigger>
          <TabsTrigger value="documenti" className="rounded-lg py-3 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
            Documenti
          </TabsTrigger>
          <TabsTrigger value="storico" className="rounded-lg py-3 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
            Storico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prodotti" className="outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Lista di prelievo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Prodotto</th>
                    <th className="px-5 py-3 text-left font-medium">Codice</th>
                    <th className="px-5 py-3 text-right font-medium">Quantita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {detail.items.length === 0 ? (
                    <tr>
                      <td className="px-5 py-4 text-muted-foreground" colSpan={3}>
                        Nessun prodotto associato alla spedizione.
                      </td>
                    </tr>
                  ) : (
                    detail.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-4">{item.description}</td>
                        <td className="px-5 py-4 font-mono text-xs">{item.code}</td>
                        <td className="px-5 py-4 text-right font-semibold">{item.quantity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documenti" className="outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">DDT associati</h3>
                </div>
                {detail.ddt.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessun DDT disponibile.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.ddt.map((item) => (
                      <div key={item.id} className="rounded-lg border p-3">
                        <p className="text-sm font-medium">{item.numero}</p>
                        <p className="text-xs text-muted-foreground">{item.dataDoc} - {item.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Azioni documento</h3>
                <Button variant="outline" className="w-full" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Scarica PDF
                </Button>
                <Button className="w-full" disabled>
                  <Printer className="h-4 w-4 mr-2" />
                  Stampa DDT
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storico" className="outline-none">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Stato attuale: {normalizeStatusLabel(detail.status)}</p>
                  <p className="text-xs text-muted-foreground">Ultimo aggiornamento dal backend.</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Data pianificata: {detail.plannedDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
