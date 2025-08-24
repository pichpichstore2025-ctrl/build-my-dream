
import {
  LayoutGrid,
  Package,
  Users,
  Store,
  Settings,
  Receipt,
  FileText,
  ShoppingCart,
} from "lucide-react";

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/reports", label: "Reports", icon: FileText },
];

export const SETTINGS_LINK = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};
