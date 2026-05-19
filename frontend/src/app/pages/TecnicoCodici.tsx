/**
 * File Overview: TecnicoCodici.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { Database, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  getTechnicalIngestionQuality,
  getTechnicalIngestionRuns,
  getTechnicalItems,
  triggerTechnicalIngestion,
  type TechnicalIngestionQualityResponse,
  type TechnicalItem,
} from "../api/technical";
import { toast } from "sonner";
import { useUser } from "../contexts/UserContext";

/**
 * TecnicoCodici: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function TecnicoCodici() {
  const [items, setItems] = useState<TechnicalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [lastRun, setLastRun] = useState<string>("-");
  const [quality, setQuality] = useState<TechnicalIngestionQualityResponse["data"] | null>(null);
  const [qualityFilter, setQualityFilter] = useState<"all" | "attention">("all");
  const { user } = useUser();

  const canWrite = useMemo(() => {
    const role = (user?.role ?? "").toLowerCase();
    return role === "admin" || role === "technical_office";
  }, [user?.role]);

  const filteredQualityFiles = useMemo(() => {
    if (!quality) return [];
    if (qualityFilter === "all") return quality.files;
    return quality.files.filter((file) => file.status === "warning" || file.status === "missing");
  }, [quality, qualityFilter]);

  /**
   * load: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const load = async () => {
    setLoading(true);
    try {
      const [rows, runs, qualityData] = await Promise.all([
        getTechnicalItems({ limit: 200, offset: 0, search: search || undefined }),
        getTechnicalIngestionRuns(),
        getTechnicalIngestionQuality(),
      ]);
      setItems(rows.data);
      setLastRun(runs.data[0]?.startedAt ?? "-");
      setQuality(qualityData.data);
    } catch {
      toast.error("Impossibile caricare i codici tecnici");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [search]);

  /**
   * handleIngest: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleIngest = async () => {
    setIngesting(true);
    try {
      await triggerTechnicalIngestion("all");
      toast.success("Ingestion XLSX completata");
      await load();
    } catch {
      toast.error("Ingestion non riuscita");
    } finally {
      setIngesting(false);
    }
  };

  /**
   * handleExportCsv: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleExportCsv = () => {
    if (!quality) return;

    const headers = [
      "key",
      "label",
      "sourceFile",
      "stagedRows",
      "canonicalRows",
      "conflicts",
      "failedRuns",
      "lastSourceMtime",
      "status",
    ];

    /**
     * escapeCsv: descrive il comportamento principale di questa funzione.
     * @param value Input richiesto dalla funzione.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const escapeCsv = (value: string | number | null) => {
      const str = value == null ? "" : String(value);
      if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return `\"${str.replace(/\"/g, "\"\"")}\"`;
      }
      return str;
    };

    const rows = quality.files.map((file) =>
      [
        file.key,
        file.label,
        file.sourceFile,
        file.stagedRows,
        file.canonicalRows,
        file.conflicts,
        file.failedRuns,
        file.lastSourceMtime,
        file.status,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `technical-ingestion-quality-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tecnico / Codici</h1>
          <p className="text-muted-foreground mt-1">Anagrafica codici tecnici importati dagli XLSX reali.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Ultimo run: {lastRun === "-" ? "n/d" : new Date(lastRun).toLocaleString("it-IT")}</Badge>
          <Button variant="outline" onClick={handleExportCsv} disabled={!quality}>
            Export CSV Qualita
          </Button>
          {canWrite && (
            <Button onClick={() => void handleIngest()} disabled={ingesting}>
              <RefreshCw className={`mr-2 h-4 w-4 ${ingesting ? "animate-spin" : ""}`} />
              Reimporta XLSX
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Qualita ingest dati tecnici</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!quality ? (
            <p className="text-sm text-muted-foreground">Caricamento qualita ingest...</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                <Badge variant="outline">File tracciati: {quality.summary.filesTracked}</Badge>
                <Badge variant="outline">Con dati: {quality.summary.filesWithData}</Badge>
                <Badge variant="outline">Righe staging: {quality.summary.stagedRows}</Badge>
                <Badge variant="outline">Righe canoniche: {quality.summary.canonicalRows}</Badge>
                <Badge variant={quality.summary.conflicts > 0 ? "secondary" : "outline"}>Conflitti: {quality.summary.conflicts}</Badge>
                <Badge variant={quality.summary.failedRuns > 0 ? "secondary" : "outline"}>Run falliti: {quality.summary.failedRuns}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={qualityFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQualityFilter("all")}
                >
                  Tutti i file
                </Button>
                <Button
                  variant={qualityFilter === "attention" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQualityFilter("attention")}
                >
                  Solo warning/missing
                </Button>
                {qualityFilter === "attention" && <Badge variant="secondary">Mostro solo file con attenzione</Badge>}
              </div>

              <div className="rounded-lg border overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-3 py-2 text-left">File</th>
                      <th className="px-3 py-2 text-right">Staging</th>
                      <th className="px-3 py-2 text-right">Canonico</th>
                      <th className="px-3 py-2 text-right">Conflitti</th>
                      <th className="px-3 py-2 text-right">Run falliti</th>
                      <th className="px-3 py-2 text-left">Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQualityFiles.length === 0 ? (
                      <tr className="border-t">
                        <td className="px-3 py-3 text-muted-foreground" colSpan={6}>
                          Nessun file in warning/missing.
                        </td>
                      </tr>
                    ) : (
                      filteredQualityFiles.map((file) => (
                        <tr key={file.sourceFile} className="border-t">
                          <td className="px-3 py-2">
                            <div className="font-medium">{file.label}</div>
                            <div className="text-xs text-muted-foreground">{file.sourceFile}</div>
                          </td>
                          <td className="px-3 py-2 text-right">{file.stagedRows}</td>
                          <td className="px-3 py-2 text-right">{file.canonicalRows}</td>
                          <td className="px-3 py-2 text-right">{file.conflicts}</td>
                          <td className="px-3 py-2 text-right">{file.failedRuns}</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={file.status === "ok" ? "outline" : "secondary"}
                              className={file.status === "ok" ? "border-emerald-300 text-emerald-700" : ""}
                            >
                              {file.status === "ok" ? "OK" : file.status === "warning" ? "Warning" : "Missing"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Codici tecnici
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Cerca per codice o descrizione..." value={search} onChange={(e) => setSearch(e.target.value)} />

          {loading ? (
            <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
          ) : (
            <div className="rounded-lg border overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left">Codice</th>
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">Categoria</th>
                    <th className="px-3 py-2 text-left">UM</th>
                    <th className="px-3 py-2 text-right">Costo unitario</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                        Nessun codice disponibile.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2 font-mono">{item.code}</td>
                        <td className="px-3 py-2">{item.name ?? "-"}</td>
                        <td className="px-3 py-2">{item.category ?? "-"}</td>
                        <td className="px-3 py-2">{item.uom ?? "-"}</td>
                        <td className="px-3 py-2 text-right">EUR {item.unitCost.toFixed(4)}</td>
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

export default TecnicoCodici;
