import { WorkspaceCarousel } from "./WorkspaceCarousel";
import { useHomepageSettings } from "@/hooks/useHomepageSettings";

const Pricing = () => {
  const { settings, loading } = useHomepageSettings();

  if (loading) {
    return (
      <section className="section bg-white py-12">
        <div className="container-custom">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="section bg-white py-12">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="heading-2 text-gray-900 text-3xl font-bold mb-4">
            {settings?.workspace_title || "Nos espaces de travail"}
          </h2>
          <p className="text-gray-600 text-lg">
            {settings?.workspace_subtitle || "Découvrez nos espaces de coworking et leurs tarifs adaptés à vos besoins"}
          </p>
        </div>

        <div className="mb-16">
          <WorkspaceCarousel />
        </div>
      </div>
    </section>
  );
};

export default Pricing;
