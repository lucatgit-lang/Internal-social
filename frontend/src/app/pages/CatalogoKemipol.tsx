/**
 * File Overview: CatalogoKemipol.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import {
  Package,
  Filter,
  Download,
  ShoppingCart,
  Barcode,
  Plus,
  Minus,
  X,
  Send,
  CheckCircle2,
  ArrowLeft,
  ChevronDown,
  Trash2,
  AlertCircle,
  Truck,
  Clock,
  Info,
  Factory
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { shippingInfo, Product, ProductPackage } from "../data/kemipol-products";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { cn } from "../components/ui/utils";
import { notify } from "../utils/notifications";
import { getTechnicalProducts, getTechnicalSdsAteco } from "../api/technical";
import { getCustomers, type CustomerListItem } from "../api/customers";
import { createOrder } from "../api/orders";
import { getApiStatusFromError, RemoteDataState, type RemoteState } from "../components/shared/RemoteDataState";

// ─── TIPI ────────────────────────────────────────────────────────────────────

interface QtyState {
  [key: string]: number; // `${productId}__${confezione}` → qty
}

interface ProductTechnicalStatus {
  hasSds: boolean;
  hasAteco: boolean;
}

type OrdinePriorita = "normale" | "alta" | "urgente";

interface CartItem {
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

/**
 * normalizeCatalogLine: descrive il comportamento principale di questa funzione.
 * @param value Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function normalizeCatalogLine(value: string | null | undefined): Product["linea"] {
  const raw = (value ?? "").toLowerCase().trim();
  if (raw.includes("greenpol")) return "Greenpol";
  if (raw.includes("green")) return "Green";
  if (raw.includes("special")) return "Specialkem";
  if (raw.includes("sir")) return "Sirkem";
  return "Kemipol";
}

/**
 * mapTechnicalProductToCatalogProduct: descrive il comportamento principale di questa funzione.


 * @param product Input richiesto dalla funzione.


 * @returns Valore restituito dalla funzione secondo il contratto corrente.


 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).


 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.


 */


function mapTechnicalProductToCatalogProduct(product: {
  id: string;
  code: string;
  name: string | null;
  productLine: string | null;
  unitCost: number;
}): Product {
  const name = product.name?.trim() || `Prodotto ${product.code}`;
  const line = normalizeCatalogLine(product.productLine);
  return {
    id: product.id,
    codice: product.code,
    nome: name,
    nomeEn: name,
    linea: line,
    categoria: product.productLine ?? "Tecnico",
    um: "pz",
    confezioni: [
      {
        confezione: "Unità",
        pzConf: 1,
        barcode: product.code,
        euroLt: 0,
        euroPz: product.unitCost,
      },
    ],
  };
}

const lineDescriptions: Record<string, string> = {
  Green: "Linea Green (Ecologica)",
  Kemipol: "Linea Kemipol (Professionale)",
  Specialkem: "Linea Specialkem (Speciale)",
  Sirkem: "Linea Sirkem (Economica)",
  Greenpol: "Linea Greenpol (Bio)",
};

/**
 * getLineDescription: descrive il comportamento principale di questa funzione.
 * @param line Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
function getLineDescription(line: string): string {
  return lineDescriptions[line] ?? `Linea ${line}`;
}

// ─── CARRELLO PANEL ───────────────────────────────────────────────────────────

/**
 * ProductCard: descrive il comportamento principale di questa funzione.


 * @param none Questa funzione non richiede parametri espliciti.


 * @returns Valore restituito dalla funzione secondo il contratto corrente.


 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).


 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.


 */


function ProductCard({
  product,
  technicalStatus,
  isOrderMode,
  qtyState,
  onQtyChange,
  onAddToCart,
}: {
  product: Product;
  technicalStatus?: ProductTechnicalStatus;
  isOrderMode: boolean;
  qtyState: QtyState;
  onQtyChange: (key: string, val: number) => void;
  onAddToCart: (pkg: ProductPackage, qty: number) => void;
}) {
  const lineaColors: Record<string, string> = {
    Green: "from-green-500 to-emerald-600",
    Kemipol: "from-primary to-blue-600",
    Specialkem: "from-accent-purple to-purple-700",
    Sirkem: "from-orange-500 to-red-500",
    Greenpol: "from-teal-500 to-cyan-600",
  };

  return (
    <Card className="hover:border-primary/50 transition-all hover:shadow-md group">
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-12">
          {/* Info Prodotto */}
          <div className="md:col-span-5">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br",
                  lineaColors[product.linea] || "from-primary to-accent-purple"
                )}
              >
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={cn("bg-gradient-to-r text-white text-xs", lineaColors[product.linea] || "from-primary to-accent-purple")}>
                    {product.linea}
                  </Badge>
                  {product.colore && <Badge variant="outline" className="text-xs">{product.colore}</Badge>}
                </div>
                <h3 className="font-semibold leading-tight">{product.nome}</h3>
                <p className="text-sm text-muted-foreground">{product.nomeEn}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{product.codice}</span>
                  <Badge variant="outline" className="text-xs">{product.categoria}</Badge>
                  <Badge variant={technicalStatus?.hasSds ? "default" : "outline"} className="text-xs">
                    {technicalStatus?.hasSds ? "SDS OK" : "SDS N/D"}
                  </Badge>
                  <Badge variant={technicalStatus?.hasAteco ? "secondary" : "outline"} className="text-xs">
                    {technicalStatus?.hasAteco ? "ATECO OK" : "ATECO N/D"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Confezioni */}
          <div className="md:col-span-7 space-y-2">
            {product.confezioni.map((conf, idx) => {
              const key = `${product.id}__${conf.confezione}`;
              const qty = qtyState[key] || 1;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{conf.confezione}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Barcode className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-mono">{conf.barcode}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">€ {conf.euroPz.toFixed(2)}</p>
                    {conf.euroLt > 0 && (
                      <p className="text-xs text-muted-foreground">(€{conf.euroLt.toFixed(2)}/{product.um})</p>
                    )}
                    <p className="text-xs text-muted-foreground">Pz/Conf: {conf.pzConf}</p>
                  </div>

                  {isOrderMode ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 border border-border rounded-xl bg-card overflow-hidden">
                        <button
                          onClick={() => onQtyChange(key, Math.max(1, qty - 1))}
                          className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          value={qty}
                          min={1}
                          onChange={(e) => onQtyChange(key, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 text-center text-sm bg-transparent outline-none"
                        />
                        <button
                          onClick={() => onQtyChange(key, qty + 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => onAddToCart(conf, qty)}
                        className="h-8 px-3 rounded-xl bg-gradient-to-r from-primary to-accent-purple text-white text-xs flex items-center gap-1 hover:opacity-90 transition-opacity shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Aggiungi
                      </button>
                    </div>
                  ) : (
                    <Button size="sm" className="shrink-0 ml-2" variant="outline">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Aggiungi
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

/**
 * CatalogoKemipol: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function CatalogoKemipol() {
  const navigate = useNavigate();

  const [isOrderMode, setIsOrderMode] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogSource, setCatalogSource] = useState<"backend" | "fallback">("fallback");
  const [catalogState, setCatalogState] = useState<RemoteState>("idle");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [customersState, setCustomersState] = useState<RemoteState>("idle");
  const [qtyState, setQtyState] = useState<QtyState>({});
  const [sdsCodes, setSdsCodes] = useState<Set<string>>(new Set());
  const [hasAtecoCatalog, setHasAtecoCatalog] = useState(false);
  const [cartOpen, setCartOpen] = useState(isOrderMode);
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.subtotale, 0),
    [cartItems]
  );
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

  const addToCart = (
    productId: string,
    pkg: ProductPackage & { linea: string; codice: string; nome: string },
    qty: number
  ) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.productId === productId && item.confezione === pkg.confezione
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === productId && item.confezione === pkg.confezione
            ? { ...item, qty: item.qty + qty, subtotale: (item.qty + qty) * item.euroPz }
            : item
        );
      }
      return [
        ...prev,
        {
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
        },
      ];
    });
  };

  /**
   * removeFromCart: descrive il comportamento principale di questa funzione.
   * @param productId Input richiesto dalla funzione.
   * @param confezione Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const removeFromCart = (productId: string, confezione: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.productId === productId && item.confezione === confezione))
    );
  };

  /**
   * updateQty: descrive il comportamento principale di questa funzione.
   * @param productId Input richiesto dalla funzione.
   * @param confezione Input richiesto dalla funzione.
   * @param qty Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const updateQty = (productId: string, confezione: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, confezione);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.confezione === confezione
          ? { ...item, qty, subtotale: qty * item.euroPz }
          : item
      )
    );
  };

  /**
   * clearCart: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const clearCart = () => setCartItems([]);

  const availableLines = useMemo(() => {
    const unique = Array.from(new Set(catalogProducts.map((product) => product.linea))).sort();
    return unique.map((line) => ({
      id: line,
      nome: line,
      descrizione: getLineDescription(line),
      count: catalogProducts.filter((product) => product.linea === line).length,
    }));
  }, [catalogProducts]);

  // Apri carrello automaticamente in modalità ordine
  useEffect(() => {
    if (isOrderMode) setCartOpen(true);
  }, [isOrderMode]);

  /**
   * fetchCatalogProducts: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchCatalogProducts = async () => {
    setCatalogState("loading");
    try {
      const limit = 200;
      let offset = 0;
      const collected: Product[] = [];

      for (let page = 0; page < 20; page += 1) {
        const response = await getTechnicalProducts({ limit, offset, listinoOnly: true });
        collected.push(...response.data.map(mapTechnicalProductToCatalogProduct));
        if (response.data.length < limit || offset + limit >= response.meta.total) {
          break;
        }
        offset += limit;
      }

      setCatalogProducts(collected);
      setCatalogSource("backend");
      setCatalogState("ready");
    } catch (error) {
      setCatalogProducts([]);
      setCatalogSource("fallback");
      const status = getApiStatusFromError(error);
      setCatalogState(status === 403 ? "forbidden" : "error");
    }
  };

  /**
   * fetchCustomersList: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const fetchCustomersList = async () => {
    setCustomersState("loading");
    try {
      const limit = 100;
      let offset = 0;
      const all: CustomerListItem[] = [];

      for (let page = 0; page < 20; page += 1) {
        const response = await getCustomers({ limit, offset });
        all.push(...response.data);
        if (response.data.length < limit || offset + limit >= response.meta.total) {
          break;
        }
        offset += limit;
      }

      setCustomers(all);
      setCustomersState("ready");
    } catch (error) {
      setCustomers([]);
      const status = getApiStatusFromError(error);
      setCustomersState(status === 403 ? "forbidden" : "error");
    }
  };

  useEffect(() => {
    let cancelled = false;
    const hasToken =
      typeof window !== "undefined" && Boolean(window.localStorage.getItem("hideddy_access_token"));

    if (hasToken) {
      void fetchCatalogProducts();
      if (isOrderMode) {
        void fetchCustomersList();
      } else {
        setCustomers([]);
        setCustomersState("idle");
      }
    } else {
      setCatalogProducts([]);
      setCatalogSource("fallback");
      setCatalogState("idle");
      setCustomers([]);
      setCustomersState("idle");
    }

    /**
     * onAuthReady: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const onAuthReady = () => {
      if (cancelled) return;
      void fetchCatalogProducts();
      if (isOrderMode) {
        void fetchCustomersList();
      }
    };

    window.addEventListener("authSessionReady", onAuthReady);
    return () => {
      cancelled = true;
      window.removeEventListener("authSessionReady", onAuthReady);
    };
  }, [isOrderMode]);

  useEffect(() => {
    let cancelled = false;

    /**
     * loadTechnicalFlags: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const loadTechnicalFlags = async () => {
      const sdsAccumulator = new Set<string>();
      let atecoAvailable = false;
      const limit = 200;
      let offset = 0;

      for (let page = 0; page < 20; page += 1) {
        const result = await getTechnicalSdsAteco({ limit, offset });
        for (const ref of result.data.sdsRefs) {
          const code = ref.productCode?.trim().toUpperCase();
          if (code) {
            sdsAccumulator.add(code);
          }
        }
        if (result.data.atecoCodes.length > 0) {
          atecoAvailable = true;
        }

        if (result.data.sdsRefs.length < limit) {
          break;
        }
        offset += limit;
      }

      if (!cancelled) {
        setSdsCodes(sdsAccumulator);
        setHasAtecoCatalog(atecoAvailable);
      }
    };

    loadTechnicalFlags().catch(() => {
      if (!cancelled) {
        setSdsCodes(new Set());
        setHasAtecoCatalog(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = catalogProducts.filter((product) => {
    const matchesLine = selectedLine === "all" || product.linea === selectedLine;
    const matchesSearch =
      searchTerm === "" ||
      product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codice.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLine && matchesSearch;
  });

  /**
   * handleQtyChange: descrive il comportamento principale di questa funzione.
   * @param key Input richiesto dalla funzione.
   * @param val Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleQtyChange = (key: string, val: number) => {
    setQtyState((prev) => ({ ...prev, [key]: val }));
  };

  /**
   * handleAddToCart: descrive il comportamento principale di questa funzione.
   * @param product Input richiesto dalla funzione.
   * @param pkg Input richiesto dalla funzione.
   * @param qty Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleAddToCart = (product: Product, pkg: ProductPackage, qty: number) => {
    addToCart(
      product.id,
      {
        ...pkg,
        linea: product.linea,
        codice: product.codice,
        nome: product.nome,
      },
      qty
    );
    notify.success("Prodotto aggiunto", `${product.nome} (${pkg.confezione} × ${qty}) aggiunto al carrello! 🛒`, {
      duration: 2000,
    });
  };

  const handleSubmitOrder = async (
    cliente: string,
    clienteId: string,
    note: string,
    priorita: OrdinePriorita,
    shippingService: "SILVER" | "GOLD",
    shippingCost: number
  ) => {
    const items = cartItems.map((item) => ({
      productCode: item.codice,
      description: `${item.nome} (${item.confezione})`,
      quantity: item.qty,
      unitPrice: item.euroPz,
    }));

    const created = await createOrder({
      customerId: clienteId,
      priority: priorita,
      notes: note,
      shippingService,
      shippingCost,
      items,
    });

    clearCart();
    setIsOrderMode(false);
    setCartOpen(false);

    notify.success(
      "Ordine creato su backend",
      `Documento ${created.externalDocId} inviato per ${cliente}.`,
      { duration: 4000 }
    );
    navigate(`/ordini/${created.id}`);
  };

  /**
   * handleExitOrderMode: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const handleExitOrderMode = () => {
    setIsOrderMode(false);
    clearCart();
    setCartOpen(false);
    navigate("/ordini");
  };

  return (
    <div className="flex gap-0 relative">
      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div className={cn("flex-1 min-w-0 space-y-6 transition-all duration-300", cartOpen && isOrderMode ? "mr-[380px]" : "")}>

        {/* BANNER MODALITÀ ORDINE */}
        {isOrderMode && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent-purple/10 border border-primary/20">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center shrink-0">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">🛒 Stai compilando un nuovo ordine</p>
              <p className="text-sm text-muted-foreground">Aggiungi i prodotti e poi clicca "Procedi" nel carrello per inviare la richiesta.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {cartCount > 0 && (
                <button
                  onClick={() => setCartOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Carrello ({cartCount})
                </button>
              )}
              <button
                onClick={handleExitOrderMode}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Catalogo Kemipol 2026</h1>
            <p className="text-muted-foreground mt-1">
              Listino completo diluenti, solventi e prodotti chimici professionali
            </p>
            <div className="mt-2">
              <Badge variant={catalogSource === "backend" ? "default" : "secondary"}>
                {catalogSource === "backend" ? "Dati backend tecnico" : "Backend non disponibile"}
              </Badge>
            </div>
          </div>
          {!isOrderMode && (
            <div className="flex gap-2">
              <Button size="lg" variant="outline" className="shadow-lg">
                <Download className="mr-2 h-5 w-5" />
                Esporta PDF
              </Button>
              <Button
                size="lg"
                className="shadow-lg shadow-primary/20"
                onClick={() => {
                  setIsOrderMode(true);
                  setCartOpen(true);
                  void fetchCustomersList();
                }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Nuovo Ordine
              </Button>
            </div>
          )}
        </div>

        <RemoteDataState
          state={catalogState}
          empty={catalogState === "ready" && catalogProducts.length === 0}
          loadingMessage="Carico il catalogo prodotti dal backend tecnico..."
          emptyMessage="Nessun prodotto tecnico disponibile dal backend."
          errorMessage="Errore nel caricamento del catalogo tecnico."
          forbiddenMessage="Il tuo ruolo non puo consultare il catalogo tecnico."
          onRetry={() => {
            void fetchCatalogProducts();
          }}
        />

        {/* Info Spedizioni */}
        <Card className="border-l-4 border-l-primary bg-card/50">
          <CardContent className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Importo Minimo Ordine</p>
                <p className="text-2xl font-semibold text-primary">€ {shippingInfo.importoMinimo.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sotto minimo: +€{shippingInfo.contributoTrasportoSottoMinimo} trasporto
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Condizioni Spedizione</p>
                <p className="text-lg font-semibold">Franco Destino</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sponda: €{shippingInfo.costoSponda} • Transpallet: €{shippingInfo.costoTranspallet}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prodotti Catalogati</p>
                <p className="text-2xl font-semibold">{catalogProducts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">5 linee di prodotto disponibili</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtri Catalogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Linea Prodotto</label>
                <Select value={selectedLine} onValueChange={setSelectedLine}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le Linee</SelectItem>
                    {availableLines.map((line) => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.descrizione}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cerca Prodotto</label>
                <Input
                  type="text"
                  placeholder="Codice o nome prodotto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-input-background"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setSelectedLine("all"); setSearchTerm(""); }}
                >
                  Resetta Filtri
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linee */}
        <div className="grid gap-4 md:grid-cols-5">
          {availableLines.map((line) => {
            return (
              <Card
                key={line.id}
                className="hover:border-primary cursor-pointer transition-all"
                onClick={() => setSelectedLine(line.id)}
              >
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold mb-1">{line.nome}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{line.descrizione}</p>
                  <Badge variant="outline">{line.count} prodotti</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Elenco Prodotti */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {selectedLine === "all" ? "Tutti i Prodotti" : `Linea ${selectedLine}`}
              <span className="text-muted-foreground ml-2">({filteredProducts.length})</span>
            </h2>
            {isOrderMode && cartCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span>{cartCount} prodotti nel carrello · <span className="font-semibold text-primary">€ {cartTotal.toFixed(2)}</span></span>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                technicalStatus={{
                  hasSds: sdsCodes.has(product.codice.trim().toUpperCase()),
                  hasAteco: hasAtecoCatalog,
                }}
                isOrderMode={isOrderMode}
                qtyState={qtyState}
                onQtyChange={handleQtyChange}
                onAddToCart={(pkg, qty) => handleAddToCart(product, pkg, qty)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun prodotto trovato</h3>
                <p className="text-muted-foreground">Prova a modificare i filtri di ricerca</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── CART PANEL (fisso a destra) ───────────────────────────────────── */}
        {isOrderMode && cartOpen && (
          <div className="fixed right-0 top-16 bottom-0 w-[380px] bg-card border-l border-border shadow-2xl shadow-black/10 z-30 flex flex-col">
            <CartPanelController
              onClose={() => setCartOpen(false)}
              onSubmit={handleSubmitOrder}
              customers={customers}
              customersState={customersState}
              cartItems={cartItems}
              removeFromCart={removeFromCart}
              updateQty={updateQty}
              cartTotal={cartTotal}
              cartCount={cartCount}
            />
          </div>
        )}

      {/* ── FAB CART BUTTON (quando chiuso) ──────────────────────────────── */}
      {isOrderMode && !cartOpen && cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-8 right-8 z-30 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent-purple text-white shadow-2xl shadow-primary/40 hover:opacity-90 transition-opacity"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">Carrello</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-sm">{cartCount}</span>
        </button>
      )}
    </div>
  );
}

// ─── CART PANEL CONTROLLER (gestisce submit) ──────────────────────────────────

/**
 * CartPanelController: descrive il comportamento principale di questa funzione.


 * @param none Questa funzione non richiede parametri espliciti.


 * @returns Valore restituito dalla funzione secondo il contratto corrente.


 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).


 * @remarks Include eventuali edge case gi? gestiti dall'implementazione corrente.


 */


function CartPanelController({
  onClose,
  onSubmit,
  customers,
  customersState,
  cartItems,
  removeFromCart,
  updateQty,
  cartTotal,
  cartCount,
}: {
  onClose: () => void;
  onSubmit: (
    cliente: string,
    clienteId: string,
    note: string,
    priorita: OrdinePriorita,
    shippingService: "SILVER" | "GOLD",
    shippingCost: number
  ) => Promise<void> | void;
  customers: CustomerListItem[];
  customersState: RemoteState;
  cartItems: CartItem[];
  removeFromCart: (productId: string, confezione: string) => void;
  updateQty: (productId: string, confezione: string, qty: number) => void;
  cartTotal: number;
  cartCount: number;
}) {
  const [cliente, setCliente] = useState("");
  const [priorita, setPriorita] = useState<OrdinePriorita>("normale");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"cart" | "confirm">("cart");
  const [shippingService, setShippingService] = useState<"SILVER" | "GOLD">("SILVER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceed = cartItems.length > 0 && cliente;
  const selectedCliente = customers.find((c) => c.id === cliente);

  // --- CALCOLO SPEDIZIONE ---
  const mockWeight = cartItems.reduce((acc, item) => acc + (item.qty * 15), 0); // stima 15kg/collo
  let baseShipping = 0;
  let timeShipping = "";
  
  if (selectedCliente) {
    if (shippingService === "SILVER") {
      baseShipping = 43.5 + (mockWeight * 0.15);
      timeShipping = "48h / 72h";
    } else {
      baseShipping = 55.5 + (mockWeight * 0.15);
      timeShipping = "24h";
    }
  }
  const shippingCost = selectedCliente && cartItems.length > 0 ? baseShipping : 0;
  const sottoMinimoCost = (cartTotal > 0 && cartTotal < shippingInfo.importoMinimo) ? shippingInfo.contributoTrasportoSottoMinimo : 0;
  
  const grandTotal = cartTotal + shippingCost + sottoMinimoCost;
  // -------------------------

  if (step === "confirm") {
    return (
      <div className="flex flex-col h-full">
        <div className="p-5 border-b border-border">
          <button
            onClick={() => setStep("cart")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Modifica ordine
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-center py-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-purple/10 flex items-center justify-center mx-auto mb-3">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-foreground mb-1">Riepilogo Ordine</h3>
            <p className="text-sm text-muted-foreground">Controlla e conferma la richiesta</p>
          </div>

          <div className="space-y-3 bg-muted/30 rounded-2xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente</span>
              <span className="text-foreground font-medium text-right ml-4 truncate">{selectedCliente?.ragioneSociale}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prodotti</span>
              <span className="text-foreground">{cartItems.length} art. ({cartCount} colli, ~{mockWeight}kg)</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">Spedizione</span>
              <div className="text-right">
                <span className="text-foreground">One Express {shippingService} ({timeShipping})</span>
                <div className="text-xs text-muted-foreground">€ {shippingCost.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Priorità</span>
              <span className={cn("font-medium", priorita === "urgente" ? "text-destructive" : priorita === "alta" ? "text-warning" : "text-muted-foreground")}>
                {priorita === "urgente" ? "🔴 Urgente" : priorita === "alta" ? "🟠 Alta" : "⚪ Normale"}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="text-muted-foreground">Totale Prodotti</span>
              <span className="font-medium text-foreground">€ {cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Totale Spedizione</span>
              <span className="font-medium text-foreground">€ {shippingCost.toFixed(2)}</span>
            </div>
            {sottoMinimoCost > 0 && (
              <div className="flex justify-between text-warning text-sm">
                <span>Contr. sotto minimo</span>
                <span className="font-medium">€ {sottoMinimoCost.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="text-muted-foreground">Totale Ordine</span>
              <span className="font-bold text-2xl text-primary">€ {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Prodotti ordinati:</p>
            {cartItems.map((item) => {
              const mockGiacenza = (item.productId.charCodeAt(item.productId.length - 1) % 4) + 1;
              const giacenza = item.qty >= mockGiacenza ? mockGiacenza : item.qty;
              const daProdurre = item.qty - giacenza;
              const prodTime = daProdurre > 0 ? (daProdurre * 2) + 1 : 0;
              
              return (
              <div key={`${item.productId}__${item.confezione}`} className="flex flex-col text-xs py-2 border-b border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-foreground truncate flex-1 font-medium">{item.nome} {item.confezione}</span>
                  <span className="text-muted-foreground ml-2">×{item.qty}</span>
                  <span className="text-primary ml-2 font-bold">€{item.subtotale.toFixed(2)}</span>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-success flex items-center gap-1"><Package className="h-3 w-3" /> {giacenza} pz. in giacenza</span>
                  {daProdurre > 0 && (
                    <span className="text-warning flex items-center gap-1"><Factory className="h-3 w-3" /> {daProdurre} pz. da produrre (~{prodTime}gg)</span>
                  )}
                </div>
              </div>
            )})}
          </div>

          {note && (
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Note</p>
              <p className="text-sm text-foreground">{note}</p>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-border space-y-2">
          <button
            onClick={async () => {
              if (isSubmitting) return;
              setIsSubmitting(true);
              try {
                await onSubmit(
                  selectedCliente?.ragioneSociale || "",
                  cliente,
                  note,
                  priorita,
                  shippingService,
                  shippingCost
                );
              } catch (error) {
                const status = getApiStatusFromError(error);
                if (status === 403) {
                  notify.error("Permessi insufficienti", "Il tuo utente non può creare ordini.");
                } else if (status === 400) {
                  notify.error("Dati ordine non validi", "Controlla cliente e righe ordine.");
                } else {
                  notify.error("Errore invio ordine", "Non sono riuscito a salvare l'ordine sul backend.");
                }
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent-purple text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <Send className="h-5 w-5" />
            {isSubmitting ? "Invio in corso..." : "Invia Richiesta di Approvazione"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Il capo agente riceverà la notifica immediata
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Carrello Ordine
            {cartCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">{cartCount}</span>
            )}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Cliente + Priorità */}
      <div className="p-4 border-b border-border space-y-3 bg-muted/10">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Cliente *</label>
          <Select value={cliente} onValueChange={setCliente}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Seleziona cliente..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.ragioneSociale}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {customersState === "loading" && (
            <p className="mt-2 text-[11px] text-muted-foreground">Caricamento clienti backend...</p>
          )}
          {customersState !== "loading" && customers.length === 0 && (
            <p className="mt-2 text-[11px] text-warning">
              Nessun cliente disponibile dal backend.
            </p>
          )}
        </div>

        {cliente && (
          <div className="pt-2 border-t border-border/50">
            <label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <Truck className="h-3 w-3" /> Metodo e Tempi di Spedizione
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div 
                className={cn(
                  "border rounded-xl p-3 cursor-pointer transition-all",
                  shippingService === "SILVER" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"
                )}
                onClick={() => setShippingService("SILVER")}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold">ONE SILVER</span>
                  {shippingService === "SILVER" && <CheckCircle2 className="h-3 w-3 text-primary" />}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3" /> 48h / 72h
                </div>
              </div>
              <div 
                className={cn(
                  "border rounded-xl p-3 cursor-pointer transition-all",
                  shippingService === "GOLD" ? "border-accent-purple bg-accent-purple/5 ring-1 ring-accent-purple" : "border-border hover:border-accent-purple/50"
                )}
                onClick={() => setShippingService("GOLD")}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-accent-purple">ONE GOLD</span>
                  {shippingService === "GOLD" && <CheckCircle2 className="h-3 w-3 text-accent-purple" />}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3" /> 24h
                </div>
              </div>
            </div>
            {cartItems.length > 0 && (
               <div className="mt-2 text-xs text-muted-foreground flex justify-between px-1">
                 <span>Costo stimato (~{mockWeight}kg)</span>
                 <span className="font-medium text-foreground">€ {shippingCost.toFixed(2)}</span>
               </div>
            )}
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Priorità Ordine</label>
          <Select value={priorita} onValueChange={(v) => setPriorita(v as OrdinePriorita)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normale">⚪ Normale</SelectItem>
              <SelectItem value="alta">🟠 Alta</SelectItem>
              <SelectItem value="urgente">🔴 Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 p-6 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/20" />
            <div>
              <p className="text-sm text-muted-foreground">Il carrello è vuoto.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Usa "+ Aggiungi" sui prodotti del catalogo</p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {cartItems.map((item) => {
              // calcolo per simulare giacenza (deterministico)
              const mockGiacenza = (item.productId.charCodeAt(item.productId.length - 1) % 4) + 1; // produce un numero da 1 a 4
              const giacenza = item.qty >= mockGiacenza ? mockGiacenza : item.qty;
              const daProdurre = item.qty - giacenza;
              const prodTime = daProdurre > 0 ? (daProdurre * 2) + 1 : 0;
              
              return (
              <div key={`${item.productId}__${item.confezione}`} className="p-3 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-tight">{item.nome}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.confezione} · <span className="font-mono">{item.codice}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId, item.confezione)}
                    className="p-1 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                {/* Giacenza / Da Produrre Info */}
                <div className="mb-3 space-y-1.5 bg-background/50 rounded-lg p-2.5 border border-border/40 shadow-sm">
                  <div className="flex items-center justify-between text-[11px]">
                     <div className="flex items-center gap-1.5 text-success font-medium">
                       <Package className="h-3.5 w-3.5" />
                       <span>Giacenza pronta:</span>
                     </div>
                     <span className="font-bold text-success">{giacenza} pz.</span>
                  </div>
                  
                  {daProdurre > 0 && (
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/40">
                       <div className="flex items-center gap-1 text-warning font-medium">
                         <Factory className="h-3.5 w-3.5" />
                         <span>Da produrre:</span>
                         <TooltipProvider>
                           <Tooltip delayDuration={200}>
                             <TooltipTrigger asChild>
                               <button type="button" className="ml-0.5 hover:bg-warning/20 text-warning rounded-full p-[2px] transition-colors cursor-help">
                                 <Info className="h-3.5 w-3.5" />
                               </button>
                             </TooltipTrigger>
                             <TooltipContent side="top" className="max-w-[260px] p-3 text-[11px] leading-relaxed shadow-xl border border-border/50">
                               <p>I tempi di produzione partono dal momento dell'accettazione del <strong className="text-primary">super Admin</strong>.</p>
                               <div className="h-[1px] bg-border/50 my-2" />
                               <p className="text-muted-foreground">La stima mostrata si basa sui collegamenti interni. <strong>Verrai sempre ricontattato</strong> per darti una data certa una volta che il tuo ordine verrà accettato.</p>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="text-muted-foreground/80 font-mono">~{prodTime}gg</span>
                         <span className="font-bold text-warning">{daProdurre} pz.</span>
                       </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card">
                    <button
                      onClick={() => updateQty(item.productId, item.confezione, item.qty - 1)}
                      className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.confezione, item.qty + 1)}
                      className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">€{item.euroPz.toFixed(2)} × {item.qty}</p>
                    <p className="font-bold text-primary text-sm">€ {item.subtotale.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="px-4 pb-2">
        <label className="text-xs text-muted-foreground mb-1.5 block">Note (opzionale)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Istruzioni, consegna, urgenze..."
          className="w-full h-14 px-3 py-2 bg-input-background border border-input-border rounded-xl text-xs outline-none resize-none placeholder:text-muted-foreground focus:border-input-border-focus transition-colors"
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {sottoMinimoCost > 0 && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
            <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
            <p className="text-[10px] text-warning leading-tight">
              Sotto minimo (€{shippingInfo.importoMinimo}). Verrà aggiunto contributo €{sottoMinimoCost}.
            </p>
          </div>
        )}
        <div className="space-y-1 mb-2">
           <div className="flex justify-between items-center text-xs text-muted-foreground">
             <span>Totale prodotti</span>
             <span>€ {cartTotal.toFixed(2)}</span>
           </div>
           {cliente && (
             <div className="flex justify-between items-center text-xs text-muted-foreground">
               <span>Spedizione ({shippingService})</span>
               <span>€ {shippingCost.toFixed(2)}</span>
             </div>
           )}
           <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/50">
             <span className="text-sm font-semibold text-foreground">Totale stimato</span>
             <span className="text-xl font-bold text-primary">€ {grandTotal.toFixed(2)}</span>
           </div>
        </div>
        
        <button
          onClick={() => {
            if (!canProceed) {
              notify.error("Errore validazione", !cliente ? "Seleziona prima un cliente" : "Aggiungi almeno un prodotto");
              return;
            }
            setStep("confirm");
          }}
          disabled={!canProceed}
          className={cn(
            "w-full py-3 rounded-2xl text-sm font-medium transition-all",
            canProceed
              ? "bg-gradient-to-r from-primary to-accent-purple text-white hover:opacity-90 shadow-lg shadow-primary/20"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {!cliente ? "Seleziona un cliente →" : cartItems.length === 0 ? "Aggiungi prodotti →" : "Procedi al riepilogo →"}
        </button>
      </div>
    </div>
  );
}


