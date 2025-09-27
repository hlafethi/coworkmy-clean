import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
  canonicalUrl?: string;
  keywords?: string[];
  noIndex?: boolean;
}

/**
 * MetaTags component for SEO optimization
 * This component adds meta tags to the page for better SEO
 */
export const MetaTags = ({
  title = 'CoWorkMy',
  description = 'Espace de coworking moderne et flexible',
  image = '/icons/icon-512x512.png',
  article = false,
  canonicalUrl,
  keywords = ['coworking', 'espace de travail', 'bureau', 'location', 'professionnel'],
  noIndex = false,
}: MetaTagsProps) => {
  const { pathname } = useLocation();
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://coworkmy.com';
  const url = `${siteUrl}${pathname}`;
  const finalCanonicalUrl = canonicalUrl || url;
  
  // Ensure image has absolute URL
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={finalCanonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="CoWorkMy" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* No index if specified */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Additional SEO tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="French" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="CoWorkMy" />
    </Helmet>
  );
};
