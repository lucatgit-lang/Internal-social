/**
 * File Overview: Preloader.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../contexts/UserContext";
import { Sparkles, Command } from "lucide-react";

const loadingMessages = [
  "Inizializzazione AI Core...",
  "Connessione ai server Kemipol SRL...",
  "Sincronizzazione dati in corso...",
  "Preparazione dell'interfaccia...",
  "Generazione del Command Center...",
];

/**
 * Preloader: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Preloader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isRendered, setIsRendered] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const { user } = useUser();
  const userName = user?.name || "Utente";

  /**
   * playAppleChime: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const playAppleChime = () => {
    try {
      const userActivation = (navigator as Navigator & {
        userActivation?: { hasBeenActive?: boolean };
      }).userActivation;
      if (!userActivation?.hasBeenActive) {
        return;
      }

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Accordo di accensione stile Mac (Fa diesis maggiore)
      // F#1, F#2, C#3, F#3, A#3, C#4, F#4
      const frequencies = [46.25, 92.50, 138.59, 185.00, 233.08, 277.18, 369.99];
      
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.3; // Volume generale
      masterGain.connect(ctx.destination);

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Frequenze basse = onde più quadrate per calore, alte = sinusoidali per chiarezza
        osc.type = i < 2 ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        
        // Inviluppo sonoro (attacco veloce, decadimento lungo)
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1 / frequencies.length, ctx.currentTime + 0.05); // Attacco morbido ma rapido
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5); // Decadimento lungo
        
        osc.connect(gainNode);
        gainNode.connect(masterGain);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 4);
      });
    } catch (e) {
      console.log("Audio non supportato in automatico dal browser senza interazione utente.");
    }
  };

  useEffect(() => {
    // Riproduce il suono subito all'avvio
    playAppleChime();

    const totalDuration = 3500; // 3.5 secondi totale per non risultare pesante ad ogni avvio
    const messageDuration = totalDuration / loadingMessages.length;
    
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev < loadingMessages.length - 1) return prev + 1;
        return prev;
      });
    }, messageDuration);

    const updateInterval = 50;
    const steps = totalDuration / updateInterval;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const linearProgress = (currentStep / steps) * 100;
      
      // Effetto ease-in-out per la barra di progresso
      let easedProgress = linearProgress;
      if (linearProgress < 30) {
        easedProgress = linearProgress * 1.5;
      } else if (linearProgress < 70) {
        easedProgress = 45 + (linearProgress - 30) * 0.5;
      } else {
        easedProgress = 65 + (linearProgress - 70) * 1.16;
      }
      
      setProgress(Math.min(100, Math.max(0, easedProgress)));

      if (currentStep >= steps) {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        
        setTimeout(() => {
          setIsRendered(false);
          setTimeout(() => {
            setIsVisible(false);
            window.dispatchEvent(new Event("preloaderComplete"));
          }, 800); 
        }, 300);
      }
    }, updateInterval);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isRendered && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)", scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
        >
          {/* Animated Background Orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.4, 0.3],
                rotate: [0, 45, 0]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-900/40 blur-[100px] mix-blend-screen"
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
                rotate: [0, -45, 0]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] rounded-full bg-purple-900/30 blur-[120px] mix-blend-screen"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-2xl px-6 w-full text-center">
            
            {/* Logo / Title Area */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex flex-col items-center mb-12"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 shadow-[0_0_40px_rgba(59,130,246,0.2),inset_0_2px_10px_rgba(255,255,255,0.1)] flex items-center justify-center mb-8">
                <Command className="h-10 w-10 text-gray-300" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-3">
                Hei !Deddy
              </h1>
              <p className="text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-medium tracking-wide">
                Gestionale AI
              </p>
            </motion.div>

            {/* Welcome Text */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="h-8 mb-10"
            >
              <p className="text-gray-400 text-base">
                Bentornato, <span className="text-white font-medium">{userName}</span>.
              </p>
            </motion.div>

            {/* Progress Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="w-full max-w-md flex flex-col items-center"
            >
              {/* Progress Bar Container */}
              <div className="w-full h-1 bg-gray-800/80 rounded-full overflow-hidden backdrop-blur-sm mb-5 relative">
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-blue-500/30 blur-md transition-all duration-300 ease-out"
                  style={{ width: progress + "%" }}
                />
                
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-400 transition-all duration-300 ease-out relative"
                  style={{ width: progress + "%" }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/50 blur-[2px]" />
                </div>
              </div>

              {/* Changing gamified text */}
              <div className="h-6 w-full flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={messageIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-gray-400 font-light flex items-center gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    {loadingMessages[messageIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="mt-6 text-[10px] text-gray-600 font-mono tracking-widest uppercase">
                {Math.round(progress)}% COMPLETED
              </div>
            </motion.div>

            {/* Skip Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 3 }}
              onClick={() => {
                setIsRendered(false);
                setTimeout(() => {
                  setIsVisible(false);
                  window.dispatchEvent(new Event("preloaderComplete"));
                }, 800);
              }}
              className="mt-12 px-4 py-2 rounded-full border border-gray-800 text-gray-500 text-xs hover:text-white hover:border-gray-600 transition-colors bg-black/50 backdrop-blur-md"
            >
              Avvia ora
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
