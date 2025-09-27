import {
  Box,
  Users,
  Home,
  Settings,
  Coins,
  Calendar,
  Clock,
  Mail,
  Database,
  CreditCard,
  FileText,
  Cookie,
  LifeBuoy
} from "lucide-react";

type AdminNavigationProps = {
  activeView: string;
  onViewChange: (view: string) => void;
};

export const AdminNavigation = ({ activeView, onViewChange }: AdminNavigationProps) => {
  const navItems = [
    { id: "overview", label: "Tableau de bord", icon: Home },
    { id: "spaces", label: "Espaces", icon: Box },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "bookings", label: "Réservations", icon: Calendar },
    { id: "payments", label: "Paiements", icon: Coins },
    { id: "payment-config", label: "Configuration des paiements", icon: CreditCard },
    { id: "timeslots", label: "Créneaux horaires", icon: Clock },
    { id: "emails", label: "Emails", icon: Mail },
    { id: "database", label: "Base de données", icon: Database },
    { id: "legal-pages", label: "Pages légales", icon: FileText },
    { id: "cookie-settings", label: "Cookies", icon: Cookie },
    { id: "support", label: "Support", icon: LifeBuoy },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <nav
      className="p-4"
      role="navigation"
      aria-label="Navigation principale de l'administration"
    >
      <ul
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        role="list"
      >
        {navItems.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              className={`flex flex-col items-center justify-center h-24 gap-2 p-2 text-center rounded-md border transition-all duration-200 w-full ${activeView === id
                ? "bg-primary/10 text-primary border-primary shadow-lg hover:bg-primary/20 focus:ring-2 focus:ring-primary/50"
                : "bg-white border-gray-200 hover:bg-primary/10 text-gray-800"
                }`}
              onClick={() => onViewChange(id)}
              aria-current={activeView === id ? "page" : undefined}
              aria-label={`Accéder à ${label}`}
            >
              <Icon
                className={`h-6 w-6 ${activeView === id ? "text-primary" : "text-gray-600"}`}
                aria-hidden="true"
              />
              <span
                className={`text-sm font-semibold text-center leading-tight ${activeView === id ? "text-primary" : "text-gray-900"}`}
              >
                {label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
