import { Link, useLocation } from "wouter";
import { LayoutDashboard, History, Terminal, AlertTriangle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Painel", icon: LayoutDashboard },
    { href: "/dtc", label: "Códigos", icon: AlertTriangle },
    { href: "/terminal", label: "Terminal", icon: Terminal },
    { href: "/history", label: "Histórico", icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:w-20 md:h-screen z-50 bg-card border-t md:border-t-0 md:border-r border-border/50 flex md:flex-col items-center justify-around md:justify-start md:py-8 shadow-2xl md:shadow-none backdrop-blur-lg">
      <div className="hidden md:block mb-8 p-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary text-primary shadow-[0_0_10px_var(--primary)] animate-pulse">
          OBD
        </div>
      </div>

      {links.map(({ href, label, icon: Icon }) => {
        const isActive = location === href;
        return (
          <Link key={href} href={href} className={cn(
            "flex flex-col items-center justify-center p-3 md:p-4 md:w-full md:mb-4 transition-all duration-200 group relative",
            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}>
            {/* Active Indicator Line */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2px] md:h-full md:w-[3px] md:left-0 md:top-0 md:bottom-0 bg-primary shadow-[0_0_10px_var(--primary)]" />
            )}
            
            <Icon className={cn(
              "w-6 h-6 mb-1 md:w-7 md:h-7 transition-transform duration-300",
              isActive && "scale-110 drop-shadow-[0_0_5px_var(--primary)]"
            )} />
            <span className="text-[10px] md:text-xs uppercase tracking-wider font-bold opacity-80 group-hover:opacity-100">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
