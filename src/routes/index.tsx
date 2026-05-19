import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, ShieldCheck, Clock, HeartPulse, Pill, Leaf, Droplets, Baby, Sparkles, Star, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { PrescriptionDialog } from "@/components/site/PrescriptionDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TuniPharma, votre pharmacie en ligne en Tunisie" },
      { name: "description", content: "Médicaments, parapharmacie et cosmétiques livrés rapidement partout en Tunisie. Sélection de pharmaciens et paiement à la livraison." },
    ],
  }),
  component: HomePage,
});

const CAT_ICONS = [Pill, Leaf, Droplets, Baby, Sparkles, HeartPulse, Star, ShieldCheck];

function HomePage() {
  const [rxOpen, setRxOpen] = useState(false);
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
        .select("id, slug, name, short_description, price, sale_price, image_url, gallery, requires_prescription, brand, is_featured")
        .eq("is_active", true).eq("is_featured", true).limit(7);
      return (data ?? []) as ProductCardData[];
    },
  });

  useScrollReveal([slides?.length, categories?.length, featured?.length]);

  // slider state
  const list = slides ?? [];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 5500);
    return () => clearInterval(t);
  }, [list.length]);
  const hero = list[idx];

  return (
    <div className="container-page py-6 md:py-10 space-y-20">
      {/* HERO PARALLAX SLIDER */}
      <section className="relative" data-animate>
        <div
          className="relative overflow-hidden rounded-[40px] glass-3 min-h-[420px] md:min-h-[520px] flex items-end"
          style={{
            maskImage: "linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%)",
          }}
        >
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-40 blur-3xl pointer-events-none"
            style={{ background: "var(--gradient-primary)" }}
          />
          {hero?.image_url && (
            <img
              key={hero.id}
              src={hero.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ animation: "slideInRight 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
              loading="eager"
              fetchPriority="high"
            />
          )}
          <div
            className="relative w-full p-7 md:p-12"
            style={{
              background: "linear-gradient(0deg, rgba(255,255,255,0.92) 30%, rgba(255,255,255,0.4) 70%, transparent 100%)",
              backdropFilter: "blur(2px)",
            }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-2 text-xs font-semibold text-primary">
              <HeartPulse className="h-3.5 w-3.5" /> Pharmacie agréée
            </span>
            <h1 className="mt-4 font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight max-w-3xl">
              {hero?.title ?? "Votre pharmacie"}
              <span className="block gradient-text">en ligne, en Tunisie.</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl">
              {hero?.subtitle ?? "Médicaments, parapharmacie et cosmétiques livrés chez vous en 24h. Conseils de pharmaciens à votre service."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/catalogue"
                onClick={(e) => {
                  const el = document.getElementById("catalogue-section");
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-7 text-sm font-display font-semibold text-primary-foreground hover:bg-primary-glow shadow-elegant transition hover:-translate-y-0.5"
              >
                {hero?.cta_text ?? "Découvrir le catalogue"} <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setRxOpen(true)}
                className="inline-flex h-12 items-center gap-2 rounded-2xl glass-2 px-7 text-sm font-display font-semibold hover:bg-primary/8 transition border border-primary/30 text-primary"
              >
                <FileText className="h-4 w-4" /> J'ai une ordonnance
              </button>
              <Link to="/a-propos" className="inline-flex h-12 items-center rounded-2xl glass-2 px-7 text-sm font-display font-semibold hover:bg-primary/8 transition">
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
        {list.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {list.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 80 : 40,
                  height: 4,
                  background: i === idx ? "var(--primary)" : "rgba(0,200,150,0.2)",
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* TRUST */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3" data-animate>
        {[
          { Icon: Truck, t: "Livraison 24h", s: "Partout en Tunisie" },
          { Icon: ShieldCheck, t: "Produits agréés", s: "100% authentiques" },
          { Icon: Clock, t: "Service 7j/7", s: "Conseils pharmaciens" },
          { Icon: HeartPulse, t: "Paiement livraison", s: "Sans engagement" },
        ].map(({ Icon, t, s }) => (
          <div key={t} className="glass-2 rounded-2xl p-5 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
              <Icon className="h-5 w-5" />
            </span>
            <div className="font-display font-semibold text-sm">{t}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s}</div>
          </div>
        ))}
      </section>

      {/* FEATURED PRODUCTS - BENTO GRID */}
      {featured && featured.length > 0 && (
        <section id="catalogue-section" data-animate style={{ scrollMarginTop: 96 }}>
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Sélection</span>
              <h2 className="font-display text-3xl md:text-5xl font-bold mt-1.5">Offres exceptionnelles</h2>
              <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-md">Les indispensables, sélectionnés par nos pharmaciens.</p>
            </div>
            <Link to="/catalogue" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Tout voir <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:auto-rows-[minmax(0,_1fr)]">
            {featured.map((p, i) => (
              <div
                key={p.id}
                data-animate
                data-delay={i * 60}
                className={i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}
              >
                <ProductCard p={p} large={i === 0} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      {categories && categories.length > 0 && (
        <section data-animate>
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Explorez</span>
              <h2 className="font-display text-3xl md:text-5xl font-bold mt-1.5">Notre catalogue</h2>
            </div>
            <Link to="/catalogue" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Tout voir <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((c, i) => {
              const Icon = CAT_ICONS[i % CAT_ICONS.length];
              const img = (c as { image_url?: string | null }).image_url;
              return (
                <Link
                  key={c.id}
                  to="/categorie/$slug"
                  params={{ slug: c.slug }}
                  data-animate
                  data-delay={i * 60}
                  className="group glass-2 rounded-3xl p-6 text-center hover:-translate-y-1.5 transition duration-500 hover:bg-primary/5"
                >
                  {img ? (
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden bg-primary/10 group-hover:rotate-3 group-hover:scale-110 transition">
                      <img src={img} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                    </span>
                  ) : (
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:rotate-6 group-hover:scale-110 transition">
                      <Icon className="h-7 w-7" />
                    </span>
                  )}
                  <div className="mt-3 font-display font-semibold text-sm group-hover:text-primary transition">{c.name}</div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* SEO MAGAZINE BLOCK */}
      <section className="glass-3 rounded-[40px] p-8 md:p-14 relative overflow-hidden" data-animate>
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
             style={{ background: "var(--gradient-primary)" }} />
        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">À propos</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mt-2 leading-tight">
              Votre santé,<br />
              <span className="gradient-text">notre priorité.</span>
            </h2>
            <div className="mt-5 text-sm md:text-base text-muted-foreground space-y-3 max-w-prose">
              <p>
                TuniPharma rassemble une sélection rigoureuse de médicaments et de produits de pharmacie
                et parapharmacie authentiques, livrés rapidement partout en Tunisie. Notre équipe de
                pharmaciens vous guide pour choisir les soins adaptés à vos besoins.
              </p>
              <p>
                Bébés, soins du visage, hygiène, vitamines, dermatologie... : explorez un catalogue pensé
                pour la famille tunisienne. Commande simple, paiement à la livraison, et accompagnement
                humain à chaque étape.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: "500+", l: "produits" },
              { n: "24h", l: "livraison" },
              { n: "7j/7", l: "service" },
            ].map((s) => (
              <div
                key={s.l}
                className="glass-2 rounded-2xl p-5 text-center"
                style={{ overflow: "hidden", position: "relative" }}
              >
                <div
                  className="font-display font-bold text-2xl md:text-3xl text-primary"
                  style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
                >
                  {s.n}
                </div>
                <div
                  className="text-xs text-muted-foreground mt-1 uppercase tracking-wider"
                  style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
