/**
 * File Overview: notifications.ts
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { toast } from "sonner";

export interface AppNotification {
  id: string;
  type: "success" | "error" | "warning" | "info" | "pop";
  title: string;
  description?: string | React.ReactNode;
  timestamp: Date;
  read: boolean;
}

let notifications: AppNotification[] = [];
type NotificationListener = (notifications: AppNotification[]) => void;
const listeners: Set<NotificationListener> = new Set();

/**
 * subscribeToNotifications: descrive il comportamento principale di questa funzione.
 * @param listener Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export const subscribeToNotifications = (listener: NotificationListener) => {
  listeners.add(listener);
  listener(notifications);
  return () => listeners.delete(listener);
};

/**
 * markNotificationAsRead: descrive il comportamento principale di questa funzione.
 * @param id Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export const markNotificationAsRead = (id: string) => {
  notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  listeners.forEach(listener => listener(notifications));
};

/**
 * markAllNotificationsAsRead: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export const markAllNotificationsAsRead = () => {
  notifications = notifications.map(n => ({ ...n, read: true }));
  listeners.forEach(listener => listener(notifications));
};

/**
 * addNotificationToStore: descrive il comportamento principale di questa funzione.
 * @param type Input richiesto dalla funzione.
 * @param title Input richiesto dalla funzione.
 * @param description Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
const addNotificationToStore = (type: AppNotification["type"], title: string, description?: string | React.ReactNode) => {
  const newNotif: AppNotification = {
    id: Math.random().toString(36).substring(2, 9),
    type,
    title,
    description,
    timestamp: new Date(),
    read: false
  };
  notifications = [newNotif, ...notifications].slice(0, 50); // Keep last 50
  listeners.forEach(listener => listener(notifications));
};

// Web Audio API based sound generator for various notification types
/**
 * playNotificationSound: descrive il comportamento principale di questa funzione.
 * @param type Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
const playNotificationSound = (type: "success" | "error" | "info" | "warning" | "pop") => {
  try {
    const userActivation = (navigator as Navigator & {
      userActivation?: { hasBeenActive?: boolean };
    }).userActivation;
    if (!userActivation?.hasBeenActive) return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case "success":
        // Play a pleasant "ding-ding" (ascending major third)
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case "error":
        // Play an abrupt "buzzer" sound
        osc.type = "square";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case "warning":
        // Play a double "beep"
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now); // A4
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        const osc2 = ctx.createOscillator();
        const gainNode2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(440, now + 0.2);
        osc2.connect(gainNode2);
        gainNode2.connect(ctx.destination);
        gainNode2.gain.setValueAtTime(0, now + 0.2);
        gainNode2.gain.linearRampToValueAtTime(0.3, now + 0.25);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.15);
        osc2.start(now + 0.2);
        osc2.stop(now + 0.35);
        break;
      case "info":
        // Play a subtle "chime"
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case "pop":
        // Very quick subtle bubble sound
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
    }
  } catch (err) {
    console.error("Audio playback error:", err);
  }
};

export const notify = {
  success: (title: string, description?: string | React.ReactNode, options?: any) => {
    addNotificationToStore("success", title, description);
    playNotificationSound("success");
    toast.success(title, { description, ...options });
  },
  error: (title: string, description?: string | React.ReactNode, options?: any) => {
    addNotificationToStore("error", title, description);
    playNotificationSound("error");
    toast.error(title, { description, ...options });
  },
  warning: (title: string, description?: string | React.ReactNode, options?: any) => {
    addNotificationToStore("warning", title, description);
    playNotificationSound("warning");
    toast.warning(title, { description, ...options });
  },
  info: (title: string, description?: string | React.ReactNode, options?: any) => {
    addNotificationToStore("info", title, description);
    playNotificationSound("info");
    toast.info(title, { description, ...options });
  },
  pop: () => {
    playNotificationSound("pop");
  }
};
