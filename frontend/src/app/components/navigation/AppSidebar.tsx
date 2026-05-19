import { Link, useLocation } from "react-router";
import { MessageSquare, Heart, Menu, X, Home } from "lucide-react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
}

const navItems = [
  { title: "Community", href: "/community", icon: Heart },
  { title: "Chat Interna", href: "/chat", icon: MessageSquare }
];

export function AppSidebar({ collapsed, onToggle, mobileOpen = false }: AppSidebarProps) {
  const location = useLocation();

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onToggle} />}
      <aside className={cn("fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out","lg:translate-x-0",mobileOpen ? "translate-x-0" : "-translate-x-full",collapsed && "lg:w-20",!collapsed && "w-72")}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          {!collapsed ? (
            <Link to="/community" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-purple"><span className="text-lg font-bold text-primary-foreground">H!</span></div>
              <div><span className="text-lg font-semibold text-sidebar-foreground block leading-tight">HI Deddy</span><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Community</span></div>
            </Link>
          ) : (
            <Link to="/community" className="flex items-center mx-auto"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-purple"><span className="text-lg font-bold text-primary-foreground">H!</span></div></Link>
          )}
          <Button variant="ghost" size="icon" onClick={onToggle} className={cn("hidden lg:flex", collapsed && "mx-auto")}>{collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}</Button>
          <Button variant="ghost" size="icon" onClick={onToggle} className="lg:hidden"><X className="h-5 w-5" /></Button>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-4"><nav className="space-y-1">{navItems.map((item) => (
          <Link key={item.title} to={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200","hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",isActive(item.href)?"bg-sidebar-primary text-sidebar-primary-foreground shadow-sm":"text-sidebar-foreground",collapsed && "justify-center")}>
            <item.icon className={cn("h-5 w-5 shrink-0", collapsed && "h-6 w-6")} />
            {!collapsed && <span className="flex-1 text-sm font-medium">{item.title}</span>}
          </Link>
        ))}</nav></ScrollArea>
      </aside>
    </>
  );
}
