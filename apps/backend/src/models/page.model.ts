import { createRepository, Entity } from '../db/repository';
import { PageTable } from '../db/schema';

// Page Section Types
export type SectionType = 'hero' | 'billboard' | 'featured_products' | 'featured_categories' | 'product_grid' | 'category_grid' | 'text_content' | 'custom_html';

export interface IPageSection {
  _id: string;
  type: SectionType;
  title?: string;
  order: number;
  isVisible: boolean;
  
  // Billboard Section
  billboardId?: string;
  
  // Featured Products Section
  productIds?: string[];
  productsLimit?: number;
  showFeaturedOnly?: boolean;
  categoryFilter?: string;
  
  // Featured Categories Section
  categoryIds?: string[];
  categoriesLimit?: number;
  
  // Text Content Section
  content?: string;
  
  // Custom HTML Section
  html?: string;
  
  // Layout options
  layout?: 'grid' | 'carousel' | 'list' | 'masonry';
  columns?: number;
  backgroundColor?: string;
  padding?: string;
}

export interface IPage extends Entity {
  storeId: string;
  title: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  isHomePage: boolean;
  sections: IPageSection[];
  createdAt: Date;
  updatedAt: Date;
}


export const Page = createRepository<IPage>('Page', PageTable);
