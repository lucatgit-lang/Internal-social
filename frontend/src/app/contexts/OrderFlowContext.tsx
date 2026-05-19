/**
 * File Overview: OrderFlowContext.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { ProductPackage } from "../data/kemipol-products";
import { notify } from "../utils/notifications";

// ─── TIPI ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  codice: string;
  nome: string;
  linea: string;
  confezione: string;
  barcode: string;
  euroLt: number;
  euroPz: number;
  qty: number;
  subtotale: number;
}

export type OrdineStato =
  | "in_approvazione"
  | "approvato"
  | "approvato_contabilita"
  | "rifiutato"
  | "in_produzione"
  | "in_preparazione"
  | "da_movimentare"
  | "completato";

export type OrdinePriorita = "normale" | "alta" | "urgente";

export interface OrdineAgente {
  id: string;
  numero: string;
  cliente: string;
  clienteId: string;
  agente: string;
  dataCreazione: string;
  oraCreazione: string;
  items: CartItem[];
  totale: number;
  note: string;
  priorita: OrdinePriorita;
  stato: OrdineStato;
  dataApprovazione?: string;
  approvatoDa?: string;
  motivoRifiuto?: string;
  dataAvvio?: string;
  shippingService?: "SILVER" | "GOLD";
  shippingCost?: number;
}

interface SubmitOrderParams {
  cliente: string;
  clienteId: string;
  note: string;
  priorita: OrdinePriorita;
  shippingService?: "SILVER" | "GOLD";
  shippingCost?: number;
}

export interface Tank {
  id: string;
  nome: string;
  capacita: number;
  livello: number;
  ultimoRiempimento: string;
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

interface OrderFlowContextType {
  // Modalità ordine (agente sta compilando un ordine)
  isOrderMode: boolean;
  enterOrderMode: () => void;
  exitOrderMode: () => void;

  // Carrello
  cartItems: CartItem[];
  addToCart: (
    productId: string,
    pkg: ProductPackage & { linea: string; codice: string; nome: string },
    qty: number
  ) => void;
  removeFromCart: (productId: string, confezione: string) => void;
  updateQty: (productId: string, confezione: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Ordini
  orders: OrdineAgente[];
  submitOrder: (params: SubmitOrderParams) => string;
  approveOrder: (id: string, approvatoDa: string) => void;
  approvaContabilitaOrdine: (id: string) => void;
  rejectOrder: (id: string, motivo: string) => void;
  avviaProduzioneOrdine: (id: string) => void;
  completaProduzioneOrdine: (id: string) => void;
  
  // Serbatoi
  tanks: Tank[];
  consumeMaterial: (tankId: string, amount: number) => void;
}

const OrderFlowContext = createContext<OrderFlowContextType | undefined>(undefined);

// ─── PROVIDER ────────────────────────────────────────────────────────────────

let orderCounter = 1000;

/**
 * OrderFlowProvider: descrive il comportamento principale di questa funzione.
 * @param children Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function OrderFlowProvider({ children }: { children: ReactNode }) {
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrdineAgente[]>([]);
  
  const [tanks, setTanks] = useState<Tank[]>([
    { id: "S01", nome: "Serbatoio Acetone", capacita: 50000, livello: 38500, ultimoRiempimento: "28/03/2026" },
    { id: "S02", nome: "Serbatoio Toluolo", capacita: 50000, livello: 12000, ultimoRiempimento: "20/03/2026" },
    { id: "S03", nome: "Serbatoio Metanolo", capacita: 10000, livello: 8200, ultimoRiempimento: "30/03/2026" },
    { id: "S04", nome: "Acqua Demineralizzata", capacita: 30000, livello: 2500, ultimoRiempimento: "15/03/2026" },
  ]);

  const enterOrderMode = useCallback(() => {
    setIsOrderMode(true);
    setCartItems([]);
  }, []);

  const exitOrderMode = useCallback(() => {
    setIsOrderMode(false);
    setCartItems([]);
  }, []);

  const addToCart = useCallback(
    (
      productId: string,
      pkg: ProductPackage & { linea: string; codice: string; nome: string },
      qty: number
    ) => {
      notify.pop(); // Suono pop per aggiunta al carrello
      setCartItems((prev) => {
        const key = `${productId}__${pkg.confezione}`;
        const exists = prev.find(
          (i) => i.productId === productId && i.confezione === pkg.confezione
        );
        if (exists) {
          return prev.map((i) =>
            i.productId === productId && i.confezione === pkg.confezione
              ? { ...i, qty: i.qty + qty, subtotale: (i.qty + qty) * i.euroPz }
              : i
          );
        }
        const newItem: CartItem = {
          productId,
          codice: pkg.codice,
          nome: pkg.nome,
          linea: pkg.linea,
          confezione: pkg.confezione,
          barcode: pkg.barcode,
          euroLt: pkg.euroLt,
          euroPz: pkg.euroPz,
          qty,
          subtotale: qty * pkg.euroPz,
        };
        return [...prev, newItem];
      });
    },
    []
  );

  const removeFromCart = useCallback((productId: string, confezione: string) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.confezione === confezione))
    );
  }, []);

  const updateQty = useCallback(
    (productId: string, confezione: string, qty: number) => {
      if (qty <= 0) {
        removeFromCart(productId, confezione);
        return;
      }
      setCartItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.confezione === confezione
            ? { ...i, qty, subtotale: qty * i.euroPz }
            : i
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => setCartItems([]), []);

  const cartTotal = cartItems.reduce((sum, i) => sum + i.subtotale, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const submitOrder = useCallback(
    ({ cliente, clienteId, note, priorita, shippingService, shippingCost }: SubmitOrderParams): string => {
      orderCounter++;
      const now = new Date();
      const newOrder: OrdineAgente = {
        id: `ord-${orderCounter}`,
        numero: `ORD-${orderCounter}`,
        cliente,
        clienteId,
        agente: "Marco Rossi",
        dataCreazione: now.toLocaleDateString("it-IT"),
        oraCreazione: now.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: [...cartItems],
        totale: cartTotal + (shippingCost || 0),
        note,
        priorita,
        stato: "in_approvazione",
        shippingService,
        shippingCost,
      };
      setOrders((prev) => [newOrder, ...prev]);
      setCartItems([]);
      setIsOrderMode(false);
      
      notify.success("Ordine inviato con successo", `L'ordine ${newOrder.numero} è in attesa di approvazione.`);
      return newOrder.id;
    },
    [cartItems, cartTotal]
  );

  const approveOrder = useCallback((id: string, approvatoDa: string) => {
    const now = new Date();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          notify.success("Ordine approvato", `L'ordine ${o.numero} è stato approvato da ${approvatoDa}.`);
          return {
            ...o,
            stato: "approvato" as OrdineStato,
            dataApprovazione: now.toLocaleDateString("it-IT"),
            approvatoDa,
          };
        }
        return o;
      })
    );
  }, []);

  const approvaContabilitaOrdine = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          notify.success("Contabilità confermata", `L'ordine ${o.numero} passa in Produzione.`);
          return {
            ...o,
            stato: "approvato_contabilita" as OrdineStato,
          };
        }
        return o;
      })
    );
  }, []);

  const rejectOrder = useCallback((id: string, motivo: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          notify.error("Ordine rifiutato", `L'ordine ${o.numero} è stato rifiutato.`);
          return { ...o, stato: "rifiutato" as OrdineStato, motivoRifiuto: motivo };
        }
        return o;
      })
    );
  }, []);

  const avviaProduzioneOrdine = useCallback((id: string) => {
    const now = new Date();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          notify.info("Produzione avviata", `I macchinari stanno lavorando all'ordine ${o.numero}.`);
          return {
            ...o,
            stato: "in_produzione" as OrdineStato,
            dataAvvio: now.toLocaleDateString("it-IT"),
          };
        }
        return o;
      })
    );
  }, []);

  const completaProduzioneOrdine = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          notify.success("Produzione completata", `L'ordine ${o.numero} è pronto per l'allestimento.`);
          return {
            ...o,
            stato: "in_preparazione" as OrdineStato, // Passa all'Allestimento!
          };
        }
        return o;
      })
    );
  }, []);

  const consumeMaterial = useCallback((tankId: string, amount: number) => {
    setTanks((prev) =>
      prev.map((tank) => {
        if (tank.id === tankId) {
          const nuovoLivello = Math.max(0, tank.livello - amount);
          if (nuovoLivello < tank.capacita * 0.1) {
            notify.warning(`Attenzione: Serbatoio ${tank.nome}`, "Livello critico, è necessario un riempimento.");
          }
          return { ...tank, livello: nuovoLivello };
        }
        return tank;
      })
    );
  }, []);

  return (
    <OrderFlowContext.Provider
      value={{
        isOrderMode,
        enterOrderMode,
        exitOrderMode,
        cartItems,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartTotal,
        cartCount,
        orders,
        submitOrder,
        approveOrder,
        approvaContabilitaOrdine,
        rejectOrder,
        avviaProduzioneOrdine,
        completaProduzioneOrdine,
        tanks,
        consumeMaterial,
      }}
    >
      {children}
    </OrderFlowContext.Provider>
  );
}

/**
 * useOrderFlow: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function useOrderFlow() {
  const ctx = useContext(OrderFlowContext);
  if (!ctx) throw new Error("useOrderFlow must be used within OrderFlowProvider");
  return ctx;
}