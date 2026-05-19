/**
 * File Overview: WelcomeModal.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Mic, Sparkles, ChevronRight, X, Trophy } from "lucide-react";

/**
 * WelcomeModal: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    // Funzione per verificare e mostrare il modal
    /**
     * checkAndShow: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const checkAndShow = () => {
      const hasSeenModal = sessionStorage.getItem("hasSeenWelcomeModal");
      if (!hasSeenModal) {
        // Un piccolo delay per dare il tempo all'app di "respirare" dopo il preloader
        setTimeout(() => setIsOpen(true), 1500);
      }
    };

    // Se il preloader è già stato visto in questa sessione (es. refresh pagina), mostra subito
    if (sessionStorage.getItem("hasSeenPreloader") === "true") {
      checkAndShow();
    }

    // Ascolta la fine del preloader
    /**
     * handlePreloaderComplete: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const handlePreloaderComplete = () => checkAndShow();
    window.addEventListener("preloaderComplete", handlePreloaderComplete);

    return () => {
      window.removeEventListener("preloaderComplete", handlePreloaderComplete);
    };
  }, []);

  /**
   * handleClose: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("hasSeenWelcomeModal", "true");
  };

  /**
   * nextStep: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const nextStep = () => {
    setStep(2);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/30 backdrop-blur-md"
        >
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 dark:border-gray-700/50"
          >
            {/* Pulsante di chiusura (visibile o meno, dipende da UX. Meglio metterlo per sicurezza) */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 md:p-10 flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
                    <Mic className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                    Prova <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Hei !Deddy AI</span>
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8">
                    Rivoluziona il tuo modo di lavorare. Usa la tua voce per navigare il gestionale a mani libere. Riduci i tempi operativi, migliora l'efficienza e aiuta Kemipol a raggiungere nuovi traguardi.
                  </p>

                  <button
                    onClick={nextStep}
                    className="group relative w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 px-6 rounded-2xl text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Gift className="w-5 h-5" />
                    <span>Scopri il tuo premio</span>
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  
                  <p className="text-sm text-gray-500 mt-4 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Incoraggiamo tutto il team ad utilizzarlo
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 md:p-10 flex flex-col items-center text-center"
                >
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full animate-pulse" />
                    <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                    Premi di Produzione
                  </h2>
                  
                  <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl p-4 mb-8 text-left">
                    <p className="text-gray-700 dark:text-gray-300 text-md leading-relaxed">
                      <strong>L'innovazione in Kemipol ti premia.</strong> Ogni volta che utilizzi il Command Center AI per le tue attività, 
                      accumuli punteggi che contribuiranno ai tuoi <span className="font-semibold text-orange-600 dark:text-orange-400">premi di produzione aziendali</span>. 
                      Più il team automatizza, maggiore sarà il bonus per tutti.
                    </p>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-2xl text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                  >
                    Inizia a usare l'AI
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
