/**
 * File Overview: TecnicoFormule.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { getTechnicalFormulas, type TechnicalFormula } from "../api/technical";
import { toast } from "sonner";

/**
 * TecnicoFormule: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function TecnicoFormule() {
  const [rows, setRows] = useState<TechnicalFormula[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTechnicalFormulas({ limit: 200, offset: 0, search: search || undefined })
      .then((response) => {
        if (!active) return;
        setRows(response.data);
      })
      .catch(() => toast.error("Impossibile caricare le formule"))
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tecnico / Formule</h1>
        <p className="text-muted-foreground mt-1">Formule e miscele importate da Excel.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Formule disponibili
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Cerca formula..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {loading ? (
            <p className="text-sm text-muted-foreground">Caricamento...</p>
          ) : (
            <div className="rounded-lg border overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left">Codice formula</th>
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">Output item</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-muted-foreground" colSpan={3}>Nessuna formula trovata.</td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="px-3 py-2 font-mono">{row.formula_code}</td>
                        <td className="px-3 py-2">{row.name ?? "-"}</td>
                        <td className="px-3 py-2 font-mono">{row.output_item_code ?? "-"}</td>
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
