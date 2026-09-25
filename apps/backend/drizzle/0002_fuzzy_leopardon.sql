ALTER TABLE "order" ALTER COLUMN "subtotal" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "tax" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "shipping" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "discount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "total" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "mrp" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "sellingPrice" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "price" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "compareAtPrice" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "billboard" ADD CONSTRAINT "billboard_storeId_store__id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."store"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_storeId_store__id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."store"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_category__id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."category"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscriber" ADD CONSTRAINT "newsletter_subscriber_storeId_store__id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."store"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_storeId_store__id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."store"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page" ADD CONSTRAINT "page_storeId_store__id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."store"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_storeId_store__id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."store"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_categoryId_category__id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productId_product__id_fk" FOREIGN KEY ("productId") REFERENCES "public"."product"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_orderId_order__id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."order"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_storeId_store__id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."store"("_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_customer_email_idx" ON "order" USING btree (lower("customer"->>'email'));--> statement-breakpoint
CREATE INDEX "order_customer_user_idx" ON "order" USING btree (("customer"->>'userId'));--> statement-breakpoint
CREATE INDEX "order_store_created_idx" ON "order" USING btree ("storeId","createdAt");--> statement-breakpoint
CREATE INDEX "product_catalog_idx" ON "product" USING btree ("storeId","isActive","categoryId","createdAt");--> statement-breakpoint
CREATE INDEX "product_search_idx" ON "product" USING gin (to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("description", '')));