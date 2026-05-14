import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatTND } from "@/lib/format";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, setQty, remove, subtotal } = useCart();
  const total = subtotal();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998]"
      style={{ background: "rgba(0, 15, 10, 0.28)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-full sm:w-[420px] flex flex-col"
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(60px) saturate(2.2)",
          WebkitBackdropFilter: "blur(60px) saturate(2.2)",
          borderLeft: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "-20px 0 80px rgba(0,200,150,0.10)",
          animation: "slideInRight 0.45s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="flex items-center justify-between px-7 py-6 border-b border-primary/10">
          <h2 className="font-display font-bold text-xl">Mon panier</h2>
          <button
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-secondary/60"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5 nice-scroll space-y-3">
          {items.length === 0 && (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 mx-auto text-primary/40" />
              <p className="mt-3 font-semibold">Votre panier est vide</p>
              <p className="text-sm text-muted-foreground mt-1">Ajoutez vos premiers produits.</p>
            </div>
          )}
          {items.map((it) => (
            <div key={it.id} className="glass-1 rounded-2xl p-3 flex gap-3 items-center">
              <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden shrink-0">
                {it.image_url ? (
                  <img src={it.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/30 text-2xl">℞</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm line-clamp-2">{it.name}</div>
                <div className="text-xs text-primary font-bold mt-0.5">{formatTND(it.price)}</div>
                <div className="mt-2 inline-flex items-center rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                  <button onClick={() => setQty(it.id, it.quantity - 1)} className="h-7 w-7 inline-flex items-center justify-center text-primary hover:bg-primary/10">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{it.quantity}</span>
                  <button onClick={() => setQty(it.id, it.quantity + 1)} className="h-7 w-7 inline-flex items-center justify-center text-primary hover:bg-primary/10">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => remove(it.id)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition"
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="px-7 py-6 border-t border-primary/10" style={{ background: "rgba(0, 200, 150, 0.04)" }}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-semibold">{formatTND(total)}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-4">Livraison calculée à la prochaine étape.</div>
            <Link
              to="/commande"
              onClick={onClose}
              className="w-full h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base hover:bg-primary-glow transition shadow-elegant"
            >
              Passer à la caisse, {formatTND(total)} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
