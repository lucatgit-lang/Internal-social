/**
 * File Overview: ClienteDettaglio.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Edit, Building2, TrendingUp, ExternalLink } from "lucide-react";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { getCustomerById, type CustomerDetail } from "../api/customers";
import { searchDocuments, type DocumentItem } from "../api/documents";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

/**
 * normalizeStatus: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeStatus(value: string | null | undefined): "Attivo" | "Non Attivo" | "Nuovo" {
  const raw = (value ?? "").toLowerCase();
  if (raw.includes("nuov")) return "Nuovo";
  if (raw.includes("non")) return "Non Attivo";
  return "Attivo";
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
 * formatNullableEuro: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatNullableEuro(value: number | null | undefined): string {
  if (value == null) return "-";
  return `EUR ${value.toLocaleString("it-IT", { maximumFractionDigits: 2 })}`;
}

/**
 * ClienteDettaglio: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ClienteDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");
  const [loading, setLoading] = useState(true);
  const [remoteState, setRemoteState] = useState<RemoteState>("idle");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const backendReady = source === "backend" && remoteState === "ready";

  /**
   * fetchCustomer: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchCustomer = () => {
    if (!id) {
      setLoading(false);
      setRemoteState("idle");
      return;
    }
    setLoading(true);
    setRemoteState("loading");
    getCustomerById(id)
      .then((data) => {
        setCustomer(data);
        setSource("backend");
        setRemoteState("ready");
      })
      .catch((error) => {
        setCustomer(null);
        setSource("fallback");
        const status = getApiStatusFromError(error);
        setRemoteState(status === 403 ? "forbidden" : "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
    if (hasToken) {
      fetchCustomer();
    } else {
      setSource("fallback");
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
    const onAuthReady = () => fetchCustomer();

    window.addEventListener("authSessionReady", onAuthReady);

    return () => {
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    if (source !== "backend") {
      setDocuments([]);
      return;
    }
    if (!customer?.ragioneSociale) {
      setDocuments([]);
      return;
    }
    void searchDocuments({ q: customer.ragioneSociale, limit: 20, offset: 0 })
      .then((response) => {
        if (!active) return;
        setDocuments(response.data);
      })
      .catch(() => {
        if (!active) return;
        setDocuments([]);
      });

    return () => {
      active = false;
    };
  }, [customer?.ragioneSociale, source]);

  const status = normalizeStatus(customer?.stato);
  const statusClass =
    status === "Attivo"
      ? "bg-success text-success-foreground"
      : status === "Nuovo"
      ? "bg-primary text-primary-foreground"
      : "bg-muted text-muted-foreground";

  const piva = customer?.partitaIva ?? customer?.codiceFiscale ?? customer?.externalCode ?? "-";
  const location = useMemo(() => {
    const comune = customer?.comune ?? "-";
    const provincia = customer?.provincia ?? "-";
    return `${comune} (${provincia})`;
  }, [customer?.comune, customer?.provincia]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clienti")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {customer?.ragioneSociale ?? "Dettaglio cliente"}
          </h1>
          <p className="text-muted-foreground mt-1">Dettagli cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={source === "backend" ? "default" : "secondary"}>
            {source === "backend" ? "Dati backend" : "Fallback"}
          </Badge>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Modifica
          </Button>
        </div>
      </div>

      <RemoteDataState
        state={remoteState}
        empty={false}
        loadingMessage="Caricamento dettaglio cliente dal backend..."
        errorMessage="Errore nel caricamento del cliente."
        forbiddenMessage="Il tuo ruolo non puo consultare questo cliente."
        onRetry={fetchCustomer}
      />

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stato</p>
                <Badge className={`mt-1 ${statusClass}`}>{status}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fatturato Totale</p>
                <p className="font-medium text-lg">{backendReady ? formatEuro(customer?.stats.totalAmount ?? 0) : "N/D"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                <Building2 className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ordini Totali</p>
                <p className="font-medium text-lg">{backendReady ? (customer?.stats.totalOrders ?? 0) : "N/D"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="anagrafica">
        <TabsList>
          <TabsTrigger value="anagrafica">Anagrafica</TabsTrigger>
          <TabsTrigger value="ordini">Ordini</TabsTrigger>
          <TabsTrigger value="documenti">Documenti</TabsTrigger>
        </TabsList>

        <TabsContent value="anagrafica">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Aziendali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Ragione Sociale:</span>
                <span className="font-medium text-right">{customer?.ragioneSociale ?? "-"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">P.IVA / CF:</span>
                <span className="font-medium">{piva}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Codice esterno:</span>
                <span className="font-medium">{customer?.externalCode ?? "-"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sede:</span>
                <span className="font-medium">{location}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordini">
          <Card>
            <CardHeader>
              <CardTitle>Storico Ordini</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Caricamento ordini cliente...</p>
              ) : !backendReady ? (
                <p className="text-muted-foreground">Backend non disponibile.</p>
              ) : (customer?.orders?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground">Nessun ordine registrato per questo cliente.</p>
              ) : (
                <div className="space-y-3">
                  {customer?.orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{order.externalDocId}</p>
                          <p className="text-xs text-muted-foreground">
                            Data ordine: {order.dataDoc ?? "-"} • Consegna: {order.dataConsegna ?? "-"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Badge variant="outline">
                              Stato: {order.statoEvasione ?? order.situazioneOrdine ?? "n/d"}
                            </Badge>
                            <Badge variant="outline">
                              Priorita: {order.livelloUrgenza ?? "normale"}
                            </Badge>
                            <Badge variant="outline">
                              Righe: {order.itemsCount} • Qta: {order.itemsQtyTotal.toLocaleString("it-IT")}
                            </Badge>
                            {order.shipment ? (
                              <Badge className="bg-info text-info-foreground">
                                Spedizione: {order.shipment.status ?? "in lavorazione"}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Spedizione non pianificata</Badge>
                            )}
                            {order.ddt ? (
                              <Badge className="bg-success text-success-foreground">
                                DDT {order.ddt.numero ?? order.ddt.id}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">DDT non presente</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-lg font-semibold text-primary">{formatNullableEuro(order.totaleV1)}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/ordini/${order.id}`)}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Apri ordine
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documenti">
          <Card>
            <CardHeader>
              <CardTitle>Documenti</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground">Contratti e documenti allegati non presenti.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="rounded-lg border border-border p-3">
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">{doc.relativePath}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
