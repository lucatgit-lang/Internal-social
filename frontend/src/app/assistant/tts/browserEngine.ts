/**
 * File Overview: browserEngine.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import type { SpeakOptions, TtsEngine, VoiceOption } from "./types";

export class BrowserTtsEngine implements TtsEngine {
  readonly provider = "browser" as const;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  /**
   * init: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
   */
  async init(): Promise<void> {
    await this.getVoices();
  }

  /**
   * isReady: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
   */
  isReady(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /**
   * stop: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
   */
  stop(): void {
    if (!this.isReady()) return;
    this.activeUtterance = null;
    window.speechSynthesis.cancel();
  }

  /**
   * getVoices: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.
   */
  async getVoices(): Promise<VoiceOption[]> {
    if (!this.isReady()) return [];
    const voices = await this.loadVoices();
    return voices.map((voice) => ({
      id: voice.voiceURI,
      label: voice.name,
      description: `${voice.lang}${voice.localService ? " - locale" : " - browser"}`,
      provider: "browser",
      lang: voice.lang,
    }));
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
      options.onError?.("speechSynthesis non disponibile");
      options.onEnd?.();
      return;
    }

    const safeText = text.trim();
    if (!safeText) {
      options.onEnd?.();
      return;
    }

    if (options.interrupt !== false) {
      window.speechSynthesis.cancel();
    }

    const voices = await this.loadVoices();
    const utterance = new SpeechSynthesisUtterance(safeText);
    utterance.lang = options.lang || "it-IT";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.voice = this.resolveVoice(voices, options.voiceId, utterance.lang) || null;

    await new Promise<void>((resolve) => {
      utterance.onstart = () => options.onStart?.();
      utterance.onend = () => {
        if (this.activeUtterance === utterance) this.activeUtterance = null;
        options.onEnd?.();
        resolve();
      };
      utterance.onerror = () => {
        if (this.activeUtterance === utterance) this.activeUtterance = null;
        options.onError?.("Riproduzione vocale browser fallita");
        options.onEnd?.();
        resolve();
      };

      this.activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  private resolveVoice(
    voices: SpeechSynthesisVoice[],
    voiceId?: string,
    lang = "it-IT"
  ): SpeechSynthesisVoice | undefined {
    if (!voices.length) return undefined;
    if (voiceId) {
      const exact = voices.find((voice) => voice.voiceURI === voiceId || voice.name === voiceId);
      if (exact) return exact;
    }
    return (
      voices.find((voice) => voice.lang.toLowerCase().startsWith("it")) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith(lang.toLowerCase())) ||
      voices[0]
    );
  }

  private async loadVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.isReady()) return [];
    const synth = window.speechSynthesis;
    const immediate = synth.getVoices();
    if (immediate.length > 0) return immediate;

    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        synth.onvoiceschanged = null;
        resolve(synth.getVoices());
      }, 400);

      synth.onvoiceschanged = () => {
        window.clearTimeout(timer);
        synth.onvoiceschanged = null;
        resolve(synth.getVoices());
      };
    });
  }
}