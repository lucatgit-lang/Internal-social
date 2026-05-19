/**
 * File Overview: MainLayout.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { AppSidebar } from "../navigation/AppSidebar";
import { TopBar } from "../navigation/TopBar";
import { cn } from "../ui/utils";
import { Toaster } from "../ui/sonner";

/**
 * MainLayout: descrive il comportamento principale di questa funzione.
 * @param none Questa funzione non richiede parametri espliciti.
 * @returns Valore restituito dalla funzione secondo il contratto corrente.
 * @sideeffects Pu? produrre effetti collaterali previsti dal flusso esistente (I/O, stato, log o rete).
 * @remarks Gestire i casi limite gi? previsti dall'implementazione corrente.
 */
export function MainLayout() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isSocialRoute =
    location.pathname.startsWith("/community") ||
    location.pathname.startsWith("/chat") ||
    location.pathname.startsWith("/profile");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      {!isSocialRoute && (
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => {
            setSidebarCollapsed(!sidebarCollapsed);
            setMobileSidebarOpen(!mobileSidebarOpen);
          }}
          mobileOpen={mobileSidebarOpen}
        />
      )}
      
      {/* Main Content */}
      <div 
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300",
          isSocialRoute ? "ml-0" : "lg:ml-72",
          sidebarCollapsed && "lg:ml-20"
        )}
      >
        {!isSocialRoute && <TopBar onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />}
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn(isSocialRoute ? "w-full p-0" : "container mx-auto max-w-full p-4 md:p-6 lg:p-8")}>
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
