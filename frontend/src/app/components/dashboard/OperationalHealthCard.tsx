/**
 * File Overview: OperationalHealthCard.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { AlertTriangle, ArrowRight, HeartPulse } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { calculateOperationalHealth } from "../../assistant/operationalHealth";
import type { OperationalSnapshot } from "../../assistant/types";

interface OperationalHealthCardProps {
  snapshot: OperationalSnapshot;
}

const levelColor = {
  ottimo: "bg-emerald-100 text-emerald-700 border-emerald-200",
  buono: "bg-blue-100 text-blue-700 border-blue-200",
  attenzione: "bg-amber-100 text-amber-700 border-amber-200",
  critico: "bg-red-100 text-red-700 border-red-200",
};

/**
 * OperationalHealthCard: descrive il comportamento principale di questa funzione.
 * @param snapshot Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function OperationalHealthCard({ snapshot }: OperationalHealthCardProps) {
  const navigate = useNavigate();
  const health = calculateOperationalHealth(snapshot);

  return (
    <Card className="border-l-4 border-l-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HeartPulse className="h-5 w-5 text-primary" />
            Salute Operativa
          </CardTitle>
          <Badge className={levelColor[health.level]}>{health.level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-sm text-muted-foreground">Score operativo (0-100)</p>
          <p className="text-3xl font-bold tracking-tight">{health.score}</p>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${health.score}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          {health.drivers.map((driver, idx) => (
            <p key={`${driver}-${idx}`} className="text-sm text-muted-foreground">
              {driver}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Anomaly Center
          </p>
          {health.anomalies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna anomalia critica attiva.</p>
          ) : (
            health.anomalies.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-border p-2"
              >
                <span className="text-sm">{item.label}</span>
                <Button size="sm" variant="outline" onClick={() => navigate(item.route)}>
                  Risolvi
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
