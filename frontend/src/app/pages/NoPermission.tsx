/**
 * File Overview: NoPermission.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useNavigate } from "react-router";
import { ShieldX } from "lucide-react";
import { Button } from "../components/ui/button";

/**
 * NoPermission: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function NoPermission() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold">Accesso non autorizzato</h1>
        <p className="text-sm text-muted-foreground">
          Non hai i permessi necessari per accedere a questa sezione.
        </p>
        <Button onClick={() => navigate("/")}>Torna alla dashboard</Button>
      </div>
    </div>
  );
}
