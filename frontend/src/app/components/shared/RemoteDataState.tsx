/**
 * File Overview: RemoteDataState.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { AlertCircle, Ban, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";

export type RemoteState = "idle" | "loading" | "ready" | "error" | "forbidden";

interface RemoteDataStateProps {
  state: RemoteState;
  empty?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
  forbiddenMessage?: string;
  onRetry?: () => void;
}

/**
 * getApiStatusFromError: descrive il comportamento principale di questa funzione.
 * @param error Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function getApiStatusFromError(error: unknown): number | null {
  if (!(error instanceof Error)) return null;
  const match = error.message.match(/API_GET_FAILED:(\d{3})/);
  if (!match) return null;
  return Number(match[1]);
}

/**
 * RemoteDataState: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export function RemoteDataState({
  state,
  empty = false,
  loadingMessage = "Caricamento dati in corso...",
  emptyMessage = "Nessun dato disponibile.",
  errorMessage = "Errore nel caricamento dati.",
  forbiddenMessage = "Non hai i permessi per visualizzare questi dati.",
  onRetry,
}: RemoteDataStateProps) {
  if (state === "ready" && !empty) return null;

  if (state === "loading") {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Caricamento</AlertTitle>
        <AlertDescription>{loadingMessage}</AlertDescription>
      </Alert>
    );
  }

  if (state === "forbidden") {
    return (
      <Alert variant="destructive">
        <Ban className="h-4 w-4" />
        <AlertTitle>Accesso negato</AlertTitle>
        <AlertDescription>{forbiddenMessage}</AlertDescription>
      </Alert>
    );
  }

  if (state === "error") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Errore</AlertTitle>
        <AlertDescription>
          <p>{errorMessage}</p>
          {onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Riprova
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  if (empty) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Nessun risultato</AlertTitle>
        <AlertDescription>{emptyMessage}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
