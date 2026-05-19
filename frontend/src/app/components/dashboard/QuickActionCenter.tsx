/**
 * File Overview: QuickActionCenter.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  Cog, 
  TruckIcon,
  ClipboardList,
  Factory
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { useNavigate } from "react-router";
import { useMemo } from "react";

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  route: string;
  gradient: string;
  iconColor: string;
}

interface QuickActionCenterProps {
  summary?: {
    openOrders: number;
    queuedProduction: number;
    pendingShipments: number;
    totalCustomers: number;
    totalProducts: number;
  } | null;
  backendReady?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: "1",
    title: "Nuovo Ordine",
    subtitle: "Crea ordine cliente",
    icon: ShoppingCart,
    route: "/ordini",
    gradient: "from-primary/10 to-primary/5",
    iconColor: "text-primary",
  },
  {
    id: "2",
    title: "Nuova Produzione",
    subtitle: "Avvia ciclo produttivo",
    icon: Factory,
    route: "/produzione",
    gradient: "from-success/10 to-success/5",
    iconColor: "text-success",
  },
  {
    id: "3",
    title: "Nuovo Allestimento",
    subtitle: "Prepara spedizione",
    icon: TruckIcon,
    route: "/allestimento",
    gradient: "from-info/10 to-info/5",
    iconColor: "text-info",
  },
  {
    id: "4",
    title: "Nuovo Cliente",
    subtitle: "Aggiungi anagrafica",
    icon: Users,
    route: "/clienti",
    gradient: "from-accent-purple/10 to-accent-purple/5",
    iconColor: "text-accent-purple",
  },
  {
    id: "5",
    title: "Nuova Proposta",
    subtitle: "Genera preventivo",
    icon: FileText,
    route: "/proposte",
    gradient: "from-warning/10 to-warning/5",
    iconColor: "text-warning",
  },
  {
    id: "6",
    title: "Nuovo Articolo",
    subtitle: "Aggiungi prodotto",
    icon: Package,
    route: "/articoli",
    gradient: "from-accent-cyan/10 to-accent-cyan/5",
    iconColor: "text-accent-cyan",
  },
  {
    id: "7",
    title: "Ordine Magazzino",
    subtitle: "Riordina materiali",
    icon: ClipboardList,
    route: "/magazzino",
    gradient: "from-destructive/10 to-destructive/5",
    iconColor: "text-destructive",
  },
  {
    id: "8",
    title: "Gestione Fabbisogno",
    subtitle: "Calcola necessità",
    icon: Cog,
    route: "/fabbisogno",
    gradient: "from-muted-foreground/10 to-muted-foreground/5",
    iconColor: "text-muted-foreground",
  },
];

/**
 * QuickActionCenter: descrive il comportamento principale di questa funzione.
 * @param summary Input richiesto dalla funzione.
 * @param backendReady Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function QuickActionCenter({ summary, backendReady = false }: QuickActionCenterProps) {
  const navigate = useNavigate();
  const actions = useMemo(() => {
    return quickActions.map((action) => {
      if (!summary || !backendReady) {
        if (["1", "2", "3", "4", "6"].includes(action.id)) {
          return { ...action, subtitle: "N/D - backend non disponibile" };
        }
        return action;
      }
      if (action.id === "1") {
        return { ...action, subtitle: `${summary.openOrders} ordini aperti` };
      }
      if (action.id === "2") {
        return { ...action, subtitle: `${summary.queuedProduction} da avviare` };
      }
      if (action.id === "3") {
        return { ...action, subtitle: `${summary.pendingShipments} spedizioni aperte` };
      }
      if (action.id === "4") {
        return { ...action, subtitle: `${summary.totalCustomers} clienti registrati` };
      }
      if (action.id === "6") {
        return { ...action, subtitle: `${summary.totalProducts} articoli tecnici` };
      }
      return action;
    });
  }, [summary, backendReady]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">
            Accedi rapidamente alle funzioni principali
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Card
              key={action.id}
              className={`bg-gradient-to-br ${action.gradient} hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-border/50 group`}
              onClick={() => navigate(action.route)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className={`p-4 rounded-2xl bg-background/80 backdrop-blur-sm ${action.iconColor} group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="h-8 w-8" />
                </div>
                
                <div>
                  <h3 className="font-semibold mb-1">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
