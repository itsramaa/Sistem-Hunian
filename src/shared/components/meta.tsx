import { Helmet } from 'react-helmet-async';

interface MetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function Meta({ 
  title = 'Sistem Hunian', 
  description = 'Platform manajemen properti terintegrasi',
  image = '/placeholder.svg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website'
}: MetaProps) {
  const siteTitle = title === 'Sistem Hunian' ? title : `${title} | Sistem Hunian`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{siteTitle}</title>
      <meta name='description' content={description} />
      
      {/* Open Graph tags (Facebook, LinkedIn, etc.) */}
      <meta property='og:title' content={siteTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={image} />
      <meta property='og:url' content={url} />
      <meta property='og:type' content={type} />
      
      {/* Twitter tags */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={siteTitle} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={image} />
    </Helmet>
  );
}
