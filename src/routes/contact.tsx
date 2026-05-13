import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — TuniPharma" }] }),
  component: ContactPage,
});

function ContactPage() {
  const { data: site } = useQuery({
    queryKey: ["settings", "site"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "site").maybeSingle();
      return (data?.value as { phone?: string; email?: string; address?: string }) ?? {};
    },
  });

  return (
    <div className="container-page py-12 md:py-16 max-w-4xl">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold">Contact</h1>
        <p className="mt-3 text-muted-foreground">Notre équipe vous répond rapidement.</p>
      </header>
      <div className="grid md:grid-cols-3 gap-4">
        <a href={`tel:${site?.phone}`} className="glass-strong rounded-3xl p-8 text-center hover:shadow-elegant transition">
          <Phone className="h-8 w-8 mx-auto text-primary" />
          <h3 className="mt-3 font-bold">Téléphone</h3>
          <p className="text-sm text-muted-foreground mt-1">{site?.phone ?? "+216 00 000 000"}</p>
        </a>
        <a href={`mailto:${site?.email}`} className="glass-strong rounded-3xl p-8 text-center hover:shadow-elegant transition">
          <Mail className="h-8 w-8 mx-auto text-primary" />
          <h3 className="mt-3 font-bold">Email</h3>
          <p className="text-sm text-muted-foreground mt-1">{site?.email ?? "contact@tunipharma.tn"}</p>
        </a>
        <div className="glass-strong rounded-3xl p-8 text-center">
          <MapPin className="h-8 w-8 mx-auto text-primary" />
          <h3 className="mt-3 font-bold">Adresse</h3>
          <p className="text-sm text-muted-foreground mt-1">{site?.address ?? "Tunis, Tunisie"}</p>
        </div>
      </div>
    </div>
  );
}
