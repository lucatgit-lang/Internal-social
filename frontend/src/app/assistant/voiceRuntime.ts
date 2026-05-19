/**
 * File Overview: voiceRuntime.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { BrowserTtsEngine } from "./tts/browserEngine";
import { PiperTtsEngine } from "./tts/piperEngine";
import manifest from "./tts/voices.manifest.json";
import type { SpeakOptions, VoiceOption } from "./tts/types";

type OnResultPayload = {
  transcript: string;
  isFinal: boolean;
};

interface SpeechRecognizerLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognizerLike;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface VoiceRecognizerOptions {
  lang?: string;
  onResult: (payload: OnResultPayload) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

export interface VoiceRecognizerController {
  supported: boolean;
  start: () => void;
  stop: () => void;
  destroy: () => void;
}

export type BrowserVoiceOption = VoiceOption;

const DEFAULT_LANG = "it-IT";
const PIPER_INIT_TIMEOUT_MS = 15000;
const GOOGLE_FALLBACK_MESSAGE = "Google italiano non disponibile su questo browser, uso voce alternativa.";

const browserEngine = new BrowserTtsEngine();
const piperEngine = new PiperTtsEngine();

const piperVoices = manifest as VoiceOption[];
let cachedBrowserVoices: VoiceOption[] = [];

const browserFallbackVoice: VoiceOption = {
  id: "browser:auto",
  label: "Browser Default",
  description: "Fallback gratuito del browser",
  provider: "browser",
  lang: DEFAULT_LANG,
};

/**
 * withTimeout: descrive il comportamento principale di questa funzione.
 * @param promise Input richiesto dalla funzione.
 * @param timeoutMs Input richiesto dalla funzione.
 * @param timeoutMessage Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * normalizeLang: descrive il comportamento principale di questa funzione.
 * @param lang Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeLang(lang: string): string {
  return lang.toLowerCase().split("-")[0];
}

/**
 * normalizeLabel: descrive il comportamento principale di questa funzione.
 * @param label Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * isItalian: descrive il comportamento principale di questa funzione.
 * @param voice Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function isItalian(voice: VoiceOption): boolean {
  return normalizeLang(voice.lang) === "it";
}

/**
 * isGoogleItalianVoiceCandidate: descrive il comportamento principale di questa funzione.
 * @param voice Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function isGoogleItalianVoiceCandidate(voice: VoiceOption): boolean {
  const id = voice.id.toLowerCase();
  const label = normalizeLabel(voice.label);
  return isItalian(voice) && (id.includes("google") || label.includes("google"));
}

/**
 * isRecommendedGoogleVoice: descrive il comportamento principale di questa funzione.
 * @param voice Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function isRecommendedGoogleVoice(voice: VoiceOption): boolean {
  return voice.provider === "browser" && isGoogleItalianVoiceCandidate(voice);
}

/**
 * resolvePreferredItalianGoogleVoice: descrive il comportamento principale di questa funzione.
 * @param voices Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function resolvePreferredItalianGoogleVoice(voices: VoiceOption[]): VoiceOption | undefined {
  return voices.find((voice) => isGoogleItalianVoiceCandidate(voice));
}

/**
 * resolveItalianFallbackVoice: descrive il comportamento principale di questa funzione.
 * @param voices Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function resolveItalianFallbackVoice(voices: VoiceOption[]): VoiceOption | undefined {
  return voices.find((voice) => isItalian(voice)) || voices[0];
}

/**
 * dedupeBrowserVoices: descrive il comportamento principale di questa funzione.
 * @param voices Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function dedupeBrowserVoices(voices: VoiceOption[]): VoiceOption[] {
  const seen = new Set<string>();
  const result: VoiceOption[] = [];

  for (const voice of voices) {
    const key = `${normalizeLabel(voice.label)}|${voice.lang.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(voice);
  }

  return result;
}

/**
 * sortBrowserVoicesForPicker: descrive il comportamento principale di questa funzione.
 * @param voices Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function sortBrowserVoicesForPicker(voices: VoiceOption[]): VoiceOption[] {
  const googlePreferred = resolvePreferredItalianGoogleVoice(voices);
  const remaining = voices.filter((voice) => voice.id !== googlePreferred?.id);
  remaining.sort((a, b) => a.label.localeCompare(b.label));
  return googlePreferred ? [googlePreferred, ...remaining] : remaining;
}

/**
 * ensureBrowserVoicesLoaded: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
async function ensureBrowserVoicesLoaded(): Promise<void> {
  if (cachedBrowserVoices.length > 0) return;
  const browserVoices = await browserEngine.getVoices();
  cachedBrowserVoices = sortBrowserVoicesForPicker(dedupeBrowserVoices(browserVoices));
}

/**
 * resolveVoiceById: descrive il comportamento principale di questa funzione.
 * @param voiceId Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function resolveVoiceById(voiceId: string): VoiceOption | null {
  return (
    cachedBrowserVoices.find((voice) => voice.id === voiceId) ||
    piperVoices.find((voice) => voice.id === voiceId) ||
    (voiceId === browserFallbackVoice.id ? browserFallbackVoice : null)
  );
}

/**
 * resolveVoice: descrive il comportamento principale di questa funzione.
 * @param voiceId Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function resolveVoice(voiceId?: string): VoiceOption {
  if (voiceId) {
    const found = resolveVoiceById(voiceId);
    if (found) return found;
  }

  const recommendedBrowser = resolvePreferredItalianGoogleVoice(cachedBrowserVoices);
  return recommendedBrowser || piperVoices[0] || resolveItalianFallbackVoice(cachedBrowserVoices) || browserFallbackVoice;
}

/**
 * getAvailableVoices: descrive il comportamento principale di questa funzione.
 * @param langPrefix Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getAvailableVoices(langPrefix = "it"): Promise<VoiceOption[]> {
  const browserVoices = await browserEngine.getVoices();
  const deduped = dedupeBrowserVoices(browserVoices);
  const ordered = sortBrowserVoicesForPicker(deduped);
  cachedBrowserVoices = ordered;

  const lowerPrefix = langPrefix.toLowerCase();
  const preferred = ordered.filter((voice) => voice.lang.toLowerCase().startsWith(lowerPrefix));
  const browserForPicker = preferred.length > 0 ? preferred : ordered;

  const recommendedGoogle = resolvePreferredItalianGoogleVoice(ordered);
  let trimmed = browserForPicker.slice(0, 8);

  if (recommendedGoogle && !trimmed.some((voice) => voice.id === recommendedGoogle.id)) {
    trimmed = [recommendedGoogle, ...trimmed.slice(0, 7)];
  }

  return [...trimmed, ...piperVoices, browserFallbackVoice];
}

/**
 * getAvailableBrowserVoices: descrive il comportamento principale di questa funzione.
 * @param langPrefix Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function getAvailableBrowserVoices(langPrefix = "it"): Promise<BrowserVoiceOption[]> {
  return getAvailableVoices(langPrefix);
}

/**
 * resolveInitialPreferredVoiceId: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function resolveInitialPreferredVoiceId(): Promise<{ voiceId: string | null; message?: string }> {
  await ensureBrowserVoicesLoaded();
  const googleVoice = resolvePreferredItalianGoogleVoice(cachedBrowserVoices);
  if (googleVoice) {
    return { voiceId: googleVoice.id };
  }

  const fallback = resolveItalianFallbackVoice(cachedBrowserVoices);
  if (!fallback) return { voiceId: null };

  return {
    voiceId: fallback.id,
    message: GOOGLE_FALLBACK_MESSAGE,
  };
}

/**
 * prepareVoice: descrive il comportamento principale di questa funzione.
 * @param voiceId Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function prepareVoice(voiceId?: string): Promise<{ provider: "piper" | "browser"; ready: boolean; message?: string }> {
  await ensureBrowserVoicesLoaded();

  if (voiceId) {
    const selected = resolveVoiceById(voiceId);
    if (!selected) {
      await browserEngine.init();
      return {
        provider: "browser",
        ready: browserEngine.isReady(),
        message: voiceId.toLowerCase().includes("google")
          ? GOOGLE_FALLBACK_MESSAGE
          : "Voce selezionata non disponibile, uso voce alternativa.",
      };
    }
  }

  const voice = resolveVoice(voiceId);

  if (voice.provider === "browser") {
    await browserEngine.init();
    return { provider: "browser", ready: browserEngine.isReady() };
  }

  try {
    await withTimeout(
      piperEngine.init(voice.id),
      PIPER_INIT_TIMEOUT_MS,
      "Timeout caricamento modello vocale"
    );
    return { provider: "piper", ready: true };
  } catch {
    await browserEngine.init();
    return {
      provider: "browser",
      ready: browserEngine.isReady(),
      message: "Voce Piper non pronta, uso fallback browser.",
    };
  }
}

/**
 * stopSpeaking: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function stopSpeaking(): void {
  piperEngine.stop();
  browserEngine.stop();
}

/**
 * speakText: descrive il comportamento principale di questa funzione.
 * @param text Input richiesto dalla funzione.
 * @param options Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export async function speakText(text: string, options: SpeakOptions = {}): Promise<void> {
  const safeText = text.trim();
  if (!safeText) {
    options.onEnd?.();
    return;
  }

  await ensureBrowserVoicesLoaded();

  if (options.voiceId) {
    const selectedVoice = resolveVoiceById(options.voiceId);
    if (!selectedVoice) {
      const fallbackVoice = resolveItalianFallbackVoice(cachedBrowserVoices);
      if (fallbackVoice) {
        options.onError?.(
          options.voiceId.toLowerCase().includes("google")
            ? GOOGLE_FALLBACK_MESSAGE
            : "Voce selezionata non disponibile, uso voce alternativa."
        );
        await browserEngine.speak(safeText, {
          ...options,
          voiceId: fallbackVoice.id,
          lang: fallbackVoice.lang,
        });
        return;
      }
    }
  }

  const voice = resolveVoice(options.voiceId);

  if (voice.provider === "browser") {
    const fallbackVoice = resolveItalianFallbackVoice(cachedBrowserVoices);
    const browserVoiceId = voice.id === browserFallbackVoice.id ? fallbackVoice?.id : voice.id;
    const browserLang = voice.id === browserFallbackVoice.id ? fallbackVoice?.lang || DEFAULT_LANG : voice.lang;

    await browserEngine.speak(safeText, {
      ...options,
      voiceId: browserVoiceId,
      lang: options.lang || browserLang || DEFAULT_LANG,
    });
    return;
  }

  try {
    await withTimeout(
      piperEngine.init(voice.id),
      PIPER_INIT_TIMEOUT_MS,
      "Timeout caricamento modello vocale"
    );

    await piperEngine.speak(safeText, {
      ...options,
      voiceId: voice.id,
      lang: options.lang || voice.lang || DEFAULT_LANG,
    });
  } catch {
    options.onError?.("Voce Piper non pronta, uso fallback browser.");
    const fallbackVoice = resolveItalianFallbackVoice(cachedBrowserVoices);
    await browserEngine.speak(safeText, {
      ...options,
      voiceId: fallbackVoice?.id,
      lang: fallbackVoice?.lang || DEFAULT_LANG,
    });
  }
}

/**
 * createVoiceRecognizer: descrive il comportamento principale di questa funzione.
 * @param options Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function createVoiceRecognizer(options: VoiceRecognizerOptions): VoiceRecognizerController {
  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionImpl) {
    return {
      supported: false,
      start: () => undefined,
      stop: () => undefined,
      destroy: () => undefined,
    };
  }

  const recognizer = new SpeechRecognitionImpl();
  recognizer.lang = options.lang || DEFAULT_LANG;
  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;

  recognizer.onstart = () => options.onStart?.();
  recognizer.onend = () => options.onEnd?.();
  recognizer.onerror = (event) => {
    options.onError?.(event.error || "Errore riconoscimento vocale");
  };
  recognizer.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const value = event.results[i][0]?.transcript || "";
      if (event.results[i].isFinal) {
        finalTranscript += value;
      } else {
        interimTranscript += value;
      }
    }

    if (interimTranscript.trim()) {
      options.onResult({ transcript: interimTranscript.trim(), isFinal: false });
    }

    if (finalTranscript.trim()) {
      options.onResult({ transcript: finalTranscript.trim(), isFinal: true });
    }
  };

  return {
    supported: true,
    start: () => recognizer.start(),
    stop: () => recognizer.stop(),
    destroy: () => recognizer.abort(),
  };
}