/**
 * File Overview: Serbatoi.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, Container, Droplets } from "lucide-react";
import { KPICard } from "../components/shared/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { InfoTooltip } from "../components/ui/info-tooltip";
import { getApiStatusFromError, RemoteDataState, type RemoteState } from "../components/shared/RemoteDataState";
import { getMaterialNeeds, type MaterialNeedsResponse } from "../api/reports";

type VirtualTank = {
  id: string;
  nome: string;
  capacita: number;
  livello: number;
  percentuale: number;
  stato: "critico" | "basso" | "normale";
  ultimoAggiornamento: string;
  ordiniCount: number;
};

/**
 * normalizeTankState: descrive il comportamento principale di questa funzione.
 * @param percentuale Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeTankState(percentuale: number): VirtualTank["stato"] {
  if (percentuale <= 10) return "critico";
  if (percentuale <= 25) return "basso";
  return "normale";
}

/**
 * buildVirtualTanks: descrive il comportamento principale di questa funzione.
 * @param payload Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function buildVirtualTanks(payload: MaterialNeedsResponse | null): VirtualTank[] {
  if (!payload) return [];

  return payload.rows.slice(0, 12).map((row) => {
    const capacity = Math.max(row.requestedQty * 1.25, 100);
    const livello = Math.max(capacity - row.requestedQty, 0);
    const percentuale = Math.round((livello / capacity) * 100);
    return {
      id: row.code,
      nome: row.name,
      capacita: capacity,
      livello,
      percentuale,
      stato: normalizeTankState(percentuale),
      ultimoAggiornamento: new Date(payload.window.to).toLocaleDateString("it-IT"),
      ordiniCount: row.ordersCount,
    };
  });
}

/**
 * Serbatoi: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Serbatoi() {
  const [state, setState] = useState<RemoteState>("idle");
  const [source, setSource] = useState<"backend" | "offline">("offline");
  const [payload, setPayload] = useState<MaterialNeedsResponse | null>(null);

  /**
   * fetchData: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchData = () => {
    setState("loading");
    getMaterialNeeds()
      .then((response) => {
        setPayload(response);
        setSource("backend");
        setState("ready");
      })
      .catch((error) => {
        setPayload(null);
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

    fetchData();
    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => fetchData();
    window.addEventListener("authSessionReady", onAuthReady);
    return () => window.removeEventListener("authSessionReady", onAuthReady);
  }, []);

  const virtualTanks = useMemo(() => buildVirtualTanks(payload), [payload]);

  const capacitaTotale = virtualTanks.reduce((acc, t) => acc + t.capacita, 0);
  const livelloTotale = virtualTanks.reduce((acc, t) => acc + t.livello, 0);
  const livelloMedio = capacitaTotale > 0 ? Math.round((livelloTotale / capacitaTotale) * 100) : 0;
  const alertCritici = virtualTanks.filter((t) => t.stato === "critico").length;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            Gestione Serbatoi
            <InfoTooltip text="Vista backend-first basata su fabbisogno materiali reale. I livelli fisici da sensori/PLC non sono ancora integrati." />
          </h1>
          <Badge variant={source === "backend" ? "default" : "secondary"}>
            {source === "backend" ? "Dati backend" : "Backend non disponibile"}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">Monitoraggio fabbisogno materiali su ordini reali</p>
      </div>

      <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <div>
            I livelli mostrati sono una stima operativa calcolata dal backend (`material-needs`) e non misure fisiche live da serbatoi.
          </div>
        </div>
      </div>

      <RemoteDataState
        state={state}
        empty={state === "ready" && virtualTanks.length === 0}
        loadingMessage="Carico fabbisogno materiali dal backend..."
        emptyMessage="Nessun materiale disponibile per la finestra corrente."
        errorMessage="Errore nel caricamento dei dati serbatoi backend."
        forbiddenMessage="Il tuo ruolo non puo consultare questa sezione."
        onRetry={fetchData}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Materiali Tracciati" value={String(virtualTanks.length)} icon={Container} iconColor="text-primary" />
        <KPICard title="Capacita Stimata" value={`${Math.round(capacitaTotale).toLocaleString("it-IT")} L`} icon={Droplets} iconColor="text-info" />
        <KPICard title="Livello Medio" value={`${livelloMedio}%`} icon={Activity} iconColor="text-success" />
        <KPICard
          title="Alert Critici"
          value={String(alertCritici)}
          icon={AlertCircle}
          iconColor={alertCritici > 0 ? "text-destructive" : "text-muted-foreground"}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {virtualTanks.map((serbatoio) => (
          <Card
            key={serbatoio.id}
            className={
              serbatoio.stato === "critico"
                ? "border-destructive"
                : serbatoio.stato === "basso"
                  ? "border-warning"
                  : ""
            }
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{serbatoio.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Capacita stimata: {Math.round(serbatoio.capacita).toLocaleString("it-IT")} L
                  </p>
                </div>
                <Badge
                  className={
                    serbatoio.stato === "critico"
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : serbatoio.stato === "basso"
                        ? "bg-warning text-warning-foreground"
                        : "bg-success text-success-foreground"
                  }
                >
                  {serbatoio.stato.charAt(0).toUpperCase() + serbatoio.stato.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Disponibilita stimata</span>
                  <span className="text-2xl font-semibold">{serbatoio.percentuale}%</span>
                </div>
                <Progress
                  value={serbatoio.percentuale}
                  className={`h-3 ${
                    serbatoio.stato === "critico"
                      ? "[&>div]:bg-destructive"
                      : serbatoio.stato === "basso"
                        ? "[&>div]:bg-warning"
                        : "[&>div]:bg-success"
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Residuo stimato:</span>
                <span className="font-medium">{Math.round(serbatoio.livello).toLocaleString("it-IT")} L</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ordini impattati:</span>
                <span className="font-medium">{serbatoio.ordiniCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ultimo aggiornamento:</span>
                <span className="font-medium">{serbatoio.ultimoAggiornamento}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
