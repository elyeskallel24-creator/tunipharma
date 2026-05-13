import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Truck, ShieldCheck, Clock, HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TuniPharma — Pharmacie & Parapharmacie en ligne en Tunisie" },
      { name: "description", content: "Médicaments, parapharmacie, cosmétiques. Commandez en ligne et livraison en 24h partout en Tunisie." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: slides } = useQuery({
    queryKey: ["slides"],
    queryFn: async () => {
      const { data } = await supabase.from("slider_images").select("*").eq("is_active", true).order("position");
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("position");
      return data ?? [];
    },
  });

  const { data: featured } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data } = await supabase.from("products")
        .select("id, slug, name, short_description, price, sale_price, image_url, requires_prescription, brand")
        .eq("is_active", true).eq("is_featured", true).limit(8);
      return (data ?? []) as ProductCardData[];
    },
  });

  const hero = slides?.[0];

  return (
    <div className="container-page py-8 md:py-12 space-y-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-4xl glass-strong p-8 md:p-14">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl" style={{ background: "var(--gradient-primary)" }} />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-primary">
              <HeartPulse className="h-3.5 w-3.5" /> Pharmacie agréée
            </span>
            <h1 className="mt-4 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              {hero?.title ?? "Votre pharmacie en ligne, "}
              <span className="gradient-text">en Tunisie.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              {hero?.subtitle ?? "Médicaments, parapharmacie et cosmétiques livrés chez vous en 24h. Conseils de pharmaciens à votre service."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/catalogue" className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-glow shadow-elegant transition">
                {hero?.cta_text ?? "Découvrir le catalogue"} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/a-propos" className="inline-flex h-12 items-center rounded-full glass px-6 text-sm font-semibold hover:bg-secondary/60 transition">
                En savoir plus
              </Link>
            </div>
          </div>
          <div className="relative aspect-square hidden md:block">
            {hero?.image_url ? (
              <img src={hero.image_url} alt="" className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-elegant" />
            ) : (
              <div className="absolute inset-0 rounded-3xl glass flex items-center justify-center">
                <div className="w-48 h-48 rounded-full" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { Icon: Truck, t: "Livraison 24h", s: "Partout en Tunisie" },
          { Icon: ShieldCheck, t: "Produits agréés", s: "100% authentiques" },
          { Icon: Clock, t: "Service 7j/7", s: "Conseils pharmaciens" },
          { Icon: HeartPulse, t: "Paiement à la livraison", s: "Sans engagement" },
        ].map(({ Icon, t, s }) => (
          <div key={t} className="glass rounded-2xl p-4 text-center">
            <Icon className="h-6 w-6 mx-auto text-primary" />
            <div className="mt-2 font-semibold text-sm">{t}</div>
            <div className="text-xs text-muted-foreground">{s}</div>
          </div>
        ))}
      </section>

      {/* CATEGORIES */}
      {categories && categories.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-3xl font-bold">Nos catégories</h2>
            <Link to="/catalogue" className="text-sm font-medium text-primary hover:underline">Tout voir →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((c) => (
              <Link key={c.id} to="/categorie/$slug" params={{ slug: c.slug }}
                className="group glass rounded-2xl p-5 hover:shadow-elegant hover:-translate-y-0.5 transition">
                {c.image_url ? (
                  <img src={c.image_url} alt="" className="h-20 w-20 mx-auto object-cover rounded-2xl" />
                ) : (
                  <div className="h-20 w-20 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                    <span className="text-primary-foreground text-2xl font-bold">{c.name[0]}</span>
                  </div>
                )}
                <div className="mt-3 text-center font-semibold text-sm group-hover:text-primary transition">{c.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      {featured && featured.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Produits phares</h2>
              <p className="text-sm text-muted-foreground mt-1">Les indispensables, sélectionnés par nos pharmaciens.</p>
            </div>
            <Link to="/catalogue" className="text-sm font-medium text-primary hover:underline whitespace-nowrap">Tout voir →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {(!featured || featured.length === 0) && (
        <section className="glass rounded-3xl p-10 text-center">
          <h3 className="text-xl font-semibold">Catalogue en préparation</h3>
          <p className="mt-2 text-muted-foreground">Connectez-vous à l'admin pour ajouter vos premiers produits.</p>
          <Link to="/admin" className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-glow">
            Espace admin
          </Link>
        </section>
      )}
    </div>
  );
}
