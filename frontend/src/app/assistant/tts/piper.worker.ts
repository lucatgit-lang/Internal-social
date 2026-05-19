/**
 * File Overview: piper.worker.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

/// <reference lib="webworker" />

import * as tts from "@mintplex-labs/piper-tts-web";

type WorkerRequest =
  | { id: string; type: "init"; voiceId: string }
  | { id: string; type: "speak"; voiceId: string; text: string };

type WorkerResponse =
  | { id: string; type: "ok" }
  | { id: string; type: "audio"; buffer: ArrayBuffer }
  | { id: string; type: "error"; message: string };

const downloaded = new Set<string>();

/**
 * ensureVoice: descrive il comportamento principale di questa funzione.
 * @param voiceId Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
async function ensureVoice(voiceId: string): Promise<void> {
  if (downloaded.has(voiceId)) return;
  await tts.download(voiceId);
  downloaded.add(voiceId);
}

/**
 * safeError: descrive il comportamento principale di questa funzione.
 * @param error Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function safeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown Piper worker error";
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data;
  /**
   * post: descrive il comportamento principale di questa funzione.
   * @param response Input richiesto dalla funzione.
   * @param transfer Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const post = (response: WorkerResponse, transfer: Transferable[] = []) =>
    self.postMessage(response, transfer);

  try {
    if (payload.type === "init") {
      await ensureVoice(payload.voiceId);
      post({ id: payload.id, type: "ok" });
      return;
    }

    if (payload.type === "speak") {
      await ensureVoice(payload.voiceId);
      const wavBlob = await tts.predict({
        text: payload.text,
        voiceId: payload.voiceId,
      });
      const buffer = await wavBlob.arrayBuffer();
      post({ id: payload.id, type: "audio", buffer }, [buffer]);
      return;
    }

    post({ id: payload.id, type: "error", message: "Unsupported worker command" });
  } catch (error) {
    post({ id: payload.id, type: "error", message: safeError(error) });
  }
};

export {};
