import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-store";
import { formatTND } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/commande")({
  head: () => ({ meta: [{ title: "Commande, TuniPharma" }] }),
  component: CheckoutPage,
});

function Field({ id, label, value, onChange, type = "text", required, textarea }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; textarea?: boolean }) {
  return (
    <div className="field">
      {textarea ? (
        <textarea id={id} value={value} placeholder=" " required={required} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type={type} value={value} placeholder=" " required={required} onChange={(e) => onChange(e.target.value)} />
      )}
      <label htmlFor={id}>{label}{required && " *"}</label>
    </div>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
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

  if (done) {
    return (
      <div className="container-page py-20">
        <div className="glass-3 rounded-[32px] p-12 text-center max-w-xl mx-auto" style={{ animation: "floatIn 0.5s cubic-bezier(0.23, 1, 0.32, 1)" }}>
          <svg className="mx-auto" width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="var(--primary)" strokeWidth="3"
              strokeDasharray="226" strokeDashoffset="226"
              style={{ animation: "draw 0.7s 0.1s ease-out forwards" }} />
            <path d="M24 42 L36 54 L58 30" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="60" strokeDashoffset="60"
              style={{ animation: "draw 0.4s 0.7s ease-out forwards" }} />
          </svg>
          <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
          <h1 className="font-display text-2xl md:text-3xl font-bold mt-6">Commande reçue</h1>
          <p className="mt-4 text-base md:text-lg text-foreground leading-relaxed">
            Merci, nous vous contacterons bientôt pour confirmer votre achat et vous le faire parvenir en toute sécurité.
          </p>
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
      const { error } = await supabase.from("orders").insert({
        order_number: "",
        ...form,
        items: items.map((i) => ({ id: i.id, slug: i.slug, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal: sub,
        delivery_fee: fee,
        total,
      }).select("order_number").single();
      if (error) throw error;
      setDone(true);
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
        <div className="lg:col-span-2 glass-3 rounded-[28px] p-7 space-y-4">
          <h2 className="font-display font-bold text-lg">Informations de livraison</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <Field id="cn" label="Nom complet" required value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} />
            <Field id="cp" label="Téléphone" type="tel" required value={form.customer_phone} onChange={(v) => setForm({ ...form, customer_phone: v })} />
            <div className="md:col-span-2"><Field id="ce" label="Email (optionnel)" type="email" value={form.customer_email} onChange={(v) => setForm({ ...form, customer_email: v })} /></div>
            <div className="md:col-span-2"><Field id="ad" label="Adresse" required value={form.address} onChange={(v) => setForm({ ...form, address: v })} /></div>
            <Field id="ci" label="Ville" required value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Field id="po" label="Code postal" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} />
            <div className="md:col-span-2"><Field id="no" label="Notes (optionnel)" textarea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} /></div>
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
          <p className="text-xs text-muted-foreground">💵 Paiement à la livraison.</p>
          <button disabled={submitting} type="submit" className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base hover:bg-primary-glow shadow-elegant transition disabled:opacity-50">
            {submitting ? "Envoi..." : "Confirmer la commande"}
          </button>
        </aside>
      </form>
    </div>
  );
}
