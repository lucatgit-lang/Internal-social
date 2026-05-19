/**
 * File Overview: ClientiNonAttivi.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { DataTable, Column } from "../components/shared/DataTable";
import { useNavigate } from "react-router";

const clientiNonAttiviData = [
  { id: "CLI004", ragioneSociale: "Neri Industrie SpA", ordiniAnno: 12, fatturato: "€ 45.600", ultimoOrdine: "15/01/2026", giorniInattivo: 77 },
];

/**
 * ClientiNonAttivi: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ClientiNonAttivi() {
  const navigate = useNavigate();
  const columns: Column<typeof clientiNonAttiviData[0]>[] = [
    { key: "ragioneSociale", label: "Ragione Sociale", sortable: true },
    { key: "ordiniAnno", label: "Ordini (Anno)", sortable: true },
    { key: "fatturato", label: "Fatturato", sortable: true },
    { key: "ultimoOrdine", label: "Ultimo Ordine", sortable: true },
    { key: "giorniInattivo", label: "Giorni Inattività", sortable: true, render: (v) => <span className="text-muted-foreground">{v} giorni</span> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Clienti Non Attivi</h1>
        <p className="text-muted-foreground mt-1">Clienti senza ordini da oltre 3 mesi</p>
      </div>
      <DataTable data={clientiNonAttiviData} columns={columns} onRowClick={(row) => navigate(`/clienti/${row.id}`)} />
    </div>
  );
}
