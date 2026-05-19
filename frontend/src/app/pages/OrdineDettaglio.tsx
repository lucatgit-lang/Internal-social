/**
 * File Overview: OrdineDettaglio.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ArrowLeft, Edit, Printer, Package, Truck, User, Clock } from "lucide-react";
import { Separator } from "../components/ui/separator";
import { getOrderById, type OrderDetail } from "../api/orders";
import { searchDocuments, type DocumentItem } from "../api/documents";

/**
 * formatEuro: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatEuro(value: number | null): string {
  if (value == null) return "-";
  return `EUR ${value.toLocaleString("it-IT", { maximumFractionDigits: 2 })}`;
}

/**
 * toStatusLabel: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function toStatusLabel(value: string | null): string {
  if (!value) return "n/d";
  const normalized = value.replace(/_/g, " ").trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * OrdineDettaglio: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function OrdineDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [source, setSource] = useState<"backend" | "local">("local");
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    let active = true;
    let fetched = false;
    if (!id) {
      setLoading(false);
      return;
    }

    /**
     * fetchOrder: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const fetchOrder = () =>
      getOrderById(id)
      .then((data) => {
        if (!active) return;
        setOrder(data);
        setSource("backend");
      })
      .catch(() => {
        if (!active) return;
        setOrder(null);
        setSource("local");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    /**
     * runFetchIfTokenAvailable: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const runFetchIfTokenAvailable = () => {
      if (fetched) return;
      const hasToken =
        typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
      if (!hasToken) return;
      fetched = true;
      void fetchOrder();
    };

    runFetchIfTokenAvailable();

    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => {
      runFetchIfTokenAvailable();
    };

    window.addEventListener("authSessionReady", onAuthReady);

    return () => {
      active = false;
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    if (!order?.externalDocId) {
      setDocuments([]);
      return;
    }
    if (source !== "backend") {
      setDocuments([]);
      return;
    }
    void searchDocuments({ q: order.externalDocId, limit: 20, offset: 0 })
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
  }, [order?.externalDocId, source]);

  const effectiveId = order?.externalDocId ?? id ?? "-";
  const statusLabel = toStatusLabel(order?.statoEvasione ?? order?.situazioneOrdine ?? null);
  const customerName = order?.customer.ragioneSociale ?? "Cliente non associato";

  const totItems = useMemo(
    () => order?.items.reduce((sum, item) => sum + (item.quantRiga ?? 0), 0) ?? 0,
    [order]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ordini")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">Ordine {effectiveId}</h1>
          <p className="text-muted-foreground mt-1">Dettagli e storico ordine</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={source === "backend" ? "default" : "secondary"}>
            {source === "backend" ? "Dati backend" : "Dati locali"}
          </Badge>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Stampa
          </Button>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Modifica
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stato</p>
                <Badge className="mt-1 bg-info text-info-foreground">{statusLabel}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <User className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{customerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Consegna</p>
                <p className="font-medium">{order?.dataConsegna ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-purple/10">
                <Truck className="h-5 w-5 text-accent-purple" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale</p>
                <p className="font-medium text-lg">{formatEuro(order?.totaleV1 ?? null)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dettagli" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dettagli">Dettagli</TabsTrigger>
          <TabsTrigger value="articoli">Articoli</TabsTrigger>
          <TabsTrigger value="storico">Storico</TabsTrigger>
          <TabsTrigger value="documenti">Documenti</TabsTrigger>
        </TabsList>

        <TabsContent value="dettagli" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Ordine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Ordine:</span>
                  <span className="font-medium">{order?.dataDoc ?? "-"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Consegna:</span>
                  <span className="font-medium">{order?.dataConsegna ?? "-"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priorita:</span>
                  <Badge className="bg-warning text-warning-foreground">
                    {toStatusLabel(order?.livelloUrgenza ?? null)}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Righe Ordine:</span>
                  <span className="font-medium">{order?.items.length ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informazioni Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Ragione Sociale:</span>
                  <span className="font-medium text-right">{customerName}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Cliente:</span>
                  <span className="font-medium">{order?.customer.id ?? "-"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doc ID:</span>
                  <span className="font-medium">{order?.externalDocId ?? "-"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantita totale:</span>
                  <span className="font-medium">{totItems}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="articoli">
          <Card>
            <CardHeader>
              <CardTitle>Articoli Ordinati</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Caricamento articoli...</p>
              ) : order?.items.length ? (
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-accent">
                      <div>
                        <p className="font-medium">{item.desArt ?? "Articolo senza descrizione"}</p>
                        <p className="text-sm text-muted-foreground">Codice: {item.codArt ?? "-"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.quantRiga ?? 0}</p>
                        <p className="text-sm text-muted-foreground">{formatEuro(item.importoV1 ?? null)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nessun articolo disponibile</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storico">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Ordine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Ordine registrato</p>
                  <p className="text-sm text-muted-foreground">{order?.dataDoc ?? "-"}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Stato attuale</p>
                  <p className="text-sm text-muted-foreground">{statusLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documenti">
          <Card>
            <CardHeader>
              <CardTitle>Documenti Allegati</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground">Nessun documento disponibile</p>
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
