import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatTND } from "@/lib/format";

export const Route = createFileRoute("/panier")({
  head: () => ({ meta: [{ title: "Panier , TuniPharma" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, clear } = useCart();
  const total = subtotal();

  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <div className="glass-strong rounded-3xl p-12 text-center max-w-lg mx-auto">
          <ShoppingBag className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold mt-4">Votre panier est vide</h1>
          <p className="text-muted-foreground mt-2">Découvrez notre catalogue et ajoutez vos produits.</p>
          <Link to="/catalogue" className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary-glow">
            Voir le catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-4xl font-bold mb-8">Mon panier</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((it) => (
            <div key={it.id} className="glass rounded-2xl p-4 flex gap-4 items-center">
              <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden shrink-0">
                {it.image_url ? <img src={it.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary/30 text-3xl">℞</div>}
              </div>
              <div className="flex-1 min-w-0">
                <Link to="/produit/$slug" params={{ slug: it.slug }} className="font-semibold line-clamp-2 hover:text-primary">{it.name}</Link>
                <div className="text-sm text-primary font-bold mt-1">{formatTND(it.price)}</div>
              </div>
              <div className="inline-flex items-center glass rounded-full">
                <button onClick={() => setQty(it.id, it.quantity - 1)} className="h-9 w-9 inline-flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                <button onClick={() => setQty(it.id, it.quantity + 1)} className="h-9 w-9 inline-flex items-center justify-center"><Plus className="h-3 w-3" /></button>
              </div>
              <button onClick={() => remove(it.id)} className="h-9 w-9 inline-flex items-center justify-center rounded-full text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button onClick={clear} className="text-sm text-muted-foreground hover:text-destructive">Vider le panier</button>
        </div>

        <aside className="glass-strong rounded-3xl p-6 h-fit">
          <h2 className="font-bold text-lg">Récapitulatif</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatTND(total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>Calculée à l'étape suivante</span></div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between font-bold text-lg">
            <span>Total</span><span className="gradient-text">{formatTND(total)}</span>
          </div>
          <Link to="/commande" className="mt-6 w-full inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-glow shadow-elegant transition">
            Passer la commande <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
