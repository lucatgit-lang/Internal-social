/**
 * File Overview: CompactOrderTable.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { ArrowRight, Eye, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";

interface Order {
  id: string;
  cliente: string;
  totale: string;
  stato: "in_attesa" | "in_produzione" | "in_allestimento" | "spedito" | "completato";
  priorita: "normale" | "alta" | "urgente";
  scadenza: string;
  articoli: number;
}

interface CompactOrderTableProps {
  orders: Order[];
  title: string;
  showActions?: boolean;
}

const statoConfig = {
  in_attesa: {
    label: "In Attesa",
    color: "bg-warning text-warning-foreground",
    icon: Clock,
  },
  in_produzione: {
    label: "In Produzione",
    color: "bg-info text-info-foreground",
    icon: Zap,
  },
  in_allestimento: {
    label: "In Allestimento",
    color: "bg-accent-purple text-white",
    icon: Clock,
  },
  spedito: {
    label: "Spedito",
    color: "bg-primary text-primary-foreground",
    icon: CheckCircle2,
  },
  completato: {
    label: "Completato",
    color: "bg-success text-success-foreground",
    icon: CheckCircle2,
  },
};

const prioritaConfig = {
  normale: { color: "text-muted-foreground", bg: "bg-muted" },
  alta: { color: "text-warning", bg: "bg-warning/10" },
  urgente: { color: "text-destructive", bg: "bg-destructive/10" },
};

/**
 * CompactOrderTable: descrive il comportamento principale di questa funzione.
 * @param orders Input richiesto dalla funzione.
 * @param title Input richiesto dalla funzione.
 * @param showActions Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function CompactOrderTable({ orders, title, showActions = true }: CompactOrderTableProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline">{orders.length} ordini</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
              <p>Nessun ordine da visualizzare</p>
            </div>
          ) : (
            orders.map((order) => {
              const statoConf = statoConfig[order.stato];
              const prioritaConf = prioritaConfig[order.priorita];
              const StatoIcon = statoConf.icon;

              return (
                <div
                  key={order.id}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/5 transition-all cursor-pointer"
                  onClick={() => navigate(`/ordini/${order.id}`)}
                >
                  {/* Status Icon */}
                  <div className={`p-2 rounded-lg ${statoConf.color}`}>
                    <StatoIcon className="h-5 w-5" />
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold font-mono">{order.id}</span>
                      {order.priorita !== "normale" && (
                        <div className={`px-2 py-0.5 rounded-full ${prioritaConf.bg} text-xs font-medium ${prioritaConf.color}`}>
                          {order.priorita.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {order.cliente} • {order.articoli} articoli
                    </p>
                  </div>

                  {/* Amount & Status */}
                  <div className="text-right hidden sm:block">
                    <p className="font-semibold text-lg">{order.totale}</p>
                    <Badge className={`${statoConf.color} text-xs`}>
                      {statoConf.label}
                    </Badge>
                  </div>

                  {/* Due Date */}
                  <div className="text-right hidden md:block min-w-[100px]">
                    <p className="text-xs text-muted-foreground">Scadenza</p>
                    <p className="text-sm font-medium">{order.scadenza}</p>
                  </div>

                  {/* Actions */}
                  {showActions && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/ordini/${order.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Apri
                      </Button>
                      
                      {order.stato === "in_attesa" && (
                        <Button
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Processa ordine", order.id);
                          }}
                        >
                          Processa
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
