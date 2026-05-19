/**
 * File Overview: TecnicoDistinteBase.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useMemo, useState } from "react";
import { GitBranch, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  createBomRevision,
  getBom,
  getBomComparison,
  getBomRevisions,
  getTechnicalProducts,
  patchBomLine,
  type BomLine,
  type TechnicalProduct,
} from "../api/technical";
import { toast } from "sonner";
import { useUser } from "../contexts/UserContext";
import { useSearchParams } from "react-router";

/**
 * TecnicoDistinteBase: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function TecnicoDistinteBase() {
  const [products, setProducts] = useState<TechnicalProduct[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("productCode") ?? "";
  const [productCode, setProductCode] = useState(initialCode);
  const [lines, setLines] = useState<BomLine[]>([]);
  const [revision, setRevision] = useState<{ id: string; revisionNo: number; reason: string | null; createdAt: string } | null>(null);
  const [revisions, setRevisions] = useState<Array<{ id: string; revision_no: number; reason: string | null; is_active: boolean; source: string; created_at: string }>>([]);
  const [compareFromRevision, setCompareFromRevision] = useState<number | null>(null);
  const [compareToRevision, setCompareToRevision] = useState<number | null>(null);
  const [comparison, setComparison] = useState<{
    fromRevision: { revisionNo: number; reason: string | null; createdAt: string };
    toRevision: { revisionNo: number; reason: string | null; createdAt: string };
    summary: { totalFrom: number; totalTo: number; totalDelta: number; materialDelta: number; packagingDelta: number };
    lines: Array<{ code: string; quantityFrom: number; quantityTo: number; quantityDelta: number; costFrom: number; costTo: number; costDelta: number }>;
  } | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [cost, setCost] = useState({ material: 0, packaging: 0, labor: 0, transport: 0, label: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("Aggiornamento manuale distinta");
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const { user } = useUser();

  const canWrite = useMemo(() => {
    const role = (user?.role ?? "").toLowerCase();
    return role === "admin" || role === "technical_office";
  }, [user?.role]);

  useEffect(() => {
    getTechnicalProducts({ limit: 200, offset: 0 })
      .then((res) => setProducts(res.data))
      .catch(() => {});
  }, []);

  /**
   * loadBom: descrive il comportamento principale di questa funzione.
   * @param code Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const loadBom = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const [bom, rev] = await Promise.all([getBom(code.trim()), getBomRevisions(code.trim())]);
      setRevision(bom.data.revision);
      setLines(bom.data.lines);
      setCost(bom.data.cost);
      setRevisions(rev.data);
      setSearchParams({ productCode: code.trim() });
      setHasLocalChanges(false);
    } catch {
      toast.error("Distinta non trovata o non disponibile");
      setRevision(null);
      setLines([]);
      setRevisions([]);
      setHasLocalChanges(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      void loadBom(initialCode);
    }
  }, []);

  useEffect(() => {
    if (revisions.length >= 2) {
      setCompareToRevision(revisions[0]?.revision_no ?? null);
      setCompareFromRevision(revisions[1]?.revision_no ?? null);
    } else {
      setCompareToRevision(null);
      setCompareFromRevision(null);
      setComparison(null);
    }
  }, [revisions]);

  /**
   * loadComparison: descrive il comportamento principale di questa funzione.
   * @param fromRevision Input richiesto dalla funzione.
   * @param toRevision Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const loadComparison = async (fromRevision: number, toRevision: number) => {
    if (!productCode.trim()) return;
    setComparisonLoading(true);
    try {
      const res = await getBomComparison(productCode.trim(), { fromRevision, toRevision });
      setComparison({
        fromRevision: res.data.fromRevision,
        toRevision: res.data.toRevision,
        summary: res.data.summary,
        lines: res.data.lines,
      });
    } catch {
      toast.error("Confronto revisioni non disponibile");
      setComparison(null);
    } finally {
      setComparisonLoading(false);
    }
  };

  /**
   * updateLocalLine: descrive il comportamento principale di questa funzione.
   * @param id Input richiesto dalla funzione.
   * @param field Input richiesto dalla funzione.
   * @param value Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const updateLocalLine = (id: string, field: keyof BomLine, value: string) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;
        if (field === "quantity" || field === "wastePct" || field === "costOverride") {
          return { ...line, [field]: value === "" ? 0 : Number(value) };
        }
        return { ...line, [field]: value };
      })
    );
    setHasLocalChanges(true);
  };

  /**
   * addLocalLine: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const addLocalLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        lineNo: prev.length + 1,
        componentCode: "",
        componentType: "material",
        quantity: 0,
        uom: null,
        wastePct: 0,
        costOverride: null,
      },
    ]);
    setHasLocalChanges(true);
  };

  /**
   * removeLocalLine: descrive il comportamento principale di questa funzione.
   * @param lineId Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const removeLocalLine = (lineId: string) => {
    setLines((prev) =>
      prev
        .filter((line) => line.id !== lineId)
        .map((line, index) => ({
          ...line,
          lineNo: index + 1,
        }))
    );
    setHasLocalChanges(true);
  };

  /**
   * saveLine: descrive il comportamento principale di questa funzione.
   * @param line Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const saveLine = async (line: BomLine) => {
    if (!revision) return;
    if (line.id.startsWith("temp-")) {
      toast.message("Riga nuova non ancora persistita: crea una nuova revisione per salvarla.");
      return;
    }

    try {
      await patchBomLine(revision.id, line.id, {
        componentCode: line.componentCode,
        componentType: line.componentType,
        quantity: line.quantity,
        uom: line.uom ?? undefined,
        wastePct: line.wastePct,
        costOverride: line.costOverride,
      });
      toast.success("Linea aggiornata");
      setHasLocalChanges(false);
      await loadBom(productCode);
    } catch {
      toast.error("Aggiornamento linea non riuscito");
    }
  };

  /**
   * createRevisionFromCurrent: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const createRevisionFromCurrent = async () => {
    if (!productCode.trim()) return;

    const filteredLines = lines.filter((line) => line.componentCode.trim().length > 0);
    if (filteredLines.length === 0) {
      toast.error("Nessuna linea valida disponibile per creare una revisione");
      return;
    }

    try {
      await createBomRevision(productCode.trim(), {
        reason,
        lines: filteredLines.map((line) => ({
          componentCode: line.componentCode,
          componentType: (line.componentType as "material" | "packaging" | "service" | "bom") ?? "material",
          quantity: line.quantity,
          uom: line.uom ?? undefined,
          wastePct: line.wastePct,
          costOverride: line.costOverride ?? undefined,
        })),
      });
      toast.success("Nuova revisione creata");
      setHasLocalChanges(false);
      await loadBom(productCode.trim());
    } catch {
      toast.error("Creazione revisione non riuscita");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tecnico / Distinte Base</h1>
        <p className="text-muted-foreground mt-1">Gestione revisioni BOM con calcolo costo automatico.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Distinta prodotto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              placeholder="Inserisci codice prodotto finito"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              list="technical-products"
            />
            <datalist id="technical-products">
              {products.map((product) => (
                <option key={product.id} value={product.code}>{product.name ?? product.code}</option>
              ))}
            </datalist>
            <Button onClick={() => void loadBom(productCode)} disabled={loading}>Carica BOM</Button>
          </div>

          {revision ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Revisione attiva: v{revision.revisionNo}</Badge>
              <Badge variant="outline">Creata: {new Date(revision.createdAt).toLocaleString("it-IT")}</Badge>
              <Badge variant="secondary">{revision.reason ?? "Senza motivo"}</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessuna revisione attiva per questo prodotto.</p>
          )}

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card className="md:col-span-3 lg:col-span-2 border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Costo totale BOM</p>
                <p className="text-2xl font-bold text-primary">EUR {cost.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Materiali + imballi + manodopera + trasporto + etichetta</p>
              </CardContent>
            </Card>
            <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Materiali</p><p className="font-semibold">EUR {cost.material.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Imballi</p><p className="font-semibold">EUR {cost.packaging.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Manodopera</p><p className="font-semibold">EUR {cost.labor.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Trasporto</p><p className="font-semibold">EUR {cost.transport.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Etichetta</p><p className="font-semibold">EUR {cost.label.toFixed(2)}</p></CardContent></Card>
          </div>

          {canWrite && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">
                Modifica linee in bozza con <span className="font-medium text-foreground">Aggiungi</span>/<span className="font-medium text-foreground">Rimuovi</span> e salva con nuova revisione.
              </p>
              <Button variant="outline" onClick={addLocalLine}>
                <Plus className="h-4 w-4 mr-1" />
                Aggiungi riga
              </Button>
            </div>
          )}

          <div className="rounded-lg border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Componente</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-right">Quantita</th>
                  <th className="px-3 py-2 text-left">UM</th>
                  <th className="px-3 py-2 text-right">Scarto %</th>
                  <th className="px-3 py-2 text-right">Override costo</th>
                  <th className="px-3 py-2 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-muted-foreground" colSpan={8}>Nessuna linea distinta.</td>
                  </tr>
                ) : (
                  lines.map((line) => (
                    <tr key={line.id} className="border-t">
                      <td className="px-3 py-2">{line.lineNo}</td>
                      <td className="px-3 py-2">
                        <Input value={line.componentCode} onChange={(e) => updateLocalLine(line.id, "componentCode", e.target.value)} disabled={!canWrite} />
                      </td>
                      <td className="px-3 py-2">
                        <Input value={line.componentType} onChange={(e) => updateLocalLine(line.id, "componentType", e.target.value)} disabled={!canWrite} />
                      </td>
                      <td className="px-3 py-2"><Input type="number" step="0.0001" value={line.quantity} onChange={(e) => updateLocalLine(line.id, "quantity", e.target.value)} disabled={!canWrite} /></td>
                      <td className="px-3 py-2"><Input value={line.uom ?? ""} onChange={(e) => updateLocalLine(line.id, "uom", e.target.value)} disabled={!canWrite} /></td>
                      <td className="px-3 py-2"><Input type="number" step="0.01" value={line.wastePct} onChange={(e) => updateLocalLine(line.id, "wastePct", e.target.value)} disabled={!canWrite} /></td>
                      <td className="px-3 py-2"><Input type="number" step="0.0001" value={line.costOverride ?? ""} onChange={(e) => updateLocalLine(line.id, "costOverride", e.target.value)} disabled={!canWrite} /></td>
                      <td className="px-3 py-2 text-right">
                        {canWrite && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => void saveLine(line)}>
                              <Save className="h-3.5 w-3.5 mr-1" />
                              Salva
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => removeLocalLine(line.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Rimuovi
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-sm font-medium">Crea nuova revisione</p>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo revisione" disabled={!canWrite} />
            {canWrite && (
              <Button onClick={() => void createRevisionFromCurrent()} disabled={!hasLocalChanges && !lines.some((line) => line.id.startsWith("temp-"))}>
                <Plus className="h-4 w-4 mr-2" />
                Salva modifiche in nuova revisione
              </Button>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Storico revisioni</p>
            <div className="flex flex-wrap gap-2">
              {revisions.map((rev) => (
                <Badge key={rev.id} variant={rev.is_active ? "default" : "outline"}>
                  v{rev.revision_no} {rev.is_active ? "(attiva)" : ""}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Confronto revisioni (delta quantità/costo)</p>
              {revisions.length < 2 && <p className="text-xs text-muted-foreground">Servono almeno 2 revisioni</p>}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm space-y-1">
                <span className="text-muted-foreground">Da revisione</span>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={compareFromRevision ?? ""}
                  onChange={(e) => setCompareFromRevision(e.target.value ? Number(e.target.value) : null)}
                  disabled={revisions.length < 2}
                >
                  <option value="">Seleziona...</option>
                  {revisions.map((rev) => (
                    <option key={`from-${rev.id}`} value={rev.revision_no}>
                      v{rev.revision_no}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm space-y-1">
                <span className="text-muted-foreground">A revisione</span>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={compareToRevision ?? ""}
                  onChange={(e) => setCompareToRevision(e.target.value ? Number(e.target.value) : null)}
                  disabled={revisions.length < 2}
                >
                  <option value="">Seleziona...</option>
                  {revisions.map((rev) => (
                    <option key={`to-${rev.id}`} value={rev.revision_no}>
                      v{rev.revision_no}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={!compareFromRevision || !compareToRevision || compareFromRevision === compareToRevision || revisions.length < 2 || comparisonLoading}
                  onClick={() => {
                    if (!compareFromRevision || !compareToRevision) return;
                    void loadComparison(compareFromRevision, compareToRevision);
                  }}
                >
                  Confronta revisioni
                </Button>
              </div>
            </div>

            {comparison && (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <Card className="border-muted">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Totale v{comparison.fromRevision.revisionNo}</p>
                      <p className="font-semibold">EUR {comparison.summary.totalFrom.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-muted">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Totale v{comparison.toRevision.revisionNo}</p>
                      <p className="font-semibold">EUR {comparison.summary.totalTo.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className={comparison.summary.totalDelta >= 0 ? "border-red-300 bg-red-50/40" : "border-emerald-300 bg-emerald-50/40"}>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Delta totale</p>
                      <p className={`font-semibold ${comparison.summary.totalDelta >= 0 ? "text-red-700" : "text-emerald-700"}`}>
                        {comparison.summary.totalDelta >= 0 ? "+" : ""}EUR {comparison.summary.totalDelta.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-lg border overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-3 py-2 text-left">Componente</th>
                        <th className="px-3 py-2 text-right">Qty da</th>
                        <th className="px-3 py-2 text-right">Qty a</th>
                        <th className="px-3 py-2 text-right">Delta qty</th>
                        <th className="px-3 py-2 text-right">Costo da</th>
                        <th className="px-3 py-2 text-right">Costo a</th>
                        <th className="px-3 py-2 text-right">Delta costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.lines.length === 0 ? (
                        <tr>
                          <td className="px-3 py-2 text-muted-foreground" colSpan={7}>Nessuna differenza rilevata</td>
                        </tr>
                      ) : (
                        comparison.lines.map((line) => (
                          <tr key={line.code} className="border-t">
                            <td className="px-3 py-2 font-medium">{line.code}</td>
                            <td className="px-3 py-2 text-right">{line.quantityFrom.toFixed(4)}</td>
                            <td className="px-3 py-2 text-right">{line.quantityTo.toFixed(4)}</td>
                            <td className={`px-3 py-2 text-right ${line.quantityDelta >= 0 ? "text-red-700" : "text-emerald-700"}`}>
                              {line.quantityDelta >= 0 ? "+" : ""}{line.quantityDelta.toFixed(4)}
                            </td>
                            <td className="px-3 py-2 text-right">EUR {line.costFrom.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">EUR {line.costTo.toFixed(2)}</td>
                            <td className={`px-3 py-2 text-right font-medium ${line.costDelta >= 0 ? "text-red-700" : "text-emerald-700"}`}>
                              {line.costDelta >= 0 ? "+" : ""}EUR {line.costDelta.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
