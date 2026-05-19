/**
 * File Overview: AvviaProduzioneModal.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle2, Clock, Package, Droplet, TrendingUp, DollarSign, ArrowRight, Play } from "lucide-react";

interface OrderDetail {
  id: string;
  name: string;
  client: string;
  volume: string;
  timeEst: string;
  status: "pronto" | "in_attesa";
  materials: { name: string; needed: string; tank: string; tankLeftover: string }[];
  financials: {
    marginalCost: string;
    unitCost: string;
    salePriceUnit: string;
    profitMargin: string;
    totalProfit: string;
  };
  storage: {
    area: string;
    corsia: string;
    scaffale: string;
    vano: string;
  };
}

const mockOrders: OrderDetail[] = [
  {
    id: "PRD-201",
    name: "Smalto Lucido Bianco - 500L",
    client: "Carrozzerie Unite SPA",
    volume: "500 Litri",
    timeEst: "4h 30m",
    status: "pronto",
    materials: [
      { name: "Resina Acrilica Base", needed: "300L", tank: "Serbatoio A1", tankLeftover: "1.200L" },
      { name: "Pigmento Titanio", needed: "50L", tank: "Miscelatore B", tankLeftover: "250L" },
      { name: "Solvente Rapido X1", needed: "150L", tank: "Serbatoio S3", tankLeftover: "800L" },
    ],
    financials: {
      marginalCost: "€ 850,00",
      unitCost: "€ 1,70 / L",
      salePriceUnit: "€ 3,50 / L",
      profitMargin: "51%",
      totalProfit: "€ 900,00"
    },
    storage: {
      area: "Area OUT",
      corsia: "C",
      scaffale: "12",
      vano: "3"
    }
  },
  {
    id: "PRD-202",
    name: "Fondo Epossidico Grigio - 1000L",
    client: "Industrie Navali Srl",
    volume: "1000 Litri",
    timeEst: "6h 15m",
    status: "pronto",
    materials: [
      { name: "Base Epossidica", needed: "700L", tank: "Serbatoio E2", tankLeftover: "1.500L" },
      { name: "Catalizzatore Lento", needed: "200L", tank: "Serbatoio C1", tankLeftover: "400L" },
      { name: "Additivo Opacizzante", needed: "100L", tank: "Fusto A", tankLeftover: "150L" },
    ],
    financials: {
      marginalCost: "€ 2.100,00",
      unitCost: "€ 2,10 / L",
      salePriceUnit: "€ 4,20 / L",
      profitMargin: "50%",
      totalProfit: "€ 2.100,00"
    },
    storage: {
      area: "Area OUT",
      corsia: "A",
      scaffale: "05",
      vano: "1"
    }
  }
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * AvviaProduzioneModal: descrive il comportamento principale di questa funzione.
 * @param open Input richiesto dalla funzione.
 * @param onOpenChange Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function AvviaProduzioneModal({ open, onOpenChange }: Props) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const selectedOrder = mockOrders.find(o => o.id === selectedOrderId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Play className="h-6 w-6 text-primary fill-primary" />
            Avvia Produzione
          </DialogTitle>
          <DialogDescription>
            Seleziona l'ordine da mettere in produzione. Analizza i costi, le giacenze e confermalo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selezione Ordine */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Scegli ordine dalla coda:</label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger className="w-full text-lg h-12">
                <SelectValue placeholder="Seleziona un ordine pronto..." />
              </SelectTrigger>
              <SelectContent>
                {mockOrders.map(order => (
                  <SelectItem key={order.id} value={order.id} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{order.id}</span>
                      <span>- {order.name}</span>
                      <span className="text-muted-foreground">({order.client})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrder && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Top KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Package className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Volume Ordine</p>
                    <p className="text-xl font-bold">{selectedOrder.volume}</p>
                  </CardContent>
                </Card>
                <Card className="bg-warning/5 border-warning/20 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Clock className="h-5 w-5 text-warning mb-2" />
                    <p className="text-sm text-muted-foreground">Tempo Stimato</p>
                    <p className="text-xl font-bold text-warning-foreground">{selectedOrder.timeEst}</p>
                  </CardContent>
                </Card>
                <Card className="bg-accent-blue/5 border-accent-blue/20 shadow-sm col-span-2">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <ArrowRight className="h-5 w-5 text-accent-blue mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Destinazione Magazzino Finale</p>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="bg-background">{selectedOrder.storage.area}</Badge>
                      <span className="text-xs text-muted-foreground">Corsia: <strong className="text-foreground">{selectedOrder.storage.corsia}</strong></span>
                      <span className="text-xs text-muted-foreground">Scaffale: <strong className="text-foreground">{selectedOrder.storage.scaffale}</strong></span>
                      <span className="text-xs text-muted-foreground">Vano: <strong className="text-foreground">{selectedOrder.storage.vano}</strong></span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Materiali e Rimanenze */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-muted/30 pb-3 border-b border-border/50">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-accent-purple" />
                    Ingredienti e Rimanenze Serbatoi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/10 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Materiale Necessario</th>
                          <th className="px-4 py-3 text-right font-medium">Quantità</th>
                          <th className="px-4 py-3 text-left font-medium">Sorgente</th>
                          <th className="px-4 py-3 text-right font-medium">Rimanenza Futura</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedOrder.materials.map((mat, i) => (
                          <tr key={i} className="hover:bg-muted/5 transition-colors">
                            <td className="px-4 py-3 font-medium">{mat.name}</td>
                            <td className="px-4 py-3 text-right text-primary font-semibold">{mat.needed}</td>
                            <td className="px-4 py-3 text-muted-foreground">{mat.tank}</td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant="secondary" className="bg-success/10 text-success-foreground border-success/20">
                                {mat.tankLeftover}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Dati Finanziari */}
              <Card className="border-border/50 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-bl-[100px] -z-10" />
                <CardHeader className="bg-muted/30 pb-3 border-b border-border/50">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Proiezione Finanziaria e Costi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Costo Marginale</p>
                      <p className="text-xl font-bold">{selectedOrder.financials.marginalCost}</p>
                      <p className="text-xs text-muted-foreground mt-1">Totale materie prime</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Costo Unitario</p>
                      <p className="text-xl font-semibold">{selectedOrder.financials.unitCost}</p>
                      <p className="text-xs text-muted-foreground mt-1">Per singolo Litro</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Prezzo di Vendita</p>
                      <p className="text-xl font-semibold">{selectedOrder.financials.salePriceUnit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-success" />
                        Guadagno Netto
                      </p>
                      <p className="text-xl font-bold text-success">{selectedOrder.financials.totalProfit}</p>
                      <Badge className="bg-success text-white mt-1 border-none shadow-sm">
                        Margine: {selectedOrder.financials.profitMargin}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Azioni */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annulla
                </Button>
                <Button className="gap-2 px-8 shadow-lg shadow-primary/25" onClick={() => {
                  onOpenChange(false);
                  // logica di avvio...
                }}>
                  <Play className="h-4 w-4 fill-current" />
                  Conferma Avvio Produzione
                </Button>
              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
