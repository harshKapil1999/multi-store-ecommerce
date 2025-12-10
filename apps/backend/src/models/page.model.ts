import mongoose, { Schema, Document } from 'mongoose';

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

export interface IPage extends Document {
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

const pageSectionSchema = new Schema<IPageSection>({
  type: {
    type: String,
    required: true,
    enum: ['hero', 'billboard', 'featured_products', 'featured_categories', 'product_grid', 'category_grid', 'text_content', 'custom_html'],
  },
  title: String,
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  
  // Billboard Section
  billboardId: String,
  
  // Featured Products Section
  productIds: [String],
  productsLimit: Number,
  showFeaturedOnly: Boolean,
  categoryFilter: String,
  
  // Featured Categories Section
  categoryIds: [String],
  categoriesLimit: Number,
  
  // Text Content Section
  content: String,
  
  // Custom HTML Section
  html: String,
  
  // Layout options
  layout: {
    type: String,
    enum: ['grid', 'carousel', 'list', 'masonry'],
    default: 'grid',
  },
  columns: {
    type: Number,
    default: 3,
  },
  backgroundColor: String,
  padding: String,
}, { _id: true });

const pageSchema = new Schema<IPage>(
  {
    storeId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: String,
    metaTitle: String,
    metaDescription: String,
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isHomePage: {
      type: Boolean,
      default: false,
      index: true,
    },
    sections: [pageSectionSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for store and slug (unique per store)
pageSchema.index({ storeId: 1, slug: 1 }, { unique: true });

// Index for finding home pages
pageSchema.index({ storeId: 1, isHomePage: 1 });

// Ensure only one home page per store
pageSchema.pre('save', async function (next) {
  if (this.isHomePage && this.isModified('isHomePage')) {
    // Unset other home pages for this store
    await Page.updateMany(
      { storeId: this.storeId, _id: { $ne: this._id } },
      { $set: { isHomePage: false } }
    );
  }
  next();
});

export const Page = mongoose.model<IPage>('Page', pageSchema);
