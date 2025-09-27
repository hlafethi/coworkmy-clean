import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useHomepageSettings } from "@/hooks/useHomepageSettings";

const CallToAction = () => {
  const { settings } = useHomepageSettings();

  return (
    <section className="bg-primary py-16">
      <div className="container-custom text-center">
        <h2 className="heading-2 text-white mb-6">
          {settings?.cta_section_title || "Prêt à rejoindre notre communauté ?"}
        </h2>
        <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
          {settings?.cta_section_subtitle || "Inscrivez-vous dès aujourd'hui et commencez à profiter de tous les avantages"}.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-primary hover:bg-gray-100" asChild>
            <Link to="/auth/register">{settings?.cta_text || "Commencer"}</Link>
          </Button>
          <Button
            size="lg"
            className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary transition-colors"
            asChild
          >
            <Link to="/booking">{settings?.cta_secondary_button_text || "Réserver une visite"}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
