import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { data: settings, isLoading } = useAppSettings();

  if (isLoading) {
    return <footer className="bg-gray-50 pt-16 pb-8">Chargement...</footer>;
  }

  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {settings?.siteName || "CoWorkMy"}
            </h2>
            <p className="text-gray-700">
              Votre espace de coworking moderne et convivial pour les professionnels qui cherchent à innover et collaborer.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/#about" className="text-gray-700 hover:text-primary transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/#services" className="text-gray-700 hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="text-gray-700 hover:text-primary transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="text-gray-700 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Informations légales</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/legal/terms" className="text-gray-700 hover:text-primary transition-colors">
                  Conditions générales
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="text-gray-700 hover:text-primary transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/legal" className="text-gray-700 hover:text-primary transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
            <address className="not-italic text-gray-700 space-y-2">
              <p>10 lieu dit la platiere</p>
              <p>Parc de la platiere</p>
              <p>42320 La Grand Croix, France</p>
              <p className="pt-2">
                <a 
                  href={`tel:${settings?.phoneNumber || "+33123456789"}`} 
                  className="hover:text-primary transition-colors"
                >
                  {settings?.phoneNumber || "+33 1 23 45 67 89"}
                </a>
              </p>
              <p>
                <a 
                  href={`mailto:${settings?.contactEmail || "contact@placetobe.fr"}`} 
                  className="hover:text-primary transition-colors"
                >
                  {settings?.contactEmail || "contact@placetobe.fr"}
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 text-center">
            &copy; {currentYear} {settings?.siteName || "CoWorkMy"}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
