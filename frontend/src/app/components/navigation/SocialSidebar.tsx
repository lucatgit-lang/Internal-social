import { Compass, Heart, Home, Menu, PlusSquare, Search, Send, UserCircle2, Clapperboard } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface SocialSidebarProps {
  active: "community" | "chat" | "profile";
}

export function SocialSidebar({ active }: SocialSidebarProps) {
  const nav = useNavigate();

  const items = [
    { key: "community", label: "Home", icon: Home, onClick: () => nav("/community"), presto: false },
    { key: "reels", label: "Reels", icon: Clapperboard, onClick: () => toast.info("Funzione in arrivo"), presto: true },
    { key: "chat", label: "Messaggi", icon: Send, onClick: () => nav("/chat"), presto: false },
    { key: "search", label: "Cerca", icon: Search, onClick: () => nav("/community"), presto: false },
    { key: "explore", label: "Esplora", icon: Compass, onClick: () => nav("/community"), presto: false },
    { key: "notifications", label: "Notifiche", icon: Heart, onClick: () => nav("/chat"), presto: false },
    { key: "create", label: "Crea", icon: PlusSquare, onClick: () => nav("/community?create=1"), presto: false },
    { key: "profile", label: "Profilo", icon: UserCircle2, onClick: () => nav("/profile"), presto: false }
  ] as const;

  return (
    <aside className="hidden h-screen w-[286px] border-r bg-sidebar px-3 py-3 lg:fixed lg:left-0 lg:top-0 lg:block">
      <div className="mb-8 px-2 text-2xl font-semibold">Hi Deddy</div>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = (active === "community" && item.key === "community") || (active === "chat" && item.key === "chat") || (active === "profile" && item.key === "profile");
          return (
            <button
              key={item.key}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[17px] hover:bg-zinc-100 ${isActive ? "font-semibold" : ""}`}
              onClick={item.onClick}
            >
              <span className="flex items-center gap-3"><item.icon className="h-6 w-6" />{item.label}</span>
              {item.presto ? <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium">Presto</span> : null}
            </button>
          );
        })}
      </nav>
      <button className="mt-10 flex items-center gap-3 rounded-xl px-3 py-2 text-left text-[17px] hover:bg-zinc-100" onClick={() => toast.info("Altre opzioni")}> 
        <Menu className="h-6 w-6" />
        <span>Altro</span>
      </button>
    </aside>
  );
}
