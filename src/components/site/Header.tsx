import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useCart } from "@/lib/cart-store";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/catalogue", label: "Catalogue" },
  { to: "/a-propos", label: "À propos" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const count = useCart((s) => s.count());
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-strong border-b border-glass-border">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="TuniPharma" className="h-10 w-10" />
            <span className="font-display text-lg font-bold tracking-tight">
              <span className="text-foreground">Tuni</span>
              <span className="gradient-text">Pharma</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                activeProps={{ className: "px-4 py-2 rounded-full text-sm font-medium text-primary bg-primary/10" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/catalogue"
              className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary/60 transition"
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              to="/panier"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/15 transition"
              aria-label="Panier"
            >
              <ShoppingBag className="h-5 w-5 text-primary" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary/60"
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="md:hidden border-t border-glass-border container-page py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-secondary/60"
                activeProps={{ className: "px-4 py-3 rounded-xl text-sm font-medium text-primary bg-primary/10" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
