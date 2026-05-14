import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  Link,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-3xl p-10">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-glow">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-3xl p-10">
        <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="h-11 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow"
          >
            Réessayer
          </button>
          <a href="/" className="h-11 px-6 inline-flex items-center rounded-full border border-border text-sm font-semibold hover:bg-secondary">
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TuniPharma — Pharmacie & Parapharmacie en ligne en Tunisie" },
      { name: "description", content: "Commandez vos médicaments et produits de parapharmacie en ligne avec livraison partout en Tunisie. TuniPharma, votre pharmacie de confiance." },
      { name: "theme-color", content: "#1ea487" },
      { property: "og:title", content: "TuniPharma — Pharmacie & Parapharmacie en ligne en Tunisie" },
      { property: "og:description", content: "Commandez vos médicaments et produits de parapharmacie en ligne avec livraison partout en Tunisie. TuniPharma, votre pharmacie de confiance." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "fr_FR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TuniPharma — Pharmacie & Parapharmacie en ligne en Tunisie" },
      { name: "twitter:description", content: "Commandez vos médicaments et produits de parapharmacie en ligne avec livraison partout en Tunisie. TuniPharma, votre pharmacie de confiance." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4d917224-e177-4835-80d5-636cf491de3a/id-preview-e518e02e--d9536e92-10e3-4612-873e-fec9bd99b363.lovable.app-1778633872110.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4d917224-e177-4835-80d5-636cf491de3a/id-preview-e518e02e--d9536e92-10e3-4612-873e-fec9bd99b363.lovable.app-1778633872110.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        {!isAdmin && <Header />}
        <main className="flex-1">
          <Outlet />
        </main>
        {!isAdmin && <Footer />}
      </div>
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
