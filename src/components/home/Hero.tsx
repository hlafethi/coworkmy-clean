import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useHomepageSettings } from "@/hooks/useHomepageSettings";
import { useIsMobile } from "@/hooks/use-mobile";
// Logger supprimé - utilisation de console directement
const Hero = () => {
  const { settings, loading } = useHomepageSettings();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <section className="flex items-center justify-center h-96 bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Chargement...</h2>
          <p className="text-gray-500">Préparation de votre espace de travail</p>
        </div>
      </section>
    );
  }

  // 🔧 CORRECTION : Vérifier si l'image est une URL blob et utiliser une image par défaut
  const getBackgroundImage = () => {
    const imageUrl = settings?.hero_background_image;
    
    // Si pas d'image ou URL blob, utiliser l'image par défaut
    if (!imageUrl || imageUrl.startsWith('blob:') || imageUrl.includes('localhost')) {
      return "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80";
    }
    
    return imageUrl;
  };

  const backgroundImage = getBackgroundImage();

  // 🔧 CORRECTION : Préparer le style correctement
  const backgroundStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: isMobile ? 'scroll' : 'fixed',
  };

  console.log('🖼️ Style appliqué:', backgroundStyle);

  return (
    <section className="relative py-16 md:py-20 overflow-hidden h-[600px] md:h-[700px]">
      {/* Image d'arrière-plan avec style object au lieu de string */}
      <div
        className="absolute inset-0"
        style={backgroundStyle}
      >
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Contenu */}
      <div className="container-custom relative z-10 flex items-center h-full">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {settings?.hero_title || "Votre espace de travail idéal"}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            {settings?.hero_subtitle || "Découvrez notre solution de coworking moderne et inspirante"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-teal-800 text-white text-lg px-8 py-4" asChild>
              <Link to="/auth/register">{settings?.cta_text || "Commencer"}</Link>
            </Button>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4" asChild>
              <Link to="/#contact">{settings?.cta_secondary_button_text || "Nous contacter"}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Gradient en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
};

export default Hero;
