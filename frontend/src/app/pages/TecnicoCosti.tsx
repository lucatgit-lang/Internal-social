/**
 * File Overview: TecnicoCosti.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useState } from "react";
import { Euro, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getTechnicalCosts } from "../api/technical";
import { toast } from "sonner";

type CostRule = {
  id: string;
  ruleCode: string;
  laborCost: number;
  transportCost: number;
  labelCost: number;
  currency: string;
  updatedAt: string;
};

/**
 * TecnicoCosti: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function TecnicoCosti() {
  const [rows, setRows] = useState<CostRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTechnicalCosts()
      .then((response) => {
        if (!active) return;
        setRows(response.data);
      })
      .catch(() => {
        toast.error("Impossibile caricare i costi tecnici");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tecnico / Costi</h1>
        <p className="text-muted-foreground mt-1">Regole costo per BOM (manodopera, trasporto, etichetta).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Regole di costo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Caricamento...</p>
          ) : (
            <div className="rounded-lg border overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left">Rule</th>
                    <th className="px-3 py-2 text-right">Manodopera</th>
                    <th className="px-3 py-2 text-right">Trasporto</th>
                    <th className="px-3 py-2 text-right">Etichetta</th>
                    <th className="px-3 py-2 text-left">Aggiornata</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                        Nessuna regola costo disponibile.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="px-3 py-2 font-mono">{row.ruleCode}</td>
                        <td className="px-3 py-2 text-right">{row.currency} {row.laborCost.toFixed(4)}</td>
                        <td className="px-3 py-2 text-right">{row.currency} {row.transportCost.toFixed(4)}</td>
                        <td className="px-3 py-2 text-right">{row.currency} {row.labelCost.toFixed(4)}</td>
                        <td className="px-3 py-2 text-muted-foreground flex items-center gap-2">
                          <Euro className="h-3.5 w-3.5" />
                          {new Date(row.updatedAt).toLocaleString("it-IT")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
