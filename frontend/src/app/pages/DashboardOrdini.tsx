/**
 * File Overview: DashboardOrdini.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Clock,
  Euro,
  Eye,
  Package,
  ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router";
import { KPICard } from "../components/shared/KPICard";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { getOrders, type OrderListItem } from "../api/orders";
import {
  getApiStatusFromError,
  RemoteDataState,
  type RemoteState,
} from "../components/shared/RemoteDataState";

/**
 * DashboardOrdini: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function DashboardOrdini() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");
  const [state, setState] = useState<RemoteState>("idle");
  const backendReady = source === "backend" && state === "ready";

  /**
   * fetchOrders: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchOrders = () => {
    setState("loading");
    getOrders({ limit: 100, offset: 0 })
      .then((response) => {
        setOrders(response.data);
        setSource("backend");
        setState("ready");
      })
      .catch((error) => {
        setOrders([]);
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
      fetchOrders();
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
      fetchOrders();
    };
    window.addEventListener("authSessionReady", onAuthReady);
    return () => {
      active = false;
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, []);

  const kpi = useMemo(() => {
    const total = orders.length;
    const blocked = orders.filter((item) =>
      (item.situazioneOrdine ?? "").toLowerCase().includes("blocc")
    ).length;
    const urgent = orders.filter((item) =>
      (item.livelloUrgenza ?? "").toLowerCase().includes("urg")
    ).length;
    const totalValue = orders.reduce((sum, item) => sum + (item.totaleV1 ?? 0), 0);
    return { total, blocked, urgent, totalValue };
  }, [orders]);

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent-purple p-8 text-white shadow-2xl shadow-primary/30">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-sm text-white/80 uppercase tracking-wider">Gestione Ordini</span>
            <h1 className="text-3xl text-white mb-2">Ordini reali dal backend</h1>
            <p className="text-white/70 max-w-lg">
              Questa vista mostra solo dati reali da `sales.orders` e `sales.order_items`.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={source === "backend" ? "default" : "secondary"}>
              {source === "backend" ? "Dati backend" : "Fallback"}
            </Badge>
            <Button
              onClick={() => navigate("/catalogo")}
              className="bg-white text-primary hover:bg-white/90"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Nuovo Ordine
            </Button>
          </div>
        </div>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && orders.length === 0}
        loadingMessage="Carico gli ordini reali dal backend..."
        emptyMessage="Nessun ordine disponibile."
        errorMessage="Errore nel caricamento ordini."
        forbiddenMessage="Il tuo ruolo non puo consultare la lista ordini."
        onRetry={fetchOrders}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ordini Totali"
          value={backendReady ? String(kpi.total) : "N/D"}
          icon={Package}
          iconColor="text-primary"
          description={backendReady ? "record backend" : "backend non disponibile"}
        />
        <KPICard
          title="Ordini Bloccati"
          value={backendReady ? String(kpi.blocked) : "N/D"}
          icon={AlertCircle}
          iconColor="text-destructive"
          description={backendReady ? "da situazione ordine" : "backend non disponibile"}
        />
        <KPICard
          title="Ordini Urgenti"
          value={backendReady ? String(kpi.urgent) : "N/D"}
          icon={Clock}
          iconColor="text-warning"
          description={backendReady ? "da livello urgenza" : "backend non disponibile"}
        />
        <KPICard
          title="Valore Ordini"
          value={
            backendReady
              ? `EUR ${kpi.totalValue.toLocaleString("it-IT", { maximumFractionDigits: 2 })}`
              : "N/D"
          }
          icon={Euro}
          iconColor="text-success"
          description={backendReady ? "somma totale_v1" : "backend non disponibile"}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Ultimi ordini
            </CardTitle>
            <Button variant="outline" onClick={fetchOrders}>
              Aggiorna
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun ordine disponibile.</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border p-3 cursor-pointer hover:bg-accent/40 transition-colors"
                  onClick={() => navigate(`/ordini/${item.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.externalDocId}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.customer.ragioneSociale ?? "Cliente non associato"}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {item.totaleV1 != null
                        ? `EUR ${item.totaleV1.toLocaleString("it-IT", { maximumFractionDigits: 2 })}`
                        : "-"}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{item.statoEvasione ?? "stato n/d"}</Badge>
                    <Badge variant="outline">{item.livelloUrgenza ?? "urgenza n/d"}</Badge>
                    <span>{item.dataDoc ?? "data n/d"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
