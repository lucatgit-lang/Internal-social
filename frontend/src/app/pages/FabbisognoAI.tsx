/**
 * File Overview: FabbisognoAI.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Search,
  FileSearch,
  Globe,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Activity,
  Zap,
  Target
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { motion } from "motion/react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Mock data per il grafico dei prezzi e predizioni
const priceTrendData = [
  { mese: "Gen", solventeA: 1.20, solventeB: 0.85, solventeA_pred: null, solventeB_pred: null },
  { mese: "Feb", solventeA: 1.25, solventeB: 0.90, solventeA_pred: null, solventeB_pred: null },
  { mese: "Mar", solventeA: 1.15, solventeB: 0.95, solventeA_pred: null, solventeB_pred: null },
  { mese: "Apr", solventeA: 1.30, solventeB: 1.05, solventeA_pred: 1.30, solventeB_pred: 1.05 },
  { mese: "Mag", solventeA: null, solventeB: null, solventeA_pred: 1.22, solventeB_pred: 1.00 },
  { mese: "Giu", solventeA: null, solventeB: null, solventeA_pred: 1.18, solventeB_pred: 0.92 },
];

const tickerData = [
  { name: "Acetone Ecologico", price: "€1.15", trend: "-0.02", up: false },
  { name: "Toluolo Base", price: "€0.98", trend: "-0.05", up: false },
  { name: "Metanolo", price: "€0.45", trend: "-0.01", up: false },
  { name: "Alcool Isopropilico", price: "€1.45", trend: "+0.10", up: true },
  { name: "Glicole Propilenico", price: "€1.20", trend: "0.00", up: null },
  { name: "Etil Acetato", price: "€1.05", trend: "-0.03", up: false },
];

const targetAcquisti = [
  {
    id: 1,
    materiale: "Acetone Ecologico",
    prezzoAttuale: "€ 1,15/Lt",
    prezzoTargetAI: "€ 1,02/Lt",
    trend: "down",
    confidence: 92,
    fornitore: "Petrolchimica Europa SRL",
    argomentazione: "Eccesso di offerta globale e calo della domanda nel settore automotive europeo (-4%)."
  },
  {
    id: 2,
    materiale: "Toluolo Base",
    prezzoAttuale: "€ 0,98/Lt",
    prezzoTargetAI: "€ 0,90/Lt",
    trend: "down",
    confidence: 85,
    fornitore: "Chimica Base Italia SpA",
    argomentazione: "Costo del petrolio brent in discesa del 2,5% questo mese. Margini di raffinazione in calo."
  },
  {
    id: 3,
    materiale: "Alcool Isopropilico",
    prezzoAttuale: "€ 1,45/Lt",
    prezzoTargetAI: "€ 1,55/Lt",
    trend: "up",
    confidence: 88,
    fornitore: "Solventi & Derivati SpA",
    argomentazione: "Carenza di materia prima asiatica e blocchi nel canale di Suez. Anticipare acquisti immediati."
  }
];

/**
 * FabbisognoAI: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function FabbisognoAI() {
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [scrapeComplete, setScrapeComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * handleStartScraping: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleStartScraping = () => {
    setIsScraping(true);
    setScrapeProgress(0);
    setScrapeComplete(false);
    
    // Simula un processo di scraping progressivo
    const interval = setInterval(() => {
      setScrapeProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScraping(false);
          setScrapeComplete(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Live Ticker dei Prezzi */}
      <div className="w-full bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden mb-6 h-12 flex items-center shadow-sm">
        <div className="px-4 border-r border-border/50 z-10 bg-background/50 flex items-center gap-2 font-bold tracking-wider text-xs h-full text-foreground/80 shadow-[4px_0_12px_rgba(0,0,0,0.05)]">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          MARKET LIVE
        </div>
        <div className="flex-1 overflow-hidden relative flex h-full items-center">
          {/* Sfumature laterali per il marquee */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card/90 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card/90 to-transparent z-10" />
          
          <motion.div
            className="flex whitespace-nowrap gap-8 px-4 items-center h-full"
            animate={{ x: [0, "-50%"] }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          >
            {[...tickerData, ...tickerData, ...tickerData, ...tickerData].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">{item.name}</span>
                <span className="text-muted-foreground font-mono">{item.price}</span>
                <span className={`text-xs font-bold flex items-center ${
                  item.up === true ? "text-success" : item.up === false ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {item.up === true ? <TrendingUp className="h-3 w-3 mr-0.5" /> : item.up === false ? <TrendingDown className="h-3 w-3 mr-0.5" /> : "—"} {item.trend}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Header con stile Apple/Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 pb-10">
        {/* Sfondo sfumato decorativo */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4 border border-primary/20">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-wide uppercase">AI Trader Desk</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Fabbisogno AI
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
              Analizza il mercato delle materie prime, simula le trattative e utilizza l'intelligenza artificiale per ottenere i prezzi migliori dai fornitori.
            </p>
          </div>
          
          <div className="flex shrink-0">
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-xl">
              <p className="text-sm text-muted-foreground mb-1 font-medium">Potenziale Risparmio</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-success">€ 14.500</span>
                <span className="text-sm font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">+12%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sezione Scraping e Formazione AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-primary/20 bg-card/40 backdrop-blur-sm overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Training AI Mercato
            </CardTitle>
            <CardDescription>
              Scrapa notizie, indici ICIS e Platts per addestrare l'AI sui prezzi attuali.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Es: Prezzo Toluene Europa..." 
                  className="pl-9 bg-background/50 border-border/50 focus:border-primary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">ICIS Lor</Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">Platts</Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">Brent</Badge>
              </div>
            </div>

            <div className="pt-2">
              {!isScraping && !scrapeComplete ? (
                <Button onClick={handleStartScraping} className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                  <Globe className="mr-2 h-5 w-5" />
                  Scrapa Informazioni
                </Button>
              ) : isScraping ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-primary animate-pulse">Analisi mercato in corso...</span>
                    <span>{scrapeProgress}%</span>
                  </div>
                  <Progress value={scrapeProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Raccolta dati da 42 fonti finanziarie e chimiche
                  </p>
                </div>
              ) : (
                <div className="space-y-4 bg-success/5 border border-success/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-success">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="font-semibold">Training Completato</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fonti analizzate:</span>
                      <span className="font-medium">124 articoli</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Indici aggiornati:</span>
                      <span className="font-medium">45 materie prime</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Affidabilità AI:</span>
                      <span className="font-medium text-success">94%</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-2" onClick={() => setScrapeComplete(false)}>
                    Nuova scansione
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grafico Previsioni */}
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Previsioni Costo Solventi Base</CardTitle>
              <CardDescription>
                Andamento reale e proiezioni AI a 3 mesi (Euro al Litro)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
              <Badge variant="outline" className="border-primary text-primary bg-primary/5">Acetone</Badge>
              <Badge variant="outline" className="border-accent-cyan text-accent-cyan bg-accent-cyan/5">Acetato</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSolventeA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSolventeA_pred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="mese" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ fontWeight: 500 }}
                  />
                  <Area type="monotone" dataKey="solventeA" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorSolventeA)" name="Acetone (Reale)" />
                  <Area type="monotone" dataKey="solventeA_pred" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorSolventeA_pred)" name="Acetone (AI)" />
                  
                  <Area type="monotone" dataKey="solventeB" stroke="hsl(var(--accent-cyan))" strokeWidth={3} fillOpacity={0} name="Acetato (Reale)" />
                  <Area type="monotone" dataKey="solventeB_pred" stroke="hsl(var(--accent-cyan))" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} name="Acetato (AI)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trattative Consigliate dall'AI */}
      <div className="space-y-4 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 mb-6">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-foreground" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Trattative Consigliate</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/50">
            <div className="w-2 h-2 rounded-full bg-success animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_hsl(var(--success))]" />
            Ultimo aggiornamento: 2 Aprile 2026, 14:30
          </div>
        </div>
        
        <div className="-mx-2">
          <Slider 
            dots={true}
            infinite={false}
            speed={500}
            slidesToShow={3}
            slidesToScroll={1}
            arrows={false}
            className="pb-8 [&_.slick-track]:flex [&_.slick-track]:gap-0 [&_.slick-slide]:h-auto [&_.slick-slide>div]:h-full"
            responsive={[
              { breakpoint: 1024, settings: { slidesToShow: 2 } },
              { breakpoint: 640, settings: { slidesToShow: 1 } }
            ]}
          >
            {targetAcquisti.map((item) => (
              <div key={item.id} className="px-3 h-full outline-none">
                <Card className="relative overflow-hidden group hover:border-primary/50 transition-colors bg-card/60 backdrop-blur-md h-full flex flex-col">
                  {/* Stato di "confidence" AI in background */}
                  <div 
                    className="absolute top-0 right-0 w-2 h-full"
                    style={{ backgroundColor: item.trend === 'down' ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.materiale}</CardTitle>
                        <CardDescription className="font-medium mt-1">{item.fornitore}</CardDescription>
                      </div>
                      <Badge variant={item.trend === 'down' ? 'default' : 'destructive'} className="font-semibold shadow-sm">
                        {item.trend === 'down' ? 'Compra Ora' : 'Attendi'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between bg-background rounded-xl p-3 border border-border/50">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Prezzo Attuale</p>
                        <p className="text-xl font-medium text-foreground">{item.prezzoAttuale}</p>
                      </div>
                      <div className="h-10 w-px bg-border mx-2" />
                      <div className="space-y-1 text-right">
                        <p className="text-xs text-primary uppercase font-bold flex items-center justify-end gap-1">
                          <Sparkles className="h-3 w-3" /> Target AI
                        </p>
                        <p className="text-2xl font-bold text-primary drop-shadow-sm">{item.prezzoTargetAI}</p>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <FileSearch className="h-4 w-4 text-muted-foreground" />
                        Argomentazione per l'Acquisto
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed p-3 bg-muted/30 rounded-lg italic border-l-2 border-primary/40">
                        "{item.argomentazione}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-auto">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Affidabilità AI: {item.confidence}%
                        </span>
                      </div>
                      <Button size="sm" className="gap-1.5 shadow-sm shadow-primary/20">
                        <DollarSign className="h-4 w-4" /> Contrattare
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
}