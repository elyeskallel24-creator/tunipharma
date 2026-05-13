import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-store";
import { formatTND } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/commande")({
  head: () => ({ meta: [{ title: "Commande — TuniPharma" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: "",
    address: "", city: "", postal_code: "", notes: "",
  });

  const { data: settings } = useQuery({
    queryKey: ["settings", "site"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "site").maybeSingle();
      return (data?.value as { delivery_fee?: number }) ?? {};
    },
  });

  const sub = subtotal();
  const fee = settings?.delivery_fee ?? 7;
  const total = sub + fee;

  if (orderNumber) {
    return (
      <div className="container-page py-20">
        <div className="glass-strong rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="h-16 w-16 rounded-full bg-success/20 mx-auto flex items-center justify-center">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mt-4">Commande confirmée !</h1>
          <p className="text-muted-foreground mt-2">
            Numéro de commande : <span className="font-mono font-bold text-foreground">{orderNumber}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-4">Notre équipe vous contactera très rapidement pour confirmer la livraison.</p>
          <Link to="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary-glow">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    navigate({ to: "/panier" });
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("orders").insert({
        order_number: "",
        ...form,
        items: items.map((i) => ({
          id: i.id, slug: i.slug, name: i.name, price: i.price, quantity: i.quantity,
        })),
        subtotal: sub,
        delivery_fee: fee,
        total,
      }).select("order_number").single();
      if (error) throw error;
      setOrderNumber(data.order_number);
      clear();
    } catch (err) {
      toast.error("Erreur", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full h-12 px-4 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-4xl font-bold mb-8">Finaliser la commande</h1>
      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-strong rounded-3xl p-6 space-y-4">
          <h2 className="font-bold text-lg">Informations de livraison</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input required placeholder="Nom complet *" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className={inputCls} />
            <input required type="tel" placeholder="Téléphone *" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className={inputCls} />
            <input type="email" placeholder="Email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className={`${inputCls} md:col-span-2`} />
            <input required placeholder="Adresse *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${inputCls} md:col-span-2`} />
            <input required placeholder="Ville *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
            <input placeholder="Code postal" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className={inputCls} />
            <textarea placeholder="Notes (optionnel)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputCls} md:col-span-2 h-24 py-3`} />
          </div>
        </div>

        <aside className="glass-strong rounded-3xl p-6 h-fit space-y-3">
          <h2 className="font-bold text-lg">Votre commande</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="truncate pr-2">{it.quantity} × {it.name}</span>
                <span className="font-medium shrink-0">{formatTND(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatTND(sub)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{formatTND(fee)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border"><span>Total</span><span className="gradient-text">{formatTND(total)}</span></div>
          </div>
          <p className="text-xs text-muted-foreground">💵 Paiement à la livraison.</p>
          <button disabled={submitting} type="submit" className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-glow shadow-elegant transition disabled:opacity-50">
            {submitting ? "Envoi…" : "Confirmer la commande"}
          </button>
        </aside>
      </form>
    </div>
  );
}
