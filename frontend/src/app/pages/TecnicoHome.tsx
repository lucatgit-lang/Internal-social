/**
 * File Overview: TecnicoHome.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, CheckCircle2, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { getTechnicalIngestionQuality, type TechnicalIngestionQualityResponse } from "../api/technical";
import { toast } from "sonner";

/**
 * TecnicoHome: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function TecnicoHome() {
  const [quality, setQuality] = useState<TechnicalIngestionQualityResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTechnicalIngestionQuality()
      .then((res) => {
        if (!active) return;
        setQuality(res.data);
      })
      .catch(() => toast.error("Impossibile caricare la qualita dati"))
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const warningCount = useMemo(() => {
    if (!quality) return 0;
    return quality.files.filter((file) => file.status !== "ok").length;
  }, [quality]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tecnico / Home</h1>
        <p className="text-muted-foreground mt-1">Panoramica tecnica e qualita dati ingest da XLSX reali.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Qualita Dati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading || !quality ? (
            <p className="text-sm text-muted-foreground">Caricamento dashboard qualita...</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                <Badge variant="outline">File tracciati: {quality.summary.filesTracked}</Badge>
                <Badge variant="outline">Con dati: {quality.summary.filesWithData}</Badge>
                <Badge variant="outline">Righe canoniche: {quality.summary.canonicalRows}</Badge>
                <Badge variant={quality.summary.conflicts > 0 ? "secondary" : "outline"}>Conflitti: {quality.summary.conflicts}</Badge>
                <Badge variant={warningCount > 0 ? "secondary" : "outline"}>Attenzioni: {warningCount}</Badge>
              </div>

              <div className="rounded-lg border">
                <div className="p-3 text-sm text-muted-foreground">Stato file (top 5)</div>
                <div className="divide-y">
                  {quality.files.slice(0, 5).map((file) => (
                    <div key={file.sourceFile} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{file.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{file.sourceFile}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === "ok" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        )}
                        <Badge variant={file.status === "ok" ? "outline" : "secondary"}>
                          {file.status === "ok" ? "OK" : file.status === "warning" ? "Warning" : "Missing"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/tecnico/codici">Apri dettaglio qualita ingest</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/tecnico/distinte">Vai a Distinte Base</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TecnicoHome;
