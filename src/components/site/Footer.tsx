import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Phone } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer
      className="mt-24 relative"
      style={{
        background: "rgba(8, 18, 30, 0.94)",
        backdropFilter: "blur(40px) saturate(1.5)",
        WebkitBackdropFilter: "blur(40px) saturate(1.5)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.72)",
      }}
    >
      <div className="container-page pt-20 pb-10 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <img src={logo} alt="TuniPharma" className="h-11 w-11" />
            <span className="font-display text-xl font-bold text-white">
              Tuni<span className="gradient-text">Pharma</span>
            </span>
          </div>
          <p className="mt-4 text-sm max-w-md leading-relaxed">
            Votre pharmacie et parapharmacie en ligne en Tunisie. Conseils de pharmaciens,
            produits authentiques et livraison rapide partout dans le pays.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { Icon: Instagram, href: "#" },
              { Icon: Facebook, href: "#" },
              { Icon: Mail, href: "mailto:contact@tunipharma.tn" },
              { Icon: Phone, href: "tel:+216" },
            ].map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                className="h-10 w-10 inline-flex items-center justify-center rounded-full transition"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Icon className="h-4 w-4 text-white/80" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-white text-sm tracking-wide mb-4">Navigation</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/" className="hover:text-primary transition">Accueil</Link></li>
            <li><Link to="/catalogue" className="hover:text-primary transition">Catalogue</Link></li>
            <li><Link to="/a-propos" className="hover:text-primary transition">À propos</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-white text-sm tracking-wide mb-4">Informations</h4>
          <ul className="space-y-2.5 text-sm">
            <li>Conditions d'utilisation</li>
            <li>Politique de confidentialité</li>
            <li>Mentions légales</li>
            <li>Livraison et retours</li>
          </ul>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="container-page py-6 text-xs flex flex-wrap justify-between gap-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          <span>© {new Date().getFullYear()} TuniPharma. Tous droits réservés.</span>
          <span>Fait avec soin en Tunisie 🇹🇳</span>
        </div>
      </div>
    </footer>
  );
}
