
"use client";

import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2">
      {NAV_LINKS.map((item) => (
        <Button
          key={item.href}
          asChild
          variant={pathname === item.href ? "default" : "ghost"}
          className="h-9 px-4"
        >
          <a href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </a>
        </Button>
      ))}
    </nav>
  );
}
