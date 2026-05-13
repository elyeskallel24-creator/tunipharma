import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-glass-border">
      <div className="container-page py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-10 w-10" />
            <span className="font-display text-lg font-bold">
              Tuni<span className="gradient-text">Pharma</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-md">
            Votre pharmacie & parapharmacie en ligne en Tunisie. Livraison rapide
            et conseils de pharmaciens à votre service.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Navigation</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Accueil</Link></li>
            <li><Link to="/catalogue" className="hover:text-primary">Catalogue</Link></li>
            <li><Link to="/a-propos" className="hover:text-primary">À propos</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Légal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Conditions d'utilisation</li>
            <li>Politique de confidentialité</li>
            <li>Mentions légales</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-glass-border">
        <div className="container-page py-5 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} TuniPharma. Tous droits réservés.</span>
          <span>Fait avec soin en Tunisie 🇹🇳</span>
        </div>
      </div>
    </footer>
  );
}
