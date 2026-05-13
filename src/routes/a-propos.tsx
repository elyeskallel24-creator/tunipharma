import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — TuniPharma" },
      { name: "description", content: "Découvrez TuniPharma, votre pharmacie en ligne tunisienne. Notre mission, vision et valeurs." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useQuery({
    queryKey: ["about"],
    queryFn: async () => (await supabase.from("about_content").select("*").order("position")).data ?? [],
  });

  return (
    <div className="container-page py-12 md:py-16 max-w-4xl">
      <header className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">À propos de <span className="gradient-text">TuniPharma</span></h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Une pharmacie en ligne pensée pour la Tunisie, alliant expertise pharmaceutique et innovation digitale.
        </p>
      </header>
      <div className="space-y-6">
        {data?.map((s, i) => (
          <section key={s.id} className={`glass-strong rounded-3xl p-8 md:p-12 ${i % 2 === 1 ? "md:ml-12" : "md:mr-12"}`}>
            <h2 className="text-3xl font-bold mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">{s.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
