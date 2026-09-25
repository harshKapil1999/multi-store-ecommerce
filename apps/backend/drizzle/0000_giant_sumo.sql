CREATE TABLE "billboard" (
	"storeId" text NOT NULL,
	"categoryId" text,
	"title" text NOT NULL,
	"subtitle" text,
	"imageUrl" text NOT NULL,
	"ctaText" text,
	"ctaLink" text,
	"order" double precision DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"storeId" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"imageUrl" text,
	"parentId" text,
	"isFeatured" boolean DEFAULT false,
	"order" double precision DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"billboards" jsonb DEFAULT '[]'::jsonb,
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriber" (
	"storeId" text NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'subscribed',
	"consentAt" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'storefront_home',
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscriber_status_enum" CHECK ("newsletter_subscriber"."status" in ('subscribed', 'unsubscribed'))
);
--> statement-breakpoint
CREATE TABLE "order" (
	"checkoutKey" text,
	"checkoutFingerprint" text,
	"paymentCreationStartedAt" timestamp with time zone,
	"inventoryStatus" text DEFAULT 'uncommitted',
	"storeId" text NOT NULL,
	"orderNumber" text NOT NULL,
	"customer" jsonb,
	"items" jsonb DEFAULT '[]'::jsonb,
	"subtotal" double precision NOT NULL,
	"tax" double precision DEFAULT 0,
	"shipping" double precision DEFAULT 0,
	"discount" double precision DEFAULT 0,
	"total" double precision NOT NULL,
	"status" text DEFAULT 'pending',
	"paymentStatus" text DEFAULT 'pending',
	"paymentMethod" text,
	"transactionId" text,
	"razorpayOrderId" text,
	"shippingAddress" jsonb,
	"billingAddress" jsonb,
	"fulfillment" jsonb,
	"statusHistory" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_inventoryStatus_enum" CHECK ("order"."inventoryStatus" in ('uncommitted', 'committed', 'released', 'review')),
	CONSTRAINT "order_status_enum" CHECK ("order"."status" in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
	CONSTRAINT "order_paymentStatus_enum" CHECK ("order"."paymentStatus" in ('pending', 'paid', 'failed', 'refunded'))
);
--> statement-breakpoint
CREATE TABLE "otp" (
	"attempts" double precision DEFAULT 0,
	"email" text NOT NULL,
	"otp" text NOT NULL,
	"type" text DEFAULT 'login',
	"expiresAt" timestamp with time zone NOT NULL,
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "otp_type_enum" CHECK ("otp"."type" in ('login', 'register', 'order_confirmation'))
);
--> statement-breakpoint
CREATE TABLE "page" (
	"storeId" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"metaTitle" text,
	"metaDescription" text,
	"isPublished" boolean DEFAULT false,
	"isHomePage" boolean DEFAULT false,
	"sections" jsonb DEFAULT '[]'::jsonb,
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"storeId" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '',
	"featuredImage" text NOT NULL,
	"mediaGallery" jsonb DEFAULT '[]'::jsonb,
	"mrp" double precision NOT NULL,
	"sellingPrice" double precision NOT NULL,
	"categoryId" text NOT NULL,
	"attributes" jsonb DEFAULT '[]'::jsonb,
	"isFeatured" boolean DEFAULT false,
	"sku" text,
	"isActive" boolean DEFAULT true,
	"stock" double precision DEFAULT 0 NOT NULL,
	"hasVariants" boolean DEFAULT false,
	"variantOptions" jsonb DEFAULT '[]'::jsonb,
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_stock_nonnegative" CHECK ("product"."stock" >= 0),
	CONSTRAINT "product_mrp_nonnegative" CHECK ("product"."mrp" >= 0),
	CONSTRAINT "product_sellingPrice_nonnegative" CHECK ("product"."sellingPrice" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"productId" text NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"price" double precision NOT NULL,
	"compareAtPrice" double precision DEFAULT 0,
	"stock" double precision DEFAULT 0 NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb,
	"featuredImageIndex" double precision DEFAULT 0,
	"attributes" jsonb NOT NULL,
	"isActive" boolean DEFAULT true,
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variant_stock_nonnegative" CHECK ("product_variant"."stock" >= 0),
	CONSTRAINT "product_variant_price_nonnegative" CHECK ("product_variant"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "store" (
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"domain" text,
	"description" text,
	"logo" text,
	"owner" text,
	"commerce" jsonb,
	"seo" jsonb,
	"theme" jsonb,
	"navigation" jsonb DEFAULT '[]'::jsonb,
	"footer" jsonb,
	"topBar" jsonb,
	"isActive" boolean DEFAULT true,
	"homeBillboards" jsonb DEFAULT '[]'::jsonb,
	"homeSections" jsonb DEFAULT '[]'::jsonb,
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"refundError" text,
	"refundPending" boolean DEFAULT false,
	"refundId" text,
	"orderId" text NOT NULL,
	"storeId" text NOT NULL,
	"razorpayOrderId" text NOT NULL,
	"razorpayPaymentId" text,
	"razorpaySignature" text,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'created',
	"method" text,
	"email" text,
	"phone" text,
	"notes" jsonb,
	"errorCode" text,
	"errorDescription" text,
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_status_enum" CHECK ("transaction"."status" in ('created', 'authorized', 'captured', 'failed', 'refunded')),
	CONSTRAINT "transaction_amount_nonnegative" CHECK ("transaction"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'customer',
	"addresses" jsonb DEFAULT '[]'::jsonb,
	"_id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_role_enum" CHECK ("user"."role" in ('customer', 'admin', 'store_owner'))
);
--> statement-breakpoint
CREATE INDEX "billboard_idx_0" ON "billboard" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "billboard_idx_1" ON "billboard" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "billboard_idx_2" ON "billboard" USING btree ("order");--> statement-breakpoint
CREATE INDEX "billboard_idx_3" ON "billboard" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "billboard_idx_4" ON "billboard" USING btree ("storeId","order");--> statement-breakpoint
CREATE INDEX "category_idx_0" ON "category" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "category_idx_1" ON "category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "category_idx_2" ON "category" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "category_idx_3" ON "category" USING btree ("isFeatured");--> statement-breakpoint
CREATE INDEX "category_idx_4" ON "category" USING btree ("order");--> statement-breakpoint
CREATE INDEX "category_idx_5" ON "category" USING btree ("isActive");--> statement-breakpoint
CREATE UNIQUE INDEX "category_idx_6" ON "category" USING btree ("storeId","slug");--> statement-breakpoint
CREATE INDEX "newsletter_subscriber_idx_0" ON "newsletter_subscriber" USING btree ("storeId");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscriber_idx_1" ON "newsletter_subscriber" USING btree ("storeId","email");--> statement-breakpoint
CREATE UNIQUE INDEX "order_idx_0" ON "order" USING btree ("checkoutKey");--> statement-breakpoint
CREATE INDEX "order_idx_1" ON "order" USING btree ("storeId");--> statement-breakpoint
CREATE UNIQUE INDEX "order_idx_2" ON "order" USING btree ("orderNumber");--> statement-breakpoint
CREATE INDEX "order_idx_3" ON "order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_idx_4" ON "order" USING btree ("paymentStatus");--> statement-breakpoint
CREATE INDEX "order_idx_5" ON "order" USING btree ("transactionId");--> statement-breakpoint
CREATE INDEX "order_idx_6" ON "order" USING btree ("razorpayOrderId");--> statement-breakpoint
CREATE INDEX "otp_idx_0" ON "otp" USING btree ("email");--> statement-breakpoint
CREATE INDEX "otp_idx_1" ON "otp" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "otp_idx_2" ON "otp" USING btree ("email","type");--> statement-breakpoint
CREATE INDEX "page_idx_0" ON "page" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "page_idx_1" ON "page" USING btree ("isPublished");--> statement-breakpoint
CREATE INDEX "page_idx_2" ON "page" USING btree ("isHomePage");--> statement-breakpoint
CREATE UNIQUE INDEX "page_idx_3" ON "page" USING btree ("storeId","slug");--> statement-breakpoint
CREATE INDEX "page_idx_4" ON "page" USING btree ("storeId","isHomePage");--> statement-breakpoint
CREATE UNIQUE INDEX "page_one_home_per_store" ON "page" USING btree ("storeId") WHERE "page"."isHomePage" = true;--> statement-breakpoint
CREATE INDEX "product_idx_0" ON "product" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "product_idx_1" ON "product" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_idx_2" ON "product" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "product_idx_3" ON "product" USING btree ("isFeatured");--> statement-breakpoint
CREATE INDEX "product_idx_4" ON "product" USING btree ("isActive");--> statement-breakpoint
CREATE UNIQUE INDEX "product_idx_5" ON "product" USING btree ("storeId","slug");--> statement-breakpoint
CREATE INDEX "product_variant_idx_0" ON "product_variant" USING btree ("productId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_idx_1" ON "product_variant" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variant_idx_2" ON "product_variant" USING btree ("productId","attributes");--> statement-breakpoint
CREATE UNIQUE INDEX "store_idx_0" ON "store" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "store_idx_1" ON "store" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "store_idx_2" ON "store" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "store_idx_3" ON "store" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "transaction_idx_0" ON "transaction" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "transaction_idx_1" ON "transaction" USING btree ("storeId");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_idx_2" ON "transaction" USING btree ("razorpayOrderId");--> statement-breakpoint
CREATE INDEX "transaction_idx_3" ON "transaction" USING btree ("razorpayPaymentId");--> statement-breakpoint
CREATE INDEX "transaction_idx_4" ON "transaction" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_idx_0" ON "user" USING btree ("email");