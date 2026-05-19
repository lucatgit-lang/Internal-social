/**
 * File Overview: RequireRole.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useUser } from "../../contexts/UserContext";

/**
 * RequireRole: descrive il comportamento principale di questa funzione.
 * @param allowedRoles Input richiesto dalla funzione.
 * @param children Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function RequireRole({ allowedRoles, children }: { allowedRoles: string[]; children: ReactNode }) {
  const { user } = useUser();
  const userRole = (user?.role ?? "").toLowerCase();
  const allowed = allowedRoles.map((role) => role.toLowerCase());

  if (!allowed.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
