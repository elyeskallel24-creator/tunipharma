import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu, X, Pill, Leaf, Droplets, Baby, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import logo from "@/assets/logo.png";
import { useCart } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { SearchModal } from "./SearchModal";
import { CartDrawer } from "./CartDrawer";

type NavItem = { to: "/" | "/catalogue" | "/a-propos" | "/contact"; label: string; mega?: boolean };
const NAV: readonly NavItem[] = [
  { to: "/", label: "Accueil" },
  { to: "/catalogue", label: "Catalogue", mega: true },
  { to: "/a-propos", label: "À propos" },
  { to: "/contact", label: "Contact" },
];

const CAT_ICONS = [Pill, Leaf, Droplets, Baby, Sparkles];

export function Header() {
  const count = useCart((s) => s.count());
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [bumpKey, setBumpKey] = useState(0);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // bump cart badge when count grows
  useEffect(() => { if (count > 0) setBumpKey((k) => k + 1); }, [count]);

  // close mobile menu on route change
  useEffect(() => { setOpen(false); setMegaOpen(false); }, [path]);

  const { data: megaCats } = useQuery({
    queryKey: ["mega-categories"],
    enabled: megaOpen,
    queryFn: async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, slug, name")
        .eq("is_active", true)
        .order("position")
        .limit(8);
      const ids = (cats ?? []).map((c) => c.id);
      const { data: types } = ids.length
        ? await supabase
            .from("product_types")
            .select("id, slug, name, category_id")
            .in("category_id", ids)
            .eq("is_active", true)
            .order("position")
        : { data: [] };
      return (cats ?? []).map((c) => ({
        ...c,
        types: (types ?? []).filter((t) => t.category_id === c.id).slice(0, 4),
      }));
    },
  });

  return (
    <>
      <header
        className="fixed left-1/2 z-50 -translate-x-1/2"
        style={{
          top: scrolled ? 8 : 12,
          width: "calc(100% - 24px)",
          maxWidth: 1400,
          transition: "top 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div
          className="glass-4 flex h-16 items-center justify-between px-4 md:px-6"
          style={{
            borderRadius: 22,
            transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
            background: scrolled ? "rgba(255,255,255,0.78)" : undefined,
          }}
        >
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="TuniPharma" className="h-10 w-10" />
            <span className="font-display text-lg font-bold tracking-tight hidden sm:block">
              <span className="text-foreground">Tuni</span>
              <span className="gradient-text">Pharma</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 relative">
            {NAV.map((n) => (
              <div key={n.to} onMouseEnter={() => n.mega && setMegaOpen(true)} onMouseLeave={() => n.mega && setMegaOpen(false)}>
                <Link
                  to={n.to}
                  className="relative px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  activeProps={{ className: "px-4 py-2 rounded-xl text-sm font-semibold text-primary bg-primary/12" }}
                >
                  {n.label}
                </Link>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="h-10 w-10 inline-flex items-center justify-center rounded-full glass-1 hover:bg-primary/10 transition"
              aria-label="Rechercher"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative h-10 w-10 inline-flex items-center justify-center rounded-full bg-primary/12 hover:bg-primary/18 transition"
              aria-label="Panier"
            >
              <ShoppingBag className="h-4.5 w-4.5 text-primary" />
              {count > 0 && (
                <span
                  key={bumpKey}
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center animate-bounce-in shadow-md"
                >
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setOpen((o) => !o)}
              className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-full glass-1"
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mega menu */}
        {megaOpen && megaCats && megaCats.length > 0 && (
          <div
            className="hidden md:block absolute left-1/2 top-full mt-3 -translate-x-1/2 w-[min(900px,calc(100vw-40px))]"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
            style={{ animation: "floatIn 0.3s cubic-bezier(0.23, 1, 0.32, 1)" }}
          >
            <div className="glass-3 rounded-3xl p-7">
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Catalogue</div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {megaCats.map((c, i) => {
                  const Icon = CAT_ICONS[i % CAT_ICONS.length];
                  return (
                    <div key={c.id}>
                      <Link
                        to="/categorie/$slug"
                        params={{ slug: c.slug }}
                        className="flex items-center gap-2.5 mb-2 group"
                      >
                        <span className="h-9 w-9 rounded-xl bg-primary/10 inline-flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="font-display font-semibold text-sm group-hover:text-primary transition">{c.name}</span>
                      </Link>
                      <ul className="space-y-1 pl-11">
                        {c.types.map((t) => (
                          <li key={t.id}>
                            <Link
                              to="/categorie/$slug"
                              params={{ slug: c.slug }}
                              search={{ type: t.slug }}
                              className="text-xs text-muted-foreground hover:text-primary transition"
                            >
                              {t.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* spacer so content is not under floating navbar */}
      <div aria-hidden className="h-20" />

      {/* Mobile fullscreen menu */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 flex flex-col"
          style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(40px) saturate(2)",
            WebkitBackdropFilter: "blur(40px) saturate(2)",
            animation: "floatIn 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <div className="h-20" />
          <nav className="flex-1 px-6 py-8 flex flex-col gap-1">
            {NAV.map((n, i) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-4 py-4 rounded-2xl font-display text-3xl font-semibold hover:bg-primary/8 hover:text-primary transition"
                activeProps={{ className: "px-4 py-4 rounded-2xl font-display text-3xl font-semibold text-primary bg-primary/10" }}
                style={{ animation: `floatIn 0.4s ${50 * i}ms both` }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
