export interface ProductListing {
  title: string;
  price: string;
  description: string;
  features: string[];
  category: string;
  rating: number;
}

export interface BackendResult {
  structured_content: {
    product_name: string;
    description: string;
    key_features: string[];
    target_audience: string;
    seo_keywords: string[];
    technical_details: Record<string, any>;
    technical_details_schema: { category: string; properties: Record<string, any> };
  };
  images: string[];
  request_id: string;
  expiration_timestamp: string;
  expires_in_seconds: number;
}

export enum SocialPlatform {
  INSTAGRAM = 'Instagram',
  YOUTUBE = 'YouTube',
  SEARCH = 'Product Search'
}

export interface FeatureItemProps {
  title: string;
  description: string;
  items: string[];
  delay?: number;
}

