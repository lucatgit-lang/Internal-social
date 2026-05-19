/**
 * File Overview: Agenti.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { Users, TrendingUp, DollarSign, MapPin, Briefcase, Database } from "lucide-react";
import { KPICard } from "../components/shared/KPICard";
import { DataTable, Column } from "../components/shared/DataTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";
import { salesAreas } from "../data/kemipol-data";
import { Card, CardContent } from "../components/ui/card";

// Placeholder anagrafico in attesa di sorgente backend dedicata.
const agentiData = salesAreas.map((area, index) => ({
  id: `agente-${index + 1}`,
  nome: area.agente,
  zona: area.nome,
  regioni: area.regioni.join(", "),
  telefono: area.telefono,
  clientiAttivi: null as number | null,
  ordiniGenerati: null as number | null,
  fatturato: null as number | null,
  fee: null as number | null,
  stato: "non_attivo",
}));

const statoConfig: Record<string, { label: string; color: string }> = {
  attivo: { label: "Attivo", color: "bg-success/20 text-success border-success/30" },
  in_ferie: { label: "In Ferie", color: "bg-warning/20 text-warning border-warning/30" },
  non_attivo: { label: "Non Attivo", color: "bg-muted text-muted-foreground border-border" },
};

/**
 * Agenti: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function Agenti() {
  const navigate = useNavigate();

  /**
   * formatCurrency: descrive il comportamento principale di questa funzione.
   * @param val Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const formatCurrency = (val: number) =>
    `€ ${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

  const columns: Column<typeof agentiData[0]>[] = [
    {
      key: "nome",
      label: "Agente",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 border border-primary/20 shadow-inner">
            {row.nome.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="font-medium text-foreground">{row.nome}</div>
            <div className="text-xs text-muted-foreground">{row.telefono}</div>
          </div>
        </div>
      ),
    },
    {
      key: "zona",
      label: "Zona",
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.zona}</span>
          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]" title={row.regioni}>
            {row.regioni}
          </span>
        </div>
      )
    },
    {
      key: "clientiAttivi",
      label: "Clienti Attivi",
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1.5 font-medium">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {typeof value === "number" ? value : "N/D"}
        </div>
      )
    },
    {
      key: "ordiniGenerati",
      label: "Ordini",
      sortable: true,
      render: (value) => <span>{typeof value === "number" ? value : "N/D"}</span>,
    },
    {
      key: "fatturato",
      label: "Fatturato",
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-foreground">
          {typeof value === "number" ? formatCurrency(value) : "N/D"}
        </span>
      ),
    },
    {
      key: "fee",
      label: "Fee Guadagnata",
      sortable: true,
      render: (value) => (
        <span className="font-bold text-success flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" />
          {typeof value === "number" ? formatCurrency(value) : "N/D"}
        </span>
      ),
    },
    {
      key: "stato",
      label: "Stato",
      sortable: true,
      render: (value) => {
        const config = statoConfig[value as string] || statoConfig.non_attivo;
        return (
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "id",
      label: "Azioni",
      render: (value) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/agenti/${value}`)} className="hover:bg-primary/10 hover:text-primary">
          Dettagli
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            Rete Vendita
          </h1>
          <p className="text-muted-foreground mt-1">Anagrafica agenti e copertura zone commerciali.</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Database className="h-3.5 w-3.5" />
          Sorgente reale non disponibile
        </Badge>
      </div>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-4 text-sm text-warning">
          KPI commerciali (fatturato, fee, clienti attivi, ordini) non ancora alimentate da backend reale.
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
          <Briefcase className="mr-2 h-4 w-4" />
          Nuovo Agente
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Totale Agenti"
          value="N/D"
          change={{ value: "Sorgente backend mancante", trend: "neutral" }}
          icon={Users}
        />
        <KPICard
          title="Fatturato Rete"
          value="N/D"
          change={{ value: "Sorgente backend mancante", trend: "neutral" }}
          icon={TrendingUp}
        />
        <KPICard
          title="Fee Erogate (Stima)"
          value="N/D"
          change={{ value: "Sorgente backend mancante", trend: "neutral" }}
          icon={DollarSign}
          trendColor="text-success"
        />
        <KPICard
          title="Clienti Raggiunti"
          value="N/D"
          change={{ value: "Sorgente backend mancante", trend: "neutral" }}
          icon={MapPin}
        />
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="border-b border-border/50 bg-muted/20 p-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            Elenco Agenti
          </h2>
        </div>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={agentiData}
            searchPlaceholder="Cerca per nome o zona..."
            searchable
          />
        </CardContent>
      </Card>
    </div>
  );
}
