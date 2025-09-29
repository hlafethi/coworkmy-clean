import { Button } from "@/components/ui/button";
import { Menu, X, User, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContextPostgreSQL";
import { useAppSettings } from "@/hooks/useAppSettings";
import { StripeModeIndicator } from "./StripeModeIndicator";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { data: settings } = useAppSettings();
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    closeMenu();
  };

  const navLinks = [
    { title: "Accueil", href: "/" },
    { title: "À propos", href: "/#about" },
    { title: "Services", href: "/#services" },
    { title: "Tarifs", href: "/#pricing" },
    { title: "Contact", href: "/#contact" },
    { title: "Support", href: "/support" },
  ];

  return (
    <header className="bg-white py-4 shadow-sm sticky top-0 z-50">
      <nav className="container-custom flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="text-primary font-bold text-2xl">
            {settings?.siteName || "CoWorkMy"}
          </span>
          <StripeModeIndicator />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <ul className="flex space-x-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={`text-gray-700 hover:text-primary font-medium transition duration-200 ${location.pathname === link.href ? "text-primary" : ""
                    }`}
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex space-x-3">
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <Link to="/admin">
                      <Settings size={16} />
                      Administration
                    </Link>
                  </Button>
                )}
                <Button className="bg-primary hover:bg-teal-800 flex items-center gap-2" asChild>
                  <Link to="/dashboard">
                    <User size={16} />
                    Mon espace
                  </Link>
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={handleSignOut}>
                  <LogOut size={16} />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/auth/login">Connexion</Link>
                </Button>
                <Button className="bg-primary hover:bg-teal-800" asChild>
                  <Link to="/auth/register">Inscription</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700 hover:text-primary focus:outline-none"
          onClick={toggleMenu}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-md z-50 animate-fade-in">
          <ul className="flex flex-col py-4 px-4 space-y-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={`text-gray-700 hover:text-primary font-medium block transition duration-200 ${location.pathname === link.href ? "text-primary" : ""
                    }`}
                  onClick={closeMenu}
                >
                  {link.title}
                </Link>
              </li>
            ))}
            <li className="pt-2 flex flex-col space-y-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2" asChild>
                      <Link to="/admin" onClick={closeMenu}>
                        <Settings size={16} />
                        Administration
                      </Link>
                    </Button>
                  )}
                  <Button className="w-full bg-primary hover:bg-teal-800 flex items-center justify-center gap-2" asChild>
                    <Link to="/dashboard" onClick={closeMenu}>
                      <User size={16} />
                      Mon espace
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={handleSignOut}>
                    <LogOut size={16} />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/auth/login" onClick={closeMenu}>Connexion</Link>
                  </Button>
                  <Button className="w-full bg-primary hover:bg-teal-800" asChild>
                    <Link to="/auth/register" onClick={closeMenu}>Inscription</Link>
                  </Button>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
