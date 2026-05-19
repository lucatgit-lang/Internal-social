/**
 * File Overview: ArticoloDettaglio.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Edit, Package } from "lucide-react";
import { Separator } from "../components/ui/separator";

/**
 * ArticoloDettaglio: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ArticoloDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/articoli")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">Articolo DNAEK</h1>
          <p className="text-muted-foreground mt-1">Dettagli articolo</p>
        </div>
        <Button><Edit className="mr-2 h-4 w-4" />Modifica</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Informazioni Prodotto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Codice:</span>
              <span className="font-mono font-medium">CEMENTO-42.5R</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descrizione:</span>
              <span className="font-medium">Cemento Portland 42.5R - Sacco 25kg</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoria:</span>
              <Badge variant="outline">Cementi</Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prezzo:</span>
              <span className="font-medium text-lg">€ 8,50</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Giacenza</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-primary mb-2" />
              <p className="text-3xl font-semibold">2.450</p>
              <p className="text-sm text-muted-foreground">Unità disponibili</p>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Scorta minima:</span>
              <span>500</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
