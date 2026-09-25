CREATE TABLE "shipment" (
	"order_id" text PRIMARY KEY NOT NULL,
	"provider_order_id" text,
	"provider_shipment_id" text,
	"state" text DEFAULT 'creating' NOT NULL,
	"operation" text,
	"parcel" jsonb NOT NULL,
	"awb" text,
	"courier" text,
	"label_url" text,
	"pickup_scheduled" boolean DEFAULT false NOT NULL,
	"last_event_at" timestamp (3) with time zone,
	"last_status" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipment_provider_order_id_unique" UNIQUE("provider_order_id"),
	CONSTRAINT "shipment_provider_shipment_id_unique" UNIQUE("provider_shipment_id"),
	CONSTRAINT "shipment_awb_unique" UNIQUE("awb")
);
--> statement-breakpoint
ALTER TABLE "billboard" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "billboard" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "billboard" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "billboard" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "newsletter_subscriber" ALTER COLUMN "consentAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "newsletter_subscriber" ALTER COLUMN "consentAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "newsletter_subscriber" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "newsletter_subscriber" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "newsletter_subscriber" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "newsletter_subscriber" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "paymentCreationStartedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "otp" ALTER COLUMN "expiresAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "otp" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "otp" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "otp" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "otp" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "store" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "store" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "store" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "store" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_order_id_order__id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("_id") ON DELETE no action ON UPDATE no action;