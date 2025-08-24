
'use client';

import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full w-64 flex-shrink-0 border-r bg-sidebar flex flex-col transition-transform duration-300 ease-in-out z-40",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
       <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
         <Logo />
       </div>
       <nav className="flex-1 p-4 space-y-2">
        {NAV_LINKS.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={pathname === item.href ? "sidebar-primary" : "ghost"}
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-bold",
              pathname === item.href && "bg-sidebar-primary text-sidebar-primary-foreground"
            )}
          >
            <a href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </a>
          </Button>
        ))}
      </nav>
    </aside>
  );
}
