/**
 * File Overview: TecnicoSdsAteco.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useState } from "react";
import { ShieldCheck, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { getTechnicalSdsAteco } from "../api/technical";
import { toast } from "sonner";

type SdsRef = {
  id: string;
  productCode: string;
  sdsCode: string | null;
  sourceType: string;
  language: string | null;
};

type AtecoCode = {
  id: string;
  code: string;
  description: string | null;
};

/**
 * TecnicoSdsAteco: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function TecnicoSdsAteco() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sdsRefs, setSdsRefs] = useState<SdsRef[]>([]);
  const [atecoCodes, setAtecoCodes] = useState<AtecoCode[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getTechnicalSdsAteco({ limit: 200, offset: 0, search: search || undefined })
      .then((response) => {
        if (!active) return;
        setSdsRefs(response.data.sdsRefs);
        setAtecoCodes(response.data.atecoCodes);
      })
      .catch(() => {
        toast.error("Impossibile caricare SDS/ATECO");
      })
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
        <h1 className="text-3xl font-semibold tracking-tight">Tecnico / SDS & ATECO</h1>
        <p className="text-muted-foreground mt-1">Riferimenti sicurezza prodotto e classificazioni ATECO.</p>
      </div>

      <Input
        placeholder="Cerca per codice prodotto, SDS o ATECO..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Riferimenti SDS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-3 py-2 text-left">Prodotto</th>
                      <th className="px-3 py-2 text-left">SDS</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-left">Lingua</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sdsRefs.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-muted-foreground" colSpan={4}>Nessun riferimento SDS.</td>
                      </tr>
                    ) : (
                      sdsRefs.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-3 py-2 font-mono">{row.productCode}</td>
                          <td className="px-3 py-2">{row.sdsCode ?? "-"}</td>
                          <td className="px-3 py-2">{row.sourceType}</td>
                          <td className="px-3 py-2">{row.language ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Codici ATECO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-3 py-2 text-left">Codice</th>
                      <th className="px-3 py-2 text-left">Descrizione</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atecoCodes.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-muted-foreground" colSpan={2}>Nessun codice ATECO.</td>
                      </tr>
                    ) : (
                      atecoCodes.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-3 py-2 font-mono">{row.code}</td>
                          <td className="px-3 py-2">{row.description ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
