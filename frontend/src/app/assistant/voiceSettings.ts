/**
 * File Overview: voiceSettings.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

export interface AssistantVoiceOption {
  id: string;
  label: string;
  description: string;
  provider: "piper" | "browser";
}

const LEGACY_STORAGE_KEY = "assistant_voice_v1";
const STORAGE_KEY_V2 = "assistant_voice_v2";

type StoredVoiceSettings = {
  version: 2;
  voiceId: string;
  updatedAt: string;
};

/**
 * canUseStorage: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/**
 * loadPreferredVoice: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function loadPreferredVoice(): string | null {
  if (!canUseStorage()) return null;

  try {
    const rawV2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Partial<StoredVoiceSettings>;
      if (parsed && typeof parsed.voiceId === "string" && parsed.voiceId.trim()) {
        return parsed.voiceId;
      }
    }
  } catch {
    // ignore parse/storage issues
  }

  try {
    const legacyValue = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyValue) return null;
    savePreferredVoice(legacyValue);
    return legacyValue;
  } catch {
    return null;
  }
}

/**
 * savePreferredVoice: descrive il comportamento principale di questa funzione.
 * @param voiceId Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function savePreferredVoice(voiceId: string): void {
  if (!canUseStorage()) return;

  try {
    const payload: StoredVoiceSettings = {
      version: 2,
      voiceId,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
    window.localStorage.setItem(LEGACY_STORAGE_KEY, voiceId);
  } catch {
    // ignore storage issues
  }
}