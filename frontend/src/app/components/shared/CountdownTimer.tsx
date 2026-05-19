/**
 * File Overview: CountdownTimer.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useEffect, useState } from "react";
import { Clock, Timer } from "lucide-react";

interface CountdownTimerProps {
  initialSeconds: number;
  isRunning?: boolean;
}

/**
 * CountdownTimer: descrive il comportamento principale di questa funzione.
 * @param initialSeconds Input richiesto dalla funzione.
 * @param isRunning Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function CountdownTimer({ initialSeconds, isRunning = true }: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, secondsLeft]);

  if (initialSeconds <= 0) {
    return <span className="text-muted-foreground font-medium">-</span>;
  }

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const isLow = secondsLeft < 600; // Less than 10 minutes

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-sm font-semibold shadow-sm border ${
      isLow 
        ? 'bg-destructive/10 text-destructive border-destructive/20' 
        : 'bg-primary/10 text-primary border-primary/20'
    }`}>
      <Timer className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
      <span>
        {hours.toString().padStart(2, '0')}:
        {minutes.toString().padStart(2, '0')}:
        {seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
