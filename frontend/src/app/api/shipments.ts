/**
 * File Overview: shipments.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { apiGet, apiPatch } from "./client";

export interface Shipment {
  id: string;
  status: string;
  plannedDate: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  orderExternalDocId: string | null;
  customerName: string | null;
  destination: string | null;
}

export interface ShipmentDetailResponse {
  data: {
    id: string;
    status: string;
    plannedDate: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    destination: string | null;
    order: {
      id: string | null;
      externalDocId: string | null;
      customerName: string | null;
      customerCity: string | null;
      customerAddress: string | null;
      dataConsegna: string | null;
    };
    ddt: Array<{
      id: string;
      numero: string | null;
      dataDoc: string | null;
      status: string | null;
    }>;
    items: Array<{
      id: string;
      code: string | null;
      description: string | null;
      quantity: number | null;
    }>;
  };
}

export interface ShipmentsResponse {
  data: Shipment[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * getShipments: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function getShipments(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<ShipmentsResponse> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.offset != null) search.set("offset", String(params.offset));
  if (params?.status) search.set("status", params.status);

  const query = search.toString();
  return apiGet<ShipmentsResponse>(`/api/v1/shipments${query ? `?${query}` : ""}`);
}

/**
 * getLateShipments: descrive il comportamento principale di questa funzione.
 * @param params Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function getLateShipments(params?: {
  limit?: number;
  offset?: number;
}): Promise<ShipmentsResponse> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.offset != null) search.set("offset", String(params.offset));
  const query = search.toString();
  return apiGet<ShipmentsResponse>(`/api/v1/shipments/late${query ? `?${query}` : ""}`);
}

/**
 * getShipmentById: descrive il comportamento principale di questa funzione.
 * @param id Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getShipmentById(id: string): Promise<ShipmentDetailResponse> {
  return apiGet<ShipmentDetailResponse>(`/api/v1/shipments/${id}`);
}

/**
 * updateShipmentStatus: descrive il comportamento principale di questa funzione.
 * @param id Input richiesto dalla funzione.
 * @param status Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function updateShipmentStatus(id: string, status: string): Promise<{ data: { id: string; status: string } }> {
  return apiPatch<{ data: { id: string; status: string } }>(`/api/v1/shipments/${id}/status`, {
    status
  });
}
