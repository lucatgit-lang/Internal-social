/**
 * File Overview: KPICard.tsx
 * Scopo: implementa una porzione del comportamento applicativo in questa codebase.
 * Ruolo: parte del modulo corrente, integrato con router/API/componenti o servizi correlati.
 * Dipendenze rilevanti: import locali e dipendenze esterne gi? dichiarate nel file.
 */

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { cn } from "../ui/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
  className?: string;
}
export function KPICard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-primary",
  description,
  className,
}: KPICardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">{value}</h3>
            
            {change && (
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    change.trend === "up" && "text-success",
                    change.trend === "down" && "text-destructive",
                    change.trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {change.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {description || "vs mese scorso"}
                </span>
              </div>
            )}

            {!change && description && (
              <p className="mt-2 text-xs text-muted-foreground">{description}</p>
            )}
          </div>

          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            "bg-gradient-to-br from-primary/10 to-primary/5",
            iconColor
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
