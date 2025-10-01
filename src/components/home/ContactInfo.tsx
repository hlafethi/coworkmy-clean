import { useHomepageSettings } from "@/hooks/useHomepageSettings";

const ContactInfo = () => {
  const { settings, loading } = useHomepageSettings();

  if (loading) {
    return <div>Chargement des informations de contact...</div>;
  }

  return (
    <div>
      <h2 className="heading-2 text-gray-900 mb-4">
        Contactez-<span className="text-primary">nous</span>
      </h2>
      <p className="text-gray-600 mb-8">
        Des questions ? Besoin d'informations supplémentaires ou d'une visite ? 
        N'hésitez pas à nous contacter, notre équipe est à votre disposition.
      </p>

      <div className="space-y-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-accent flex items-center justify-center mr-4">
            <svg
              className="h-5 w-5 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Adresse</h3>
            <p className="text-gray-600 mt-1 whitespace-pre-line">
              {settings?.company_address || "10 lieu dit la platiere\nParc de la platiere\n42320 La Grand Croix, France"}
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-accent flex items-center justify-center mr-4">
            <svg
              className="h-5 w-5 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Téléphone</h3>
            <p className="text-gray-600 mt-1">
              {settings?.company_phone || "+33 1 23 45 67 89"}
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-accent flex items-center justify-center mr-4">
            <svg
              className="h-5 w-5 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Email</h3>
            <p className="text-gray-600 mt-1">
              {settings?.company_email || "contact@placetobe.fr"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
