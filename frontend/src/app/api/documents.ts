/**
 * File Overview: documents.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { apiGet } from "./client";

export interface DocumentItem {
  id: string;
  area: string;
  fileName: string;
  relativePath: string;
  extension: string | null;
  fileSize: number | null;
  indexedAt: string;
}

export interface DocumentDetail extends DocumentItem {
  fileHash: string;
  language: string | null;
  extractedCode: string | null;
  tags: string[];
}

export interface DocumentsSearchResponse {
  data: DocumentItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * searchDocuments: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function searchDocuments(params?: {
  q?: string;
  area?: string;
  extension?: string;
  limit?: number;
  offset?: number;
}): Promise<DocumentsSearchResponse> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.area) search.set("area", params.area);
  if (params?.extension) search.set("extension", params.extension);
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.offset != null) search.set("offset", String(params.offset));
  const query = search.toString();
  return apiGet<DocumentsSearchResponse>(`/api/v1/documents/search${query ? `?${query}` : ""}`);
}

/**
 * getDocumentById: descrive il comportamento principale di questa funzione.
 * @param id Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getDocumentById(id: string): Promise<{ data: DocumentDetail }> {
  return apiGet<{ data: DocumentDetail }>(`/api/v1/documents/${id}`);
}
