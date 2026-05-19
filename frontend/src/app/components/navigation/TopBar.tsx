import { Search, User, LogOut, Moon, Sun, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { useLocation, useNavigate } from "react-router";
import { useUser } from "../../contexts/UserContext";

interface TopBarProps { onMenuClick?: () => void; }

export function TopBar({ onMenuClick }: TopBarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  const crumbs = [{ label: "Home", href: "/community" }, ...location.pathname.split("/").filter(Boolean).map((p, i, a) => ({ label: p.charAt(0).toUpperCase() + p.slice(1), href: "/" + a.slice(0, i + 1).join("/") }))];

  const handleLogout = async () => { await logout(); navigate("/login", { replace: true }); };

  return (
    <header className="flex h-20 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}><Menu className="h-5 w-5" /></Button>
      <div className="hidden md:flex items-center gap-4 flex-1">
        <Breadcrumb><BreadcrumbList>{crumbs.map((c, i) => <div key={c.href} className="flex items-center">{i > 0 && <BreadcrumbSeparator />}<BreadcrumbItem>{i === crumbs.length - 1 ? <BreadcrumbPage>{c.label}</BreadcrumbPage> : <BreadcrumbLink href={c.href}>{c.label}</BreadcrumbLink>}</BreadcrumbItem></div>)}</BreadcrumbList></Breadcrumb>
      </div>
      <div className="relative hidden lg:block w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="search" placeholder="Cerca..." className="pl-10" /></div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={toggleTheme}>{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</Button>
        <div className="text-sm hidden sm:block">{user?.name ?? "Utente"}</div>
        <Button variant="ghost" onClick={() => void handleLogout()}><LogOut className="h-4 w-4" /></Button>
        <Button variant="ghost"><User className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}
