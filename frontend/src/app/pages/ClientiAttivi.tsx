/**
 * File Overview: ClientiAttivi.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { Users } from "lucide-react";
import { DataTable, Column } from "../components/shared/DataTable";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router";

const clientiAttiviData = [
  { id: "CLI001", ragioneSociale: "Rossi Mario SRL", ordiniAnno: 145, fatturato: "€ 285.400", ultimoOrdine: "02/04/2026" },
  { id: "CLI002", ragioneSociale: "Bianchi Giuseppe SpA", ordiniAnno: 89, fatturato: "€ 178.200", ultimoOrdine: "01/04/2026" },
  { id: "CLI003", ragioneSociale: "Verdi Costruzioni SRL", ordiniAnno: 234, fatturato: "€ 512.800", ultimoOrdine: "01/04/2026" },
];

/**
 * ClientiAttivi: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ClientiAttivi() {
  const navigate = useNavigate();
  const columns: Column<typeof clientiAttiviData[0]>[] = [
    { key: "ragioneSociale", label: "Ragione Sociale", sortable: true },
    { key: "ordiniAnno", label: "Ordini (Anno)", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "fatturato", label: "Fatturato", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "ultimoOrdine", label: "Ultimo Ordine", sortable: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Clienti Attivi</h1>
        <p className="text-muted-foreground mt-1">Clienti con ordini negli ultimi 3 mesi</p>
      </div>
      <DataTable data={clientiAttiviData} columns={columns} onRowClick={(row) => navigate(`/clienti/${row.id}`)} />
    </div>
  );
}
