import { Helmet } from 'react-helmet-async';

type JsonLdSchema = Record<string, unknown>;

interface JsonLdProps {
  schema: JsonLdSchema | JsonLdSchema[];
}

export function JsonLd({ schema }: JsonLdProps) {
  const jsonString = JSON.stringify(
    Array.isArray(schema) ? schema : schema,
    null,
    0
  );

  return (
    <Helmet>
      <script type="application/ld+json">{jsonString}</script>
    </Helmet>
  );
}

// Pre-built schemas
export const softwareApplicationSchema: JsonLdSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SiHuni",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Platform manajemen properti terintegrasi untuk pemilik kos, kontrakan, dan apartemen di Indonesia. Dilengkapi DSS (Decision Support System) dengan OCR, AI Advisor, dan Risk Scoring.",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "IDR",
    "lowPrice": "0",
    "highPrice": "499000",
    "offerCount": "4"
  },
  "featureList": [
    "Manajemen Properti",
    "Penagihan Otomatis",
    "Escrow Payment",
    "OCR Dokumen",
    "AI Advisor",
    "Risk Scoring",
    "Maintenance Management"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "500"
  }
};

export const organizationSchema: JsonLdSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SiHuni",
  "url": "https://sihuni.app",
  "logo": "https://sihuni.app/logo.png",
  "description": "SiHuni adalah platform manajemen properti terlengkap di Indonesia.",
  "foundingDate": "2024",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "ID"
  },
  "sameAs": []
};
