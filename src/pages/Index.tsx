import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Services from "@/components/home/Services";
import Pricing from "@/components/home/Pricing";
import Testimonials from "@/components/home/Testimonials";
import Contact from "@/components/home/Contact";
import CallToAction from "@/components/home/CallToAction";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
// Logger supprimé - utilisation de console directement
const Index = () => {
  const { hash, pathname } = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Chargement...</h2>
          <p className="text-gray-500">Préparation de votre espace de travail</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
        <main className="flex-grow">
          <Hero />
        <Features />
        <Services />
        <Pricing />
        <Testimonials />
        <Contact />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
