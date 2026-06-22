import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'SiHuni';
const DEFAULT_IMAGE = 'https://sihuni.app/og-image.png';
const BASE_URL = 'https://sihuni.app';

interface MetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  canonical?: string;
  keywords?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export function Meta({
  title = SITE_NAME,
  description = 'Platform manajemen properti terlengkap di Indonesia. Kelola kos, kontrakan, dan apartemen dalam satu sistem terintegrasi.',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  canonical,
  keywords,
  author = 'SiHuni',
  publishedTime,
  modifiedTime,
}: MetaProps) {
  const pageTitle = title === SITE_NAME
    ? `${SITE_NAME} - Platform Manajemen Properti Indonesia`
    : `${title} | ${SITE_NAME}`;

  const currentUrl = url ?? (typeof window !== 'undefined'
    ? window.location.href
    : BASE_URL);

  const canonicalUrl = canonical ?? (typeof window !== 'undefined'
    ? window.location.origin + window.location.pathname
    : BASE_URL);

  // Ensure absolute image URL
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={description} />
      <meta name="author" content={author} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:locale" content="id_ID" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@sihuni_app" />
      <meta name="twitter:creator" content="@sihuni_app" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={pageTitle} />
    </Helmet>
  );
}
