/**
 * File Overview: Catalogo.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { searchDocuments, type DocumentItem } from "../api/documents";

/**
 * formatBytes: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatBytes(value: number | null): string {
  if (!value || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * formatIndexedDate: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function formatIndexedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("it-IT");
}

/**
 * Catalogo: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Catalogo() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [source, setSource] = useState<"backend" | "local">("local");

  useEffect(() => {
    let active = true;
    let fetched = false;

    /**
     * fetchDocs: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const fetchDocs = () =>
      searchDocuments({ limit: 30, offset: 0 })
        .then((response) => {
          if (!active) return;
          setDocs(response.data);
          setSource("backend");
        })
        .catch(() => {
          if (!active) return;
          setDocs([]);
          setSource("local");
        });

    /**
     * runFetchIfTokenAvailable: descrive il comportamento principale di questa funzione.
     * @param force Input richiesto dalla funzione.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const runFetchIfTokenAvailable = (force = false) => {
      if (fetched && !force) return;
      const hasToken =
        typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));
      if (!hasToken) return;
      fetched = true;
      void fetchDocs();
    };

    runFetchIfTokenAvailable();
    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => runFetchIfTokenAvailable(true);
    window.addEventListener("authSessionReady", onAuthReady);
    return () => {
      active = false;
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, []);

  const rows = useMemo(
    () =>
      source === "backend"
        ? docs.map((doc) => ({
            nome: doc.fileName,
            descrizione: `Area: ${doc.area}`,
            file: doc.relativePath,
            dimensione: formatBytes(doc.fileSize),
            data: formatIndexedDate(doc.indexedAt),
          }))
        : [],
    [docs, source]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Catalogo Prodotti</h1>
          <p className="text-muted-foreground mt-1">
            {source === "backend"
              ? "Documenti e listini da indicizzazione documentale backend"
              : "Backend documentale non disponibile: nessun catalogo reale caricato"}
          </p>
        </div>
        <Badge variant={source === "backend" ? "default" : "secondary"}>
          {source === "backend" ? "Dati backend" : "Dati locali"}
        </Badge>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Nessun documento catalogo disponibile dal backend.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((catalogo) => (
            <Card key={catalogo.file} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{catalogo.nome}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{catalogo.descrizione}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{catalogo.dimensione}</span>
                      <span>|</span>
                      <span>{catalogo.data}</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Scarica PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
