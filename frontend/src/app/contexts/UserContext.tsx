/**
 * File Overview: UserContext.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getAuthenticatedUser, loginWithPassword, logoutRemoteSession } from "../api/auth";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserContextType {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * UserProvider: descrive il comportamento principale di questa funzione.
 * @param children Input richiesto dalla funzione.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    let active = true;
    /**
     * isTokenLikelyUsable: descrive il comportamento principale di questa funzione.
     * @param token Input richiesto dalla funzione.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const isTokenLikelyUsable = (token: string | null) => {
      if (!token) return false;
      const parts = token.split(".");
      if (parts.length < 2) return false;
      try {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        if (typeof window === "undefined") return false;
        const json = window.atob(base64);
        const payload = JSON.parse(json) as { exp?: number };
        if (typeof payload.exp !== "number") return true;
        const nowSeconds = Math.floor(Date.now() / 1000);
        return payload.exp > nowSeconds + 5;
      } catch {
        return false;
      }
    };

    /**
     * getStoredAccessToken: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const getStoredAccessToken = () => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem("hideddy_access_token");
    };

    /**
     * bootstrapSession: descrive il comportamento principale di questa funzione.
     * @param none Questa funzione non richiede parametri espliciti.
     * @returns Valore restituito dalla funzione secondo il contratto corrente.
     * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
     * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
     */
    const bootstrapSession = async () => {
      const storedAccessToken = getStoredAccessToken();
      if (storedAccessToken && isTokenLikelyUsable(storedAccessToken)) {
        try {
          const me = await getAuthenticatedUser();
          if (!active) return;
          setUser({
            id: me.id,
            name: me.email.split("@")[0] || "Utente",
            email: me.email,
            role: me.roles[0] ?? "viewer"
          });
          setStatus("authenticated");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("authSessionReady"));
          }
          return;
        } catch {
          // Continue with login bootstrap fallback.
        }
      }

      const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
      const isLocalHost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      const hasConfiguredDevCredentials = Boolean(env?.VITE_DEV_LOGIN_EMAIL && env?.VITE_DEV_LOGIN_PASSWORD);
      if (!isLocalHost && !hasConfiguredDevCredentials) return;

      const email = env?.VITE_DEV_LOGIN_EMAIL ?? "admin@hideddy.community";
      const password = env?.VITE_DEV_LOGIN_PASSWORD ?? "ChangeMe123!";

      try {
        const devUser = await loginWithPassword(email, password);
        if (!active) return;
        setUser({
          id: devUser.id,
          name: devUser.email.split("@")[0] || "Utente",
          email: devUser.email,
          role: devUser.roles[0] ?? "viewer"
        });
        setStatus("authenticated");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("authSessionReady"));
        }
      } catch {
        if (!active) return;
        setUser(null);
        setStatus("unauthenticated");
      }
    };

    void bootstrapSession().finally(() => {
      if (!active) return;
      setStatus((prev) => (prev === "authenticated" ? prev : "unauthenticated"));
    });

    return () => {
      active = false;
    };
  }, []);

  /**
   * login: descrive il comportamento principale di questa funzione.
   * @param email Input richiesto dalla funzione.
   * @param password Input richiesto dalla funzione.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const login = async (email: string, password: string) => {
    const sessionUser = await loginWithPassword(email, password);
    setUser({
      id: sessionUser.id,
      name: sessionUser.email.split("@")[0] || "Utente",
      email: sessionUser.email,
      role: sessionUser.roles[0] ?? "viewer"
    });
    setStatus("authenticated");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("authSessionReady"));
    }
  };

  /**
   * logout: descrive il comportamento principale di questa funzione.
   * @param none Questa funzione non richiede parametri espliciti.
   * @returns Valore restituito dalla funzione secondo il contratto corrente.
   * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
   * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
   */
  const logout = async () => {
    await logoutRemoteSession();
    setUser(null);
    setStatus("unauthenticated");
  };

  return (
    <UserContext.Provider value={{ user, status, isAuthenticated: status === "authenticated", login, logout, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * useUser: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

