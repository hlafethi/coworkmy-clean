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
  LifeBuoy,
  Layers
} from "lucide-react";

type AdminNavigationProps = {
  activeView: string;
  onViewChange: (view: string) => void;
};

export const AdminNavigation = ({ activeView, onViewChange }: AdminNavigationProps) => {
  const navItems = [
    { id: "overview", label: "Tableau de bord", icon: Home, color: "blue" },
    { id: "overview-dual", label: "Vue Dual", icon: Layers, color: "emerald" },
    { id: "spaces", label: "Espaces", icon: Box, color: "green" },
    { id: "users", label: "Utilisateurs", icon: Users, color: "purple" },
    { id: "bookings", label: "Réservations", icon: Calendar, color: "orange" },
    { id: "payments", label: "Paiements", icon: Coins, color: "yellow" },
    { id: "payment-config", label: "Configuration des paiements", icon: CreditCard, color: "indigo" },
    { id: "timeslots", label: "Créneaux horaires", icon: Clock, color: "pink" },
    { id: "emails", label: "Emails", icon: Mail, color: "teal" },
    { id: "database", label: "Base de données", icon: Database, color: "red" },
    { id: "legal-pages", label: "Pages légales", icon: FileText, color: "gray" },
    { id: "cookie-settings", label: "Cookies", icon: Cookie, color: "amber" },
    { id: "support", label: "Support", icon: LifeBuoy, color: "cyan" },
    { id: "settings", label: "Paramètres", icon: Settings, color: "slate" },
  ];

  return (
    <nav
      className="p-4"
      role="navigation"
      aria-label="Navigation principale de l'administration"
    >
      <ul
        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
        role="list"
      >
        {navItems.map(({ id, label, icon: Icon, color }) => {
          const getColorClasses = (isActive: boolean) => {
            const colorMap = {
              blue: isActive ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : "bg-blue-50/30 text-blue-600 border-blue-100 hover:bg-blue-50",
              green: isActive ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-green-50/30 text-green-600 border-green-100 hover:bg-green-50",
              purple: isActive ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" : "bg-purple-50/30 text-purple-600 border-purple-100 hover:bg-purple-50",
              orange: isActive ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" : "bg-orange-50/30 text-orange-600 border-orange-100 hover:bg-orange-50",
              yellow: isActive ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" : "bg-yellow-50/30 text-yellow-600 border-yellow-100 hover:bg-yellow-50",
              indigo: isActive ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" : "bg-indigo-50/30 text-indigo-600 border-indigo-100 hover:bg-indigo-50",
              pink: isActive ? "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100" : "bg-pink-50/30 text-pink-600 border-pink-100 hover:bg-pink-50",
              teal: isActive ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" : "bg-teal-50/30 text-teal-600 border-teal-100 hover:bg-teal-50",
              red: isActive ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-red-50/30 text-red-600 border-red-100 hover:bg-red-50",
              gray: isActive ? "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100" : "bg-gray-50/30 text-gray-600 border-gray-100 hover:bg-gray-50",
              amber: isActive ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-amber-50/30 text-amber-600 border-amber-100 hover:bg-amber-50",
              cyan: isActive ? "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" : "bg-cyan-50/30 text-cyan-600 border-cyan-100 hover:bg-cyan-50",
              emerald: isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-emerald-50/30 text-emerald-600 border-emerald-100 hover:bg-emerald-50",
              slate: isActive ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" : "bg-slate-50/30 text-slate-600 border-slate-100 hover:bg-slate-50",
            };
            return colorMap[color] || colorMap.blue;
          };

          return (
            <li key={id}>
              <button
                className={`flex flex-col items-center justify-center h-16 gap-1 p-2 text-center rounded-lg border transition-all duration-200 w-full ${getColorClasses(activeView === id)}`}
                onClick={() => onViewChange(id)}
                aria-current={activeView === id ? "page" : undefined}
                aria-label={`Accéder à ${label}`}
              >
                <Icon
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-center leading-tight">
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
