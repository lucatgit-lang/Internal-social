/**
 * File Overview: types.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

export interface VoiceOption {
  id: string;
  label: string;
  description: string;
  provider: "piper" | "browser";
  lang: string;
  sampleRate?: number;
}

export interface SpeakOptions {
  voiceId?: string;
  lang?: string;
  interrupt?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

export interface TtsEngine {
  readonly provider: "piper" | "browser";
  init(voiceId?: string): Promise<void>;
  speak(text: string, options?: SpeakOptions): Promise<void>;
  stop(): void;
  getVoices(): Promise<VoiceOption[]>;
  isReady(): boolean;
}
