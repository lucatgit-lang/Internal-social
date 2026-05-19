/**
 * File Overview: GestioneSpazi.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useState, useEffect } from "react";
import { 
  MapPin, 
  Search, 
  ArrowRightLeft, 
  Box, 
  Package, 
  Layers, 
  Zap, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Info,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

// Tipi
type TipoArea = "IN" | "OUT";
type TipoMerce = "Fast-Moving" | "Heavy" | "Standard";
type StatusVano = "libero" | "occupato" | "in_arrivo";

interface Item {
  id: string;
  nome: string;
  tipo: TipoMerce;
  qta: string;
}

interface Vano {
  id: string; // Es. A-01-1 (Corsia-Scaffale-Piano)
  piano: string;
  status: StatusVano;
  item?: Item;
}

interface Scaffale {
  id: string; // Es. 01, 02
  vani: Vano[];
}

interface Corsia {
  id: string; // Es. A, B
  nome: string;
  tipo: TipoMerce;
  scaffali: Scaffale[];
}

interface Area {
  id: TipoArea;
  nome: string;
  descrizione: string;
  corsie: Corsia[];
}

// MOCK DATA - Architettura IKEA per Settore Chimico
const magazzinoLayout: Area[] = [
  {
    id: "IN",
    nome: "Area IN - Materie Prime & Arrivi",
    descrizione: "Prodotti acquistati, solventi e resine pronti per il processo.",
    corsie: [
      {
        id: "A",
        nome: "Solventi Comuni",
        tipo: "Fast-Moving", // Alto rotazione, vicino ingresso/produzione
        scaffali: [
          {
            id: "01",
            vani: [
              { id: "IN-A-01-3", piano: "3", status: "libero" },
              { id: "IN-A-01-2", piano: "2", status: "occupato", item: { id: "ART-1001", nome: "Acetato di Etile", tipo: "Standard", qta: "IBC 1000L" } },
              { id: "IN-A-01-1", piano: "1", status: "occupato", item: { id: "ART-1005", nome: "Toluene", tipo: "Heavy", qta: "Fusto 200L" } },
            ]
          },
          {
            id: "02",
            vani: [
              { id: "IN-A-02-3", piano: "3", status: "libero" },
              { id: "IN-A-02-2", piano: "2", status: "in_arrivo", item: { id: "ART-1010", nome: "Metanolo", tipo: "Standard", qta: "Pallet" } },
              { id: "IN-A-02-1", piano: "1", status: "occupato", item: { id: "ART-1011", nome: "Xilene", tipo: "Heavy", qta: "Fusto 200L" } },
            ]
          }
        ]
      },
      {
        id: "B",
        nome: "Resine & Additivi",
        tipo: "Standard",
        scaffali: [
          {
            id: "01",
            vani: [
              { id: "IN-B-01-3", piano: "3", status: "occupato", item: { id: "ART-1002", nome: "Resina Epossidica", tipo: "Standard", qta: "Sacchi 25Kg" } },
              { id: "IN-B-01-2", piano: "2", status: "occupato", item: { id: "ART-1004", nome: "Pigmento Titanio", tipo: "Standard", qta: "Sacchi 25Kg" } },
              { id: "IN-B-01-1", piano: "1", status: "libero" },
            ]
          }
        ]
      }
    ]
  },
  {
    id: "OUT",
    nome: "Area OUT - Prodotti Finiti & Spedizioni",
    descrizione: "Prodotti processati, pronti per l'allestimento e la spedizione.",
    corsie: [
      {
        id: "X",
        nome: "Spedizioni Italia",
        tipo: "Fast-Moving",
        scaffali: [
          {
            id: "01",
            vani: [
              { id: "OUT-X-01-2", piano: "2", status: "occupato", item: { id: "PF-2001", nome: "Smalto Poliuretanico", tipo: "Standard", qta: "Pallet 50pz" } },
              { id: "OUT-X-01-1", piano: "1", status: "occupato", item: { id: "PF-2002", nome: "Diluente Nitro", tipo: "Heavy", qta: "Fusti 200L" } },
            ]
          },
          {
            id: "02",
            vani: [
              { id: "OUT-X-02-2", piano: "2", status: "libero" },
              { id: "OUT-X-02-1", piano: "1", status: "occupato", item: { id: "PF-2003", nome: "Fondo Epossidico", tipo: "Heavy", qta: "IBC 1000L" } },
            ]
          }
        ]
      },
      {
        id: "Y",
        nome: "Spedizioni Estero",
        tipo: "Standard",
        scaffali: [
          {
            id: "01",
            vani: [
              { id: "OUT-Y-01-2", piano: "2", status: "libero" },
              { id: "OUT-Y-01-1", piano: "1", status: "libero" },
            ]
          }
        ]
      }
    ]
  }
];

/**
 * GestioneSpaziMagazzino: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function GestioneSpaziMagazzino() {
  const [activeArea, setActiveArea] = useState<TipoArea>("IN");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVano, setSelectedVano] = useState<Vano | null>(null);
  
  // Stati per la modale di introduzione
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [showIntroDetails, setShowIntroDetails] = useState(false);

  const currentArea = magazzinoLayout.find(a => a.id === activeArea);

  // Ricerca globale (Item Locator)
  /**
   * handleSearch: descrive il comportamento principale di questa funzione.
   * @param q Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q) {
      setSelectedVano(null);
      return;
    }
    
    // Cerca in tutto il magazzino
    let foundVano = null;
    let foundAreaId = activeArea;

    for (const area of magazzinoLayout) {
      for (const corsia of area.corsie) {
        for (const scaffale of corsia.scaffali) {
          for (const vano of scaffale.vani) {
            if (vano.item && vano.item.nome.toLowerCase().includes(q.toLowerCase())) {
              foundVano = vano;
              foundAreaId = area.id;
              break;
            }
          }
          if (foundVano) break;
        }
        if (foundVano) break;
      }
      if (foundVano) break;
    }

    if (foundVano) {
      setActiveArea(foundAreaId);
      setSelectedVano(foundVano);
    } else {
      setSelectedVano(null);
    }
  };

  /**
   * getStatusColor: descrive il comportamento principale di questa funzione.
   * @param status Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const getStatusColor = (status: StatusVano) => {
    switch (status) {
      case "occupato": return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
      case "libero": return "bg-muted text-muted-foreground border-border/50";
      case "in_arrivo": return "bg-amber-500/20 text-amber-500 border-amber-500/30";
      default: return "";
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Modale di Introduzione */}
      <Dialog open={showIntroModal} onOpenChange={setShowIntroModal}>
        <DialogContent className="sm:max-w-[650px] bg-card/80 backdrop-blur-2xl border-border/50 shadow-2xl p-0 overflow-hidden rounded-3xl">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white mb-1">
                Il Tuo Nuovo Magazzino Kemipol
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-base">
                Semplice, veloce e a prova di errore
              </DialogDescription>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <p className="text-foreground text-lg leading-relaxed">
              Benvenuto nella nuova organizzazione del magazzino! Abbiamo ridisegnato gli spazi per rendere il tuo lavoro di tutti i giorni molto più <strong className="text-primary">facile, sicuro e meno faticoso</strong>.
              <br/><br/>
              Tutto ora ha un posto preciso e logico. In questo modo troverai subito quello che ti serve per la produzione o per le spedizioni, senza perdere tempo a cercare tra i bancali.
            </p>

            <AnimatePresence>
              {showIntroDetails && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-border/50 space-y-5 text-sm text-muted-foreground">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <ArrowDownToLine className="w-4 h-4 text-blue-500" /> Area IN (Arrivi e Materie Prime)
                      </h4>
                      <p>
                        Qui trovi solventi, resine e tutto ciò che serve per produrre:
                      </p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>I materiali che usiamo più spesso (es. Toluene e Acetati) sono vicini alla produzione, così fai meno strada con il muletto.</li>
                        <li>I carichi pesanti (Fusti e cisterne IBC) sono sempre sui ripiani in basso, per aiutarti a prelevarli in totale sicurezza e senza sforzi.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <ArrowUpFromLine className="w-4 h-4 text-purple-500" /> Area OUT (Prodotti Finiti e Spedizioni)
                      </h4>
                      <p>
                        Qui mettiamo i prodotti pronti per partire (smalti, fondi). Sono già divisi per destinazione (es. spedizioni Italia o Estero). In questo modo, quando arriva il camion, carichi la merce in un attimo!
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <Search className="w-4 h-4 text-primary" /> Il Tuo Aiutante Digitale
                      </h4>
                      <p>
                        Non devi più ricordarti a memoria dove sono i fusti! Ogni bancale ha un indirizzo esatto composto da 3 parti: <strong>Corsia, Scaffale e Vano</strong> (es. Corsia A, Scaffale 1, Vano 2). Usa la barra di ricerca in questa pagina e il sistema ti guiderà dritto al materiale, proprio come fa un navigatore.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mt-6 pt-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowIntroDetails(!showIntroDetails)}
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                {showIntroDetails ? (
                  <><ChevronUp className="w-4 h-4 mr-2" /> Mostra meno</>
                ) : (
                  <><ChevronDown className="w-4 h-4 mr-2" /> Scopri come funziona</>
                )}
              </Button>
              <Button onClick={() => setShowIntroModal(false)} className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                Ho capito, iniziamo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search & Global Controls (The "IKEA App" UX) */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-card/50 backdrop-blur-xl p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-muted-foreground mb-1 block flex items-center gap-2">
            <Search className="w-4 h-4" /> Trova Articolo (Item Locator)
          </label>
          <div className="relative">
            <Input 
              placeholder="Es. Acetato di Etile, Resina..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-4 h-12 text-lg bg-background/50 border-border/50 rounded-xl"
            />
            {selectedVano && (
              <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Trovato: {selectedVano.id}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeArea === "IN" ? "default" : "outline"} 
            onClick={() => setActiveArea("IN")}
            className={`h-12 px-6 rounded-xl transition-all ${activeArea === "IN" ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" : "bg-background/50"}`}
          >
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Area IN (Ricezione)
          </Button>
          <Button 
            variant={activeArea === "OUT" ? "default" : "outline"} 
            onClick={() => setActiveArea("OUT")}
            className={`h-12 px-6 rounded-xl transition-all ${activeArea === "OUT" ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20" : "bg-background/50"}`}
          >
            <ArrowUpFromLine className="w-4 h-4 mr-2" />
            Area OUT (Spedizioni)
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowIntroModal(true)}
            className="h-12 w-12 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Come è organizzato il magazzino?"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Mapping Area (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                {currentArea?.nome}
              </h2>
              <p className="text-muted-foreground text-sm">{currentArea?.descrizione}</p>
            </div>
            <div className="flex gap-2 text-xs font-medium">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30"></div> Occupato</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-muted border border-border/50"></div> Libero</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/30"></div> In Arrivo</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeArea}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {currentArea?.corsie.map((corsia) => (
                <Card key={corsia.id} className="border-border/50 bg-card/40 backdrop-blur-md overflow-hidden shadow-md group">
                  <div className="bg-gradient-to-r from-muted/50 to-transparent p-3 border-b border-border/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xl text-primary font-mono shadow-inner border border-primary/20">
                        {corsia.id}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          Corsia {corsia.id} - {corsia.nome}
                          {corsia.tipo === "Fast-Moving" && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-0 py-0 h-5 text-[10px]">
                              <Zap className="w-3 h-3 mr-1" /> Fast-Moving
                            </Badge>
                          )}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex gap-8 overflow-x-auto pb-4 snap-x">
                      {corsia.scaffali.map((scaffale) => (
                        <div key={scaffale.id} className="flex flex-col gap-2 min-w-[200px] snap-center">
                          <div className="text-center text-sm font-mono text-muted-foreground font-semibold mb-2 bg-muted/30 py-1 rounded-md">
                            Scaffale {scaffale.id}
                          </div>
                          
                          {/* Rendering Vani from top (3) to bottom (1) */}
                          {[...scaffale.vani].reverse().map((vano) => {
                            const isSelected = selectedVano?.id === vano.id;
                            const isHeavy = vano.item?.tipo === "Heavy";

                            return (
                              <div 
                                key={vano.id}
                                onClick={() => setSelectedVano(vano)}
                                className={`
                                  relative p-3 rounded-xl border-2 transition-all cursor-pointer group/vano
                                  ${getStatusColor(vano.status)}
                                  ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02] shadow-lg z-10' : 'hover:border-primary/50'}
                                `}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-mono font-bold opacity-70">
                                    {vano.id} (P{vano.piano})
                                  </span>
                                  {isHeavy && (
                                    <ArrowDownToLine className="w-3 h-3 opacity-50" title="Heavy Item - Posto in basso" />
                                  )}
                                </div>
                                
                                <div className="h-12 flex flex-col justify-center">
                                  {vano.item ? (
                                    <>
                                      <p className="text-sm font-semibold truncate leading-tight" title={vano.item.nome}>{vano.item.nome}</p>
                                      <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                                        <Box className="w-3 h-3" /> {vano.item.qta}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm opacity-50 italic text-center w-full">Vano Libero</p>
                                  )}
                                </div>

                                {isSelected && (
                                  <div className="absolute inset-0 bg-primary/5 rounded-xl pointer-events-none animate-pulse" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Details & AI Optimization */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-lg h-full max-h-[600px] flex flex-col">
            <CardHeader className="border-b border-border/50 pb-4 bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Dettaglio Vano
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col">
              {selectedVano ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex flex-col items-center justify-center py-8">
                    <div className="text-4xl font-mono font-bold text-primary mb-2 tracking-wider">
                      {selectedVano.id}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Layers className="w-4 h-4" /> Piano {selectedVano.piano}
                    </div>
                  </div>

                  {selectedVano.item ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Contenuto</h4>
                        <p className="text-xl font-bold">{selectedVano.item.nome}</p>
                        <p className="text-sm opacity-80 mt-1">ID: {selectedVano.item.id}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-background rounded-xl border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Formato</p>
                          <p className="font-semibold text-sm">{selectedVano.item.qta}</p>
                        </div>
                        <div className="p-3 bg-background rounded-xl border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Stato</p>
                          <Badge variant="outline" className={getStatusColor(selectedVano.status)}>
                            {selectedVano.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-4 space-y-2">
                        <Button className="w-full bg-primary/10 text-primary hover:bg-primary/20 shadow-none border border-primary/20">
                          <ArrowRightLeft className="w-4 h-4 mr-2" /> Sposta Materiale
                        </Button>
                        <Button variant="outline" className="w-full">Stampa Etichetta Locazione</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 py-12">
                      <Box className="w-16 h-16 mb-4 text-muted-foreground" />
                      <p className="font-medium text-lg">Vano Vuoto</p>
                      <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">
                        Spazio disponibile per stoccaggio di tipo {selectedVano.piano === "1" ? "Heavy" : "Standard"}.
                      </p>
                    </div>
                  )}

                  {/* AI Suggestion based on IKEA logic */}
                  {selectedVano.item?.tipo === "Fast-Moving" && selectedVano.piano !== "1" && selectedVano.piano !== "2" && (
                     <div className="mt-auto p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                       <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                       <p className="text-xs text-amber-700 dark:text-amber-400">
                         <strong>Ottimizzazione AI:</strong> Questo è un articolo "Fast-Moving". Si consiglia di spostarlo al Piano 1 o 2 per velocizzare il prelievo.
                       </p>
                     </div>
                  )}
                  {selectedVano.item?.tipo === "Heavy" && selectedVano.piano !== "1" && (
                     <div className="mt-auto p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                       <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                       <p className="text-xs text-red-700 dark:text-red-400">
                         <strong>Avviso Ergonomia:</strong> Articolo pesante allocato in alto. Rischio sicurezza e rallentamento del carico. Spostare al Piano 1.
                       </p>
                     </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-12">
                  <Maximize2 className="w-12 h-12 mb-4 text-muted-foreground" />
                  <p className="text-sm">Seleziona un vano o cerca un articolo per visualizzare i dettagli di locazione.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}