/**
 * File Overview: piperEngine.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import manifest from "./voices.manifest.json";
import type { SpeakOptions, TtsEngine, VoiceOption } from "./types";

type WorkerRequest =
  | { id: string; type: "init"; voiceId: string }
  | { id: string; type: "speak"; voiceId: string; text: string };

type WorkerResponse =
  | { id: string; type: "ok" }
  | { id: string; type: "audio"; buffer: ArrayBuffer }
  | { id: string; type: "error"; message: string };

/**
 * uid: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function uid(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class PiperTtsEngine implements TtsEngine {
  readonly provider = "piper" as const;
  private readonly voices = manifest as VoiceOption[];
  private worker: Worker | null = null;
  private pending = new Map<string, { resolve: (value: WorkerResponse) => void; reject: (reason?: unknown) => void }>();
  private initializedVoices = new Set<string>();
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;

  /**
   * init: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
   */
  async init(voiceId?: string): Promise<void> {
    const targetVoiceId = voiceId || this.voices[0]?.id;
    if (!targetVoiceId) return;
    if (this.initializedVoices.has(targetVoiceId)) return;
    const worker = this.ensureWorker();
    const response = await this.request(worker, { id: uid(), type: "init", voiceId: targetVoiceId });
    if (response.type === "error") {
      throw new Error(response.message || "Inizializzazione Piper fallita");
    }
    this.initializedVoices.add(targetVoiceId);
  }

  /**
   * isReady: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
   */
  isReady(): boolean {
    return typeof Worker !== "undefined" && typeof window !== "undefined" && typeof Audio !== "undefined";
  }

  /**
   * stop: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
    }
    this.currentAudio = null;
    this.currentAudioUrl = null;
  }

  /**
   * getVoices: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
   */
  async getVoices(): Promise<VoiceOption[]> {
    return this.voices;
  }

  /**
   * speak: descrive il comportamento principale di questa funzione.
   * @param text Input richiesto dalla funzione.
   * @param options Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
   */
  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!this.isReady()) {
      options.onError?.("WebWorker o Audio non disponibili");
      options.onEnd?.();
      return;
    }

    const safeText = text.trim();
    if (!safeText) {
      options.onEnd?.();
      return;
    }

    const voiceId = options.voiceId || this.voices[0]?.id;
    if (!voiceId) {
      options.onError?.("Nessuna voce Piper configurata");
      options.onEnd?.();
      return;
    }

    if (options.interrupt !== false) {
      this.stop();
    }

    await this.init(voiceId);
    const worker = this.ensureWorker();
    const response = await this.request(worker, { id: uid(), type: "speak", voiceId, text: safeText });
    if (response.type !== "audio") {
      throw new Error(response.type === "error" ? response.message : "Audio Piper non disponibile");
    }

    this.stop();
    const blob = new Blob([response.buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    this.currentAudioUrl = url;
    const audio = new Audio(url);
    this.currentAudio = audio;

    await new Promise<void>((resolve) => {
      audio.onplay = () => options.onStart?.();
      audio.onended = () => {
        this.cleanupCurrentAudio();
        options.onEnd?.();
        resolve();
      };
      audio.onerror = () => {
        this.cleanupCurrentAudio();
        options.onError?.("Riproduzione audio Piper fallita");
        options.onEnd?.();
        resolve();
      };

      void audio.play().catch(() => {
        this.cleanupCurrentAudio();
        options.onError?.("Autoplay bloccato dal browser");
        options.onEnd?.();
        resolve();
      });
    });
  }

  private cleanupCurrentAudio(): void {
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
    }
    this.currentAudio = null;
    this.currentAudioUrl = null;
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker(new URL("./piper.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const payload = event.data;
      const resolver = this.pending.get(payload.id);
      if (!resolver) return;
      this.pending.delete(payload.id);
      resolver.resolve(payload);
    };
    worker.onerror = (event) => {
      const error = new Error(event.message || "Piper worker error");
      for (const [key, resolver] of this.pending.entries()) {
        this.pending.delete(key);
        resolver.reject(error);
      }
    };
    this.worker = worker;
    return worker;
  }

  private request(worker: Worker, payload: WorkerRequest): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      this.pending.set(payload.id, { resolve, reject });
      worker.postMessage(payload);
    });
  }
}

