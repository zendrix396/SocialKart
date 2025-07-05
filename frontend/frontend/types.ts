export interface ProductListing {
  title: string;
  price: string;
  description: string;
  features: string[];
  category: string;
  rating: number;
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
