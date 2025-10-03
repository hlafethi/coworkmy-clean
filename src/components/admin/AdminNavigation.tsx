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
    { id: "overview", label: "Tableau de bord", icon: Home, color: "blue" },
    { id: "spaces", label: "Espaces", icon: Box, color: "green" },
    { id: "users", label: "Utilisateurs", icon: Users, color: "purple" },
    { id: "bookings", label: "Réservations", icon: Calendar, color: "orange" },
    { id: "payments", label: "Paiements", icon: Coins, color: "yellow" },
    { id: "payment-config", label: "Configuration des paiements", icon: CreditCard, color: "indigo" },
    { id: "timeslots", label: "Créneaux horaires", icon: Clock, color: "teal" },
    { id: "emails", label: "Emails", icon: Mail, color: "pink" },
    { id: "database", label: "Base de données", icon: Database, color: "red" },
    { id: "legal-pages", label: "Pages légales", icon: FileText, color: "gray" },
    { id: "cookie-settings", label: "Cookies", icon: Cookie, color: "amber" },
    { id: "support", label: "Support", icon: LifeBuoy, color: "cyan" },
    { id: "settings", label: "Paramètres", icon: Settings, color: "slate" },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: {
        active: "bg-blue-50 border-blue-200 text-blue-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
      },
      green: {
        active: "bg-green-50 border-green-200 text-green-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-600"
      },
      purple: {
        active: "bg-purple-50 border-purple-200 text-purple-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-600"
      },
      orange: {
        active: "bg-orange-50 border-orange-200 text-orange-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
      },
      yellow: {
        active: "bg-yellow-50 border-yellow-200 text-yellow-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600"
      },
      indigo: {
        active: "bg-indigo-50 border-indigo-200 text-indigo-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
      },
      teal: {
        active: "bg-teal-50 border-teal-200 text-teal-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-teal-50 hover:text-teal-600"
      },
      pink: {
        active: "bg-pink-50 border-pink-200 text-pink-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
      },
      red: {
        active: "bg-red-50 border-red-200 text-red-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600"
      },
      gray: {
        active: "bg-gray-50 border-gray-200 text-gray-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-600"
      },
      amber: {
        active: "bg-amber-50 border-amber-200 text-amber-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-amber-50 hover:text-amber-600"
      },
      cyan: {
        active: "bg-cyan-50 border-cyan-200 text-cyan-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-cyan-50 hover:text-cyan-600"
      },
      slate: {
        active: "bg-slate-50 border-slate-200 text-slate-700",
        inactive: "bg-white border-gray-200 text-gray-600 hover:bg-slate-50 hover:text-slate-600"
      }
    };

    return colorMap[color as keyof typeof colorMap]?.[isActive ? 'active' : 'inactive'] || colorMap.blue.inactive;
  };

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
          const isActive = activeView === id;
          const colorClasses = getColorClasses(color, isActive);
          
          return (
            <li key={id}>
              <button
                className={`flex flex-col items-center justify-center h-16 gap-1 p-1 text-center rounded-md border transition-all duration-200 w-full ${colorClasses} ${isActive ? 'shadow-lg' : 'hover:shadow-md'}`}
                onClick={() => onViewChange(id)}
                aria-current={isActive ? "page" : undefined}
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
