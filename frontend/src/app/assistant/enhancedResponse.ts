/**
 * File Overview: enhancedResponse.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import type { AssistantEnhancedResponse, AssistantEnhanceRequest } from "./types";
import { assistantRespond } from "../api/assistant";

const OUT_OF_SCOPE_TEXT = "Posso aiutarti solo con dati e funzioni del gestionale.";

/**
 * enhanceAssistantResponse: descrive il comportamento principale di questa funzione.
 * @param payload Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */

export async function enhanceAssistantResponse(
  payload: AssistantEnhanceRequest
): Promise<AssistantEnhancedResponse | null> {
  try {
    const data = (await assistantRespond(payload)) as AssistantEnhancedResponse;
    if (!data || typeof data.text !== "string" || !data.scope || !data.source) return null;
    if (data.scope === "out_of_scope") {
      return {
        ...data,
        text: OUT_OF_SCOPE_TEXT,
      };
    }
    return data;
  } catch {
    return null;
  }
}
