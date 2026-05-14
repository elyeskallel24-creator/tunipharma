import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer
      className="mt-24 relative"
      style={{
        background: "rgba(255, 255, 255, 0.18)",
        backdropFilter: "blur(40px) saturate(2)",
        WebkitBackdropFilter: "blur(40px) saturate(2)",
        borderTop: "1px solid rgba(0, 200, 150, 0.15)",
        color: "#0A1628",
      }}
    >
      <div className="container-page pt-16 pb-8 grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <img src={logo} alt="TuniPharma" className="h-11 w-11" />
            <span className="font-display text-xl font-bold" style={{ color: "#0A1628" }}>
              Tuni<span className="gradient-text">Pharma</span>
            </span>
          </div>
          <p className="mt-4 text-sm max-w-md leading-relaxed" style={{ color: "#4A6B7C" }}>
            Votre pharmacie et parapharmacie en ligne en Tunisie. Conseils de pharmaciens,
            produits authentiques et livraison rapide partout dans le pays.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm tracking-wide mb-4" style={{ color: "#0A1628" }}>
            Navigation
          </h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { to: "/" as const, label: "Accueil" },
              { to: "/catalogue" as const, label: "Catalogue" },
              { to: "/a-propos" as const, label: "À propos" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="transition-colors"
                  style={{ color: "#4A6B7C" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#00C896")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#4A6B7C")}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        className="container-page py-6 text-xs flex flex-wrap justify-between gap-2"
        style={{
          borderTop: "1px solid rgba(0, 200, 150, 0.10)",
          color: "#4A6B7C",
        }}
      >
        <span>© {new Date().getFullYear()} TuniPharma. Tous droits réservés.</span>
        <span>Fait avec soin en Tunisie 🇹🇳</span>
      </div>
    </footer>
  );
}
