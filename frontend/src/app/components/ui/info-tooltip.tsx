/**
 * File Overview: info-tooltip.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import React from "react"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"
import { cn } from "./utils"

interface InfoTooltipProps {
  text: React.ReactNode
  className?: string
  iconClassName?: string
}

/**
 * InfoTooltip: descrive il comportamento principale di questa funzione.
 * @param text Input richiesto dalla funzione.
 * @param className Input richiesto dalla funzione.
 * @param iconClassName Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function InfoTooltip({ text, className, iconClassName }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button" 
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus:outline-hidden align-middle ml-1.5",
              className
            )}
            onClick={(e) => {
              // Prevents other click events if nested
              e.stopPropagation()
            }}
          >
            <Info className={cn("h-4 w-4", iconClassName)} />
            <span className="sr-only">Info</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] p-3 text-sm font-normal text-left z-[100]" sideOffset={5}>
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
