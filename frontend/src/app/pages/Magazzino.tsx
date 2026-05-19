/**
 * File Overview: Magazzino.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useState, useEffect } from "react";
import {
  Package,
  PackageOpen,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Filter,
  History,
  Box,
  Layers,
  ShoppingCart,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2,
  Clock,
  QrCode,
  Truck
} from "lucide-react";
import { DataTable, Column } from "../components/shared/DataTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { Progress } from "../components/ui/progress";
import Slider from "react-slick";
import { GestioneSpaziMagazzino } from "../components/magazzino/GestioneSpazi";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// MOCK DATA 
const ordiniMagazzinoData = [
  { id: "OM-260401", fornitore: "Chimica Base Italia SpA", data: "01/04/2026", totale: "€ 12.500", stato: "confermato", arrivo_previsto: "04/04/2026" },
  { id: "OM-260402", fornitore: "Petrolchimica Europa SRL", data: "30/03/2026", totale: "€ 8.200", stato: "in_transito", arrivo_previsto: "Oggi 14:30" },
  { id: "OM-260403", fornitore: "Containers & Packaging SPA", data: "29/03/2026", totale: "€ 4.800", stato: "consegnato", arrivo_previsto: "-" },
  { id: "OM-260404", fornitore: "Resine & Co. SpA", data: "02/04/2026", totale: "€ 15.000", stato: "in_transito", arrivo_previsto: "03/04/2026" },
];

const giacenzeData = [
  { id: "ART-1001", articolo: "Acetato di Etile", categoria: "Solventi", qta: "12.500 Kg", soglia: "15.000 Kg", stato: "sotto_scorta", locazione: "Silos 4" },
  { id: "ART-1002", articolo: "Resina Epossidica Base", categoria: "Resine", qta: "8.200 Kg", soglia: "5.000 Kg", stato: "regolare", locazione: "Magazzino A - Scaffale 2" },
  { id: "ART-1003", articolo: "Fusti Metallo 200L", categoria: "Imballi", qta: "150 pz", soglia: "200 pz", stato: "sotto_scorta", locazione: "Piazzale Est" },
  { id: "ART-1004", articolo: "Pigmento Bianco Titanio", categoria: "Pigmenti", qta: "4.500 Kg", soglia: "2.000 Kg", stato: "regolare", locazione: "Magazzino B" },
  { id: "ART-1005", articolo: "Toluene", categoria: "Solventi", qta: "1.200 Kg", soglia: "5.000 Kg", stato: "critico", locazione: "Silos 2" },
];

const movimentiData = [
  { id: "MOV-001", tipo: "Carico", articolo: "Pigmento Bianco Titanio", qta: "+2.000 Kg", data: "Oggi 10:15", causale: "Ricezione OM-260403" },
  { id: "MOV-002", tipo: "Scarico", articolo: "Acetato di Etile", qta: "-1.500 Kg", data: "Oggi 08:30", causale: "Prelievo Produzione PRD-102" },
  { id: "MOV-003", tipo: "Scarico", articolo: "Fusti Metallo 200L", qta: "-50 pz", data: "Ieri 16:45", causale: "Prelievo Allestimento" },
];

const tickerData = [
  { text: "Toluene in esaurimento (Silos 2). Autonomia stimata: 1.5 gg.", type: "critical" },
  { text: "In arrivo oggi alle 14:30 autocisterna da Petrolchimica Europa SRL.", type: "info" },
  { text: "Nuova proposta di riordino AI generata per Fusti Metallo 200L.", type: "ai" },
  { text: "Ispezione di qualità superata per lotto Pigmento Bianco Titanio.", type: "success" },
];

const statoConfig = {
  confermato: { label: "Confermato", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  in_transito: { label: "In Transito", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  consegnato: { label: "Consegnato", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
};

const statoScortaConfig = {
  regolare: { label: "Regolare", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  sotto_scorta: { label: "Sotto Scorta", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  critico: { label: "Critico", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const movimentiOggiSlider = [
  { id: 1, type: "in", company: "Petrolchimica Europa", desc: "8.200 Kg materie prime. Autocisterna AB123CD.", time: "14:30", code: "IN-260402", color: "blue" },
  { id: 2, type: "out", company: "Logistica Nord Srl", desc: "3.500 Kg smalti e fondi. Bilico XY987ZT.", time: "15:45", code: "OUT-88992", color: "orange" },
  { id: 3, type: "in", company: "Solventi Speciali Spa", desc: "2 Cisterne IBC Toluene. Furgone FK444RR.", time: "16:30", code: "IN-260551", color: "purple" },
  { id: 4, type: "out", company: "Vernici Italiane SpA", desc: "1.200 Kg fondi e smalti. Furgone ZA456BB.", time: "17:15", code: "OUT-89001", color: "emerald" },
  { id: 5, type: "in", company: "Imballaggi Sud Srl", desc: "150 Fusti Metallo vuoti. Camion TR999PL.", time: "17:45", code: "IN-260580", color: "blue" },
  { id: 6, type: "out", company: "Edilizia & Colori", desc: "Pallet assortito 500 Kg. Camion AB777CC.", time: "18:00", code: "OUT-89005", color: "orange" },
];

/**
 * Magazzino: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Magazzino() {
  const [activeTab, setActiveTab] = useState("giacenze");
  const [scanned, setScanned] = useState(false);
  const [movimentiFilter, setMovimentiFilter] = useState<'all' | 'in' | 'out'>('all');

  // Ticker Carousel Settings
  const tickerSettings = {
    dots: false,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    vertical: true,
    verticalSwiping: true,
    autoplay: true,
    speed: 500,
    autoplaySpeed: 4000,
    arrows: false,
  };

  const ordiniColumns: Column<typeof ordiniMagazzinoData[0]>[] = [
    { key: "id", label: "Ordine", sortable: true, render: (v) => <span className="font-mono font-medium text-primary">#{v}</span> },
    { key: "fornitore", label: "Fornitore", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "data", label: "Data Rilascio", sortable: true },
    { key: "arrivo_previsto", label: "Arrivo Previsto", sortable: true, render: (v) => (
      <span className={v.includes("Oggi") ? "text-amber-500 font-semibold" : ""}>{v}</span>
    )},
    { key: "totale", label: "Valore", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "stato", label: "Stato Navigazione", render: (v: keyof typeof statoConfig) => <Badge variant="outline" className={statoConfig[v].color}>{statoConfig[v].label}</Badge> },
  ];

  const giacenzeColumns: Column<typeof giacenzeData[0]>[] = [
    { key: "id", label: "Codice", sortable: true, render: (v) => <span className="font-mono text-muted-foreground text-xs">{v}</span> },
    { key: "articolo", label: "Articolo", sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: "categoria", label: "Categoria", sortable: true },
    { key: "locazione", label: "Locazione", sortable: true, render: (v) => <span className="text-muted-foreground">{v}</span> },
    { key: "qta", label: "Giacenza", sortable: true, render: (v) => <span className="font-bold font-mono">{v}</span> },
    { key: "soglia", label: "Scorta Sicurezza", sortable: true, render: (v) => <span className="text-muted-foreground">{v}</span> },
    { key: "stato", label: "Status", render: (v: keyof typeof statoScortaConfig) => (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${v === 'regolare' ? 'bg-emerald-500' : v === 'sotto_scorta' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
        <Badge variant="outline" className={statoScortaConfig[v].color}>{statoScortaConfig[v].label}</Badge>
      </div>
    ) },
  ];

  const movimentiColumns: Column<typeof movimentiData[0]>[] = [
    { key: "data", label: "Data", sortable: true, render: (v) => <span className="text-muted-foreground">{v}</span> },
    { key: "tipo", label: "Operazione", sortable: true, render: (v) => (
      <div className="flex items-center gap-2">
        {v === "Carico" ? <ArrowDownToLine className="w-4 h-4 text-emerald-500" /> : <ArrowUpFromLine className="w-4 h-4 text-amber-500" />}
        <span className={v === "Carico" ? "text-emerald-500 font-medium" : "text-amber-500 font-medium"}>{v}</span>
      </div>
    ) },
    { key: "articolo", label: "Articolo", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "qta", label: "Quantità", sortable: true, render: (v) => <span className="font-mono font-bold">{v}</span> },
    { key: "causale", label: "Riferimento", sortable: true, render: (v) => <span className="text-xs text-muted-foreground">{v}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Ticker AI Insights */}
      <div className="w-full h-10 bg-black/5 dark:bg-white/5 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden flex items-center px-4 relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <Zap className="w-4 h-4 text-primary shrink-0 mr-3 z-20" />
        <div className="flex-1 overflow-hidden h-full">
          <Slider {...tickerSettings} className="h-full">
            {tickerData.map((item, index) => (
              <div key={index} className="h-10 flex items-center outline-none">
                <span className={`text-sm font-medium flex items-center gap-2 h-full py-2.5 ${
                  item.type === 'critical' ? 'text-red-500' : 
                  item.type === 'info' ? 'text-blue-500' : 
                  item.type === 'success' ? 'text-emerald-500' : 'text-primary'
                }`}>
                  {item.text}
                </span>
              </div>
            ))}
          </Slider>
        </div>
      </div>

      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Magazzino Unificato</h1>
            <Badge variant="secondary">Sorgente locale simulata</Badge>
          </div>
          <p className="text-muted-foreground mt-2 text-lg">Integrazione giacenze, ordini d'acquisto e logistica in ingresso.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="bg-background/50 backdrop-blur-md border-border/50 shadow-sm" onClick={() => setScanned(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            Scannerizza
          </Button>
          <Button size="default" className="shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300">
            <PackageOpen className="mr-2 h-5 w-5" />
            Nuovo Movimento
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            Giacenze, ordini acquisto e ticker AI in questa pagina sono ancora dati demo locali. Integrazione backend reale non
            completata.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main Content Area (3 cols) */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="border-border/50 shadow-2xl bg-card/40 backdrop-blur-2xl overflow-hidden rounded-3xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-border/50 bg-muted/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList className="bg-background/40 p-1 backdrop-blur-md h-auto gap-1">
                  <TabsTrigger value="giacenze" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg px-5 py-2.5 transition-all">
                    <Box className="w-4 h-4 mr-2" />
                    Inventario
                  </TabsTrigger>
                  <TabsTrigger value="ordini" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg px-5 py-2.5 transition-all">
                    <Truck className="w-4 h-4 mr-2" />
                    Ordini Fornitori
                    <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center rounded-full">2</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="movimenti" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg px-5 py-2.5 transition-all">
                    <History className="w-4 h-4 mr-2" />
                    Movimentazioni
                  </TabsTrigger>
                  <TabsTrigger value="spazi" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg px-5 py-2.5 transition-all relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
                    <Layers className="w-4 h-4 mr-2 relative z-10" />
                    <span className="relative z-10">Gestione Spazi (3D)</span>
                    <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center rounded-full relative z-10 shadow-sm shadow-blue-500/20 border-0">NEW</Badge>
                  </TabsTrigger>
                </TabsList>
                
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={activeTab === 'giacenze' ? "Cerca materiale, silos, lotto..." : activeTab === 'ordini' ? "Cerca ordine o fornitore..." : activeTab === 'movimenti' ? "Cerca movimento..." : "Trova area, corsia o articolo..."} 
                    className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/20 transition-all rounded-xl shadow-inner"
                  />
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="sync">
                  <TabsContent key="tab-giacenze" value="giacenze" forceMount className="mt-0 outline-none hidden data-[state=active]:block">
                    <motion.div
                      key="giacenze"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DataTable 
                        data={giacenzeData} 
                        columns={giacenzeColumns} 
                      />
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent key="tab-ordini" value="ordini" forceMount className="mt-0 outline-none hidden data-[state=active]:block">
                    <motion.div
                      key="ordini"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 cursor-pointer hover:bg-amber-500/20">In Transito (2)</Badge>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 cursor-pointer hover:bg-blue-500/20">Confermati (1)</Badge>
                        </div>
                        <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 shadow-none">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Genera Ordine da Fabbisogno AI
                        </Button>
                      </div>
                      <DataTable 
                        data={ordiniMagazzinoData} 
                        columns={ordiniColumns} 
                      />
                    </motion.div>
                  </TabsContent>

                  <TabsContent key="tab-movimenti" value="movimenti" forceMount className="mt-0 outline-none hidden data-[state=active]:block">
                    <motion.div
                      key="movimenti"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DataTable 
                        data={movimentiData} 
                        columns={movimentiColumns} 
                      />
                    </motion.div>
                  </TabsContent>
                  <TabsContent key="tab-spazi" value="spazi" forceMount className="mt-0 outline-none hidden data-[state=active]:block">
                    <motion.div
                      key="spazi"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <GestioneSpaziMagazzino />
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </div>
            </Tabs>
          </Card>
        </div>

        {/* Right Sidebar - Widgets (1 col) */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 backdrop-blur-xl shadow-lg overflow-hidden group">
            <CardHeader className="pb-3 border-b border-border/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Stato Operativo
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Normale</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Capacità Silos (Solventi)</span>
                  <span className="font-semibold text-amber-500">82%</span>
                </div>
                <Progress value={82} className="h-1.5 [&>div]:bg-amber-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Capacità Magazzino (Fusti)</span>
                  <span className="font-semibold text-emerald-500">45%</span>
                </div>
                <Progress value={45} className="h-1.5 [&>div]:bg-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/20 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                Azioni Richieste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-2 relative z-10">
                <div className="p-3 bg-background/60 rounded-xl border border-border/50 text-sm shadow-sm backdrop-blur-md">
                  <p className="font-medium text-foreground">Riordino Toluene</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">Scorta critica raggiunta (1.200 Kg). Produzione PRD-102 a rischio tra 2 giorni.</p>
                  <Button size="sm" className="w-full text-xs bg-amber-500 hover:bg-amber-600 text-white">
                    <ShoppingCart className="w-3 h-3 mr-2" />
                    Crea Ordine Rapido
                  </Button>
                </div>
                
                {scanned && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-sm shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">Barcode Letto</p>
                    </div>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-300 mb-2">Lotto PBT-892 pronto per il carico a sistema.</p>
                    <Button size="sm" className="w-full text-xs bg-emerald-500 hover:bg-emerald-600 text-white">Registra Entrata</Button>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sezione full-width Slider sotto la griglia */}
      <div className="max-w-[1400px] mx-auto w-full mt-6">
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-2 border-b border-border/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Live: Movimenti di Oggi
              </CardTitle>
              <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border border-border/30">
                <Button 
                  variant={movimentiFilter === 'all' ? "secondary" : "ghost"} 
                  size="sm" 
                  className={`text-xs h-8 ${movimentiFilter === 'all' ? 'bg-background shadow-sm' : ''}`}
                  onClick={() => setMovimentiFilter('all')}
                >
                  Tutti
                </Button>
                <Button 
                  variant={movimentiFilter === 'in' ? "secondary" : "ghost"} 
                  size="sm" 
                  className={`text-xs h-8 ${movimentiFilter === 'in' ? 'bg-blue-500/10 text-blue-600 hover:text-blue-700' : 'text-muted-foreground'}`}
                  onClick={() => setMovimentiFilter('in')}
                >
                  In Arrivo
                </Button>
                <Button 
                  variant={movimentiFilter === 'out' ? "secondary" : "ghost"} 
                  size="sm" 
                  className={`text-xs h-8 ${movimentiFilter === 'out' ? 'bg-orange-500/10 text-orange-600 hover:text-orange-700' : 'text-muted-foreground'}`}
                  onClick={() => setMovimentiFilter('out')}
                >
                  In Partenza
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="px-4 pb-4 relative [&_.slick-dots]:bottom-[-20px] [&_.slick-dots_li_button:before]:text-muted-foreground [&_.slick-dots_li.slick-active_button:before]:text-primary [&_.slick-prev]:left-[-15px] [&_.slick-next]:right-[-15px] [&_.slick-prev:before]:text-primary [&_.slick-next:before]:text-primary [&_.slick-track]:flex [&_.slick-slide]:flex [&_.slick-slide>div]:w-full">
              <Slider 
                dots={true} 
                infinite={false} 
                speed={500} 
                slidesToShow={3} 
                slidesToScroll={1} 
                autoplay={true} 
                autoplaySpeed={4000}
                arrows={true}
                responsive={[
                  { breakpoint: 1024, settings: { slidesToShow: 2 } },
                  { breakpoint: 640, settings: { slidesToShow: 1 } },
                ]}
              >
                {movimentiOggiSlider
                  .filter(m => movimentiFilter === 'all' ? true : m.type === movimentiFilter)
                  .map((movimento) => (
                  <div key={movimento.id} className="outline-none px-2 h-full">
                    <div className="h-full flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-border/30 hover:border-primary/30 transition-colors cursor-pointer group">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 bg-${movimento.color}-500/10`}>
                        <Truck className={`w-6 h-6 text-${movimento.color}-500`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{movimento.company}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem] leading-relaxed">{movimento.desc}</p>
                        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/30">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 bg-${movimento.color}-500/10 text-${movimento.color}-600 border-${movimento.color}-200 dark:border-${movimento.color}-900/50 uppercase tracking-wider font-semibold`}>
                            {movimento.type === 'in' ? 'Arrivo' : 'Scarico'}: {movimento.time}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted/30 px-1.5 py-0.5 rounded">{movimento.code}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
