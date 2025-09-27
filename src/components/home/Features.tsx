import { Building, Calendar, CreditCard, Globe, Shield, Users } from "lucide-react";
import { useHomepageSettings } from "@/hooks/useHomepageSettings";

const features = [
  {
    title: "Espaces flexibles",
    description: "Choisissez entre open space, bureaux privés ou salles de réunion selon vos besoins.",
    icon: Building,
  },
  {
    title: "Réservation simple",
    description: "Réservez votre espace en quelques clics grâce à notre système de réservation intuitif.",
    icon: Calendar,
  },
  {
    title: "Communauté dynamique",
    description: "Rejoignez une communauté de professionnels et développez votre réseau.",
    icon: Users,
  },
  {
    title: "Paiements sécurisés",
    description: "Effectuez vos paiements en toute sécurité avec notre système intégré.",
    icon: CreditCard,
  },
  {
    title: "Emplacements stratégiques",
    description: "Nos espaces sont situés dans des zones centrales et accessibles.",
    icon: Globe,
  },
  {
    title: "Haute sécurité",
    description: "Accès sécurisé 24/7 et protection de vos données personnelles.",
    icon: Shield,
  },
];

const Features = () => {
  const { settings } = useHomepageSettings();

  return (
    <section id="about" className="section bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="heading-2 text-gray-900 mb-4">
            {settings?.features_title || "Pourquoi choisir CoWorkMy ?"}
          </h2>
          <p className="text-gray-600 text-lg">
            {settings?.features_subtitle || "Nous offrons bien plus qu'un simple espace de travail. Découvrez nos avantages exclusifs qui font de nous le choix idéal pour les professionnels exigeants."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
              <div className="bg-accent w-12 h-12 rounded-lg flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 flex-grow">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
