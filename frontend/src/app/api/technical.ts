/**
 * File Overview: technical.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { apiGet, apiPatch, apiPost } from "./client";

export interface TechnicalItem {
  id: string;
  code: string;
  name: string | null;
  category: string | null;
  uom: string | null;
  unitCost: number;
}

export interface TechnicalFormula {
  id: string;
  formula_code: string;
  name: string | null;
  output_item_code: string | null;
}

export interface TechnicalProduct {
  id: string;
  code: string;
  name: string | null;
  productLine: string | null;
  unitCost: number;
}

export interface BomLine {
  id: string;
  lineNo: number;
  componentCode: string;
  componentType: string;
  quantity: number;
  uom: string | null;
  wastePct: number;
  costOverride: number | null;
}

export interface BomResponse {
  data: {
    productCode: string;
    revision: { id: string; revisionNo: number; reason: string | null; createdAt: string } | null;
    lines: BomLine[];
    explosion: Array<{
      code: string;
      quantity: number;
      level: number;
      unitCost: number;
      totalCost: number;
      source: string;
    }>;
    cost: {
      material: number;
      packaging: number;
      labor: number;
      transport: number;
      label: number;
      total: number;
    };
  };
}

export interface BomComparisonResponse {
  data: {
    productCode: string;
    fromRevision: { id: string; revisionNo: number; reason: string | null; createdAt: string };
    toRevision: { id: string; revisionNo: number; reason: string | null; createdAt: string };
    summary: {
      totalFrom: number;
      totalTo: number;
      totalDelta: number;
      materialDelta: number;
      packagingDelta: number;
    };
    lines: Array<{
      code: string;
      quantityFrom: number;
      quantityTo: number;
      quantityDelta: number;
      costFrom: number;
      costTo: number;
      costDelta: number;
    }>;
  };
}

export interface TechnicalIngestionQualityResponse {
  data: {
    summary: {
      filesTracked: number;
      filesWithData: number;
      stagedRows: number;
      canonicalRows: number;
      conflicts: number;
      failedRuns: number;
    };
    lastRun: {
      id: string;
      status: string;
      startedAt: string;
      finishedAt: string | null;
      insertedCount: number;
      updatedCount: number;
      skippedCount: number;
      errorCount: number;
    } | null;
    files: Array<{
      key: string;
      label: string;
      sourceFile: string;
      stagedRows: number;
      canonicalRows: number;
      conflicts: number;
      failedRuns: number;
      lastSourceMtime: string | null;
      status: "ok" | "warning" | "missing";
    }>;
  };
}

/**
 * getTechnicalItems: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getTechnicalItems(params?: { limit?: number; offset?: number; search?: string }) {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.search) q.set("search", params.search);
  return apiGet<{ data: TechnicalItem[]; meta: { total: number; limit: number; offset: number } }>(`/api/v1/technical/items${q.toString() ? `?${q}` : ""}`);
}

/**
 * getTechnicalFormulas: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getTechnicalFormulas(params?: { limit?: number; offset?: number; search?: string }) {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.search) q.set("search", params.search);
  return apiGet<{ data: TechnicalFormula[]; meta: { total: number; limit: number; offset: number } }>(`/api/v1/technical/formulas${q.toString() ? `?${q}` : ""}`);
}

/**
 * getTechnicalProducts: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getTechnicalProducts(params?: { limit?: number; offset?: number; search?: string; listinoOnly?: boolean }) {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.search) q.set("search", params.search);
  if (params?.listinoOnly != null) q.set("listinoOnly", String(params.listinoOnly));
  return apiGet<{ data: TechnicalProduct[]; meta: { total: number; limit: number; offset: number } }>(`/api/v1/technical/products${q.toString() ? `?${q}` : ""}`);
}

/**
 * getBom: descrive il comportamento principale di questa funzione.
 * @param productCode Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getBom(productCode: string): Promise<BomResponse> {
  return apiGet<BomResponse>(`/api/v1/technical/bom/${encodeURIComponent(productCode)}`);
}

/**
 * getBomRevisions: descrive il comportamento principale di questa funzione.
 * @param productCode Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getBomRevisions(productCode: string) {
  return apiGet<{ data: Array<{ id: string; revision_no: number; reason: string | null; is_active: boolean; source: string; created_at: string }> }>(
    `/api/v1/technical/bom/${encodeURIComponent(productCode)}/revisions`
  );
}

/**
 * getBomComparison: descrive il comportamento principale di questa funzione.
 * @param productCode Input richiesto dalla funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getBomComparison(productCode: string, params?: { fromRevision?: number; toRevision?: number }): Promise<BomComparisonResponse> {
  const q = new URLSearchParams();
  if (params?.fromRevision != null) q.set("fromRevision", String(params.fromRevision));
  if (params?.toRevision != null) q.set("toRevision", String(params.toRevision));
  return apiGet<BomComparisonResponse>(`/api/v1/technical/bom/${encodeURIComponent(productCode)}/compare${q.toString() ? `?${q}` : ""}`);
}
export async function createBomRevision(productCode: string, payload: {
  reason: string;
  lines: Array<{
    componentCode: string;
    componentType?: "material" | "packaging" | "service" | "bom";
    quantity: number;
    uom?: string;
    wastePct?: number;
    costOverride?: number;
  }>;
}) {
  return apiPost<{ data: { id: string; revisionNo: number } }>(`/api/v1/technical/bom/${encodeURIComponent(productCode)}/revisions`, payload);
}

/**
 * patchBomLine: descrive il comportamento principale di questa funzione.
 * @param revisionId Input richiesto dalla funzione.
 * @param lineId Input richiesto dalla funzione.
 * @param payload Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function patchBomLine(revisionId: string, lineId: string, payload: Partial<BomLine>) {
  return apiPatch<{ success: boolean }>(`/api/v1/technical/bom/revisions/${encodeURIComponent(revisionId)}/lines/${encodeURIComponent(lineId)}`, payload);
}

/**
 * getTechnicalCosts: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getTechnicalCosts() {
  return apiGet<{ data: Array<{ id: string; ruleCode: string; laborCost: number; transportCost: number; labelCost: number; currency: string; updatedAt: string }> }>(
    "/api/v1/technical/costs"
  );
}

/**
 * getTechnicalSdsAteco: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getTechnicalSdsAteco(params?: { limit?: number; offset?: number; search?: string }) {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.search) q.set("search", params.search);
  return apiGet<{ data: { sdsRefs: Array<{ id: string; productCode: string; sdsCode: string | null; sourceType: string; language: string | null }>; atecoCodes: Array<{ id: string; code: string; description: string | null }> }; meta: { limit: number; offset: number } }>(
    `/api/v1/technical/sds-ateco${q.toString() ? `?${q}` : ""}`
  );
}

/**
 * triggerTechnicalIngestion: descrive il comportamento principale di questa funzione.
 * @param job Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function triggerTechnicalIngestion(job: "all" | "formule" | "miscele" | "imballi" | "prodotti-finiti" | "distinte" | "costi" | "sds-ref" | "ateco" = "all") {
  return apiPost<{ success: boolean }>("/api/v1/technical/ingestion/xlsx", { job });
}

/**
 * getTechnicalIngestionRuns: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getTechnicalIngestionRuns() {
  return apiGet<{ data: Array<{ id: string; source: string; status: string; startedAt: string; finishedAt: string | null; insertedCount: number; updatedCount: number; skippedCount: number; errorCount: number; metadata: unknown }> }>(
    "/api/v1/technical/ingestion/runs"
  );
}

/**
 * getTechnicalIngestionQuality: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getTechnicalIngestionQuality() {
  return apiGet<TechnicalIngestionQualityResponse>("/api/v1/technical/ingestion/quality");
}
