/**
 * File Overview: QuickActions.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { ShoppingCart, FileText, Package, Users } from "lucide-react";

/**
 * QuickActions: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function QuickActions() {
  const actions = [
    { label: "Nuovo Ordine", icon: ShoppingCart, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "Nuova Proposta", icon: FileText, color: "text-accent-purple", bgColor: "bg-accent-purple/10" },
    { label: "Nuovo Articolo", icon: Package, color: "text-success", bgColor: "bg-success/10" },
    { label: "Nuovo Cliente", icon: Users, color: "text-info", bgColor: "bg-info/10" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => (
        <Card key={action.label} className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.bgColor}`}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <span className="font-medium">{action.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
