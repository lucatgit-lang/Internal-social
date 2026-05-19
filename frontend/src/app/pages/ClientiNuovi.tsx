/**
 * File Overview: ClientiNuovi.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { DataTable, Column } from "../components/shared/DataTable";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router";

const clientiNuoviData = [
  { id: "CLI005", ragioneSociale: "Gialli Edilizia SRL", ordiniTotali: 3, fatturato: "€ 18.900", dataRegistrazione: "15/03/2026", primoOrdine: "28/03/2026" },
];

/**
 * ClientiNuovi: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function ClientiNuovi() {
  const navigate = useNavigate();
  const columns: Column<typeof clientiNuoviData[0]>[] = [
    { key: "ragioneSociale", label: "Ragione Sociale", sortable: true },
    { key: "dataRegistrazione", label: "Data Registrazione", sortable: true },
    { key: "primoOrdine", label: "Primo Ordine", sortable: true },
    { key: "ordiniTotali", label: "Ordini", sortable: true },
    { key: "fatturato", label: "Fatturato", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Clienti Nuovi</h1>
        <p className="text-muted-foreground mt-1">Clienti registrati negli ultimi 30 giorni</p>
      </div>
      <DataTable data={clientiNuoviData} columns={columns} onRowClick={(row) => navigate(`/clienti/${row.id}`)} />
    </div>
  );
}
