/**
 * File Overview: ActionableKPIs.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { ShoppingCart, AlertTriangle, TrendingUp, Package, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";
import { useMemo } from "react";
import type { OperationalSnapshot } from "../../assistant/types";

interface ActionableKPIsProps {
  snapshot?: OperationalSnapshot;
  monthlySummary?: {
    totalOrders: number;
    completedOrders: number;
    blockedOrders: number;
    pendingOrders: number;
    totalValue: number;
  };
  backendReady?: boolean;
}

interface ActionableKPI {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  gradient: string;
  action: string;
  route: string;
}

/**
 * formatEuroCompact: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatEuroCompact(value: number): string {
  return `EUR ${value.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`;
}

/**
 * ActionableKPIs: descrive il comportamento principale di questa funzione.
 * @param snapshot Input richiesto dalla funzione.
 * @param monthlySummary Input richiesto dalla funzione.
 * @param backendReady Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ActionableKPIs({ snapshot, monthlySummary, backendReady = false }: ActionableKPIsProps) {
  const navigate = useNavigate();

  const kpis = useMemo<ActionableKPI[]>(() => {
    const pendingOrders = monthlySummary?.pendingOrders ?? 0;
    const blockedOrders = snapshot?.blockedOrders ?? monthlySummary?.blockedOrders ?? 0;
    const pipelineValue = monthlySummary?.totalValue ?? 0;
    const lateShipments = snapshot?.lateShipments ?? 0;
    const showFallbackAsNoData = !backendReady;

    return [
      {
        id: "1",
        title: "Ordini da Evadere",
        value: showFallbackAsNoData ? "N/D" : String(pendingOrders),
        subtitle: "Ordini in attesa di lavorazione",
        icon: ShoppingCart,
        iconColor: "text-primary",
        gradient: "from-primary/10 to-primary/5",
        action: "Vai agli Ordini",
        route: "/ordini",
      },
      {
        id: "2",
        title: "Ordini Bloccati",
        value: showFallbackAsNoData ? "N/D" : String(blockedOrders),
        subtitle: "Richiedono attenzione immediata",
        icon: AlertTriangle,
        iconColor: "text-destructive",
        gradient: "from-destructive/10 to-destructive/5",
        action: "Risolvi",
        route: "/ordini",
      },
      {
        id: "3",
        title: "Valore Pipeline",
        value: showFallbackAsNoData ? "N/D" : formatEuroCompact(pipelineValue),
        subtitle: "Valore ordini nel periodo",
        icon: TrendingUp,
        iconColor: "text-success",
        gradient: "from-success/10 to-success/5",
        action: "Vedi Dettaglio",
        route: "/report/ordini",
      },
      {
        id: "4",
        title: "Spedizioni in Ritardo",
        value: showFallbackAsNoData ? "N/D" : String(lateShipments),
        subtitle: "Spedizioni da riallineare",
        icon: Package,
        iconColor: "text-warning",
        gradient: "from-warning/10 to-warning/5",
        action: "Gestisci",
        route: "/allestimento",
      },
    ];
  }, [snapshot, monthlySummary, backendReady]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Panoramica Operativa</h2>
        <p className="text-sm text-muted-foreground">
          KPI azionabili con accesso diretto
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <Card
              key={kpi.id}
              className={`bg-gradient-to-br ${kpi.gradient} hover:shadow-xl transition-all group cursor-pointer border-border/50`}
              onClick={() => navigate(kpi.route)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-background/80 backdrop-blur-sm ${kpi.iconColor} shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-3xl font-bold mb-1">{kpi.value}</h3>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {kpi.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {kpi.subtitle}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(kpi.route);
                  }}
                >
                  {kpi.action}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
