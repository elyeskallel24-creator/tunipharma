import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-store";
import { formatTND } from "@/lib/format";
import { submitOrder } from "@/lib/orders.functions";
import { WILAYAT_TN } from "@/lib/wilayat";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Phone } from "lucide-react";

export const Route = createFileRoute("/commande")({
  head: () => ({ meta: [{ title: "Commande, TuniPharma" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const submit = useServerFn(submitOrder);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | "phone" | "whatsapp">(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    contact_method: "phone" as "phone" | "whatsapp",
    wilaya: "",
    address: "",
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

  if (done) {
    const msg = done === "whatsapp"
      ? "Merci ! Nous vous contacterons prochainement via WhatsApp pour confirmer votre commande."
      : "Merci ! Nous vous contacterons prochainement par téléphone pour confirmer votre commande.";
    return (
      <div className="container-page py-20">
        <div className="glass-3 rounded-[32px] p-10 md:p-12 text-center max-w-xl mx-auto">
          <img src={logo} alt="TuniPharma" className="h-16 w-16 mx-auto" />
          <h1 className="font-display text-2xl md:text-3xl font-bold mt-6">Commande reçue</h1>
          <p className="mt-4 text-base md:text-lg text-foreground leading-relaxed">{msg}</p>
          <Link to="/" className="mt-8 inline-flex h-12 items-center rounded-2xl bg-primary px-7 font-display font-semibold text-primary-foreground hover:bg-primary-glow transition">
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
      await submit({
        data: {
          ...form,
          items: items.map((i) => ({ id: i.id, slug: i.slug, name: i.name, price: i.price, quantity: i.quantity })),
          subtotal: sub, delivery_fee: fee, total,
        },
      });
      setDone(form.contact_method);
      clear();
    } catch (err) {
      toast.error("Erreur", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-8">Finaliser la commande</h1>
      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-3 rounded-[28px] p-7 space-y-5">
          <h2 className="font-display font-bold text-lg">Informations de livraison</h2>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Votre nom et prénom</label>
            <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Numéro de téléphone ou WhatsApp</label>
            <input required type="tel" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Méthode de contact</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { v: "phone", label: "Appel téléphonique" },
                { v: "whatsapp", label: "WhatsApp" },
              ] as const).map((o) => (
                <label key={o.v} className={`flex items-center gap-3 h-12 px-4 rounded-xl border cursor-pointer transition ${form.contact_method === o.v ? "border-primary bg-primary/5" : "border-border bg-secondary/60"}`}>
                  <input type="radio" name="contact_method" checked={form.contact_method === o.v}
                    onChange={() => setForm({ ...form, contact_method: o.v })}
                    className="h-4 w-4 accent-[color:var(--primary)]" />
                  <span className="text-sm font-medium">{o.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Wilaya</label>
            <select required value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">Choisir votre wilaya…</option>
              {WILAYAT_TN.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Adresse exacte où vous souhaitez recevoir le produit</label>
            <textarea required rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <aside className="glass-3 rounded-[28px] p-7 h-fit space-y-4">
          <h2 className="font-display font-bold text-lg">Votre commande</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto nice-scroll">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="truncate pr-2">{it.quantity} × {it.name}</span>
                <span className="font-medium shrink-0">{formatTND(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-primary/15 pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatTND(sub)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{formatTND(fee)}</span></div>
            <div className="flex justify-between font-display font-bold text-lg pt-2 border-t border-primary/15"><span>Total</span><span className="gradient-text">{formatTND(total)}</span></div>
          </div>
          <p className="text-xs text-muted-foreground"><Phone className="inline h-3 w-3 mr-1" />Paiement à la livraison.</p>
          <button disabled={submitting} type="submit" className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base hover:bg-primary-glow shadow-elegant transition disabled:opacity-50">
            {submitting ? "Envoi..." : "Confirmer la commande"}
          </button>
        </aside>
      </form>
    </div>
  );
}
