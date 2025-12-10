export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full items-center justify-between text-center">
        <h1 className="text-6xl font-bold mb-4">E-Commerce Store</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Multi-store ecommerce platform - Customer Frontend
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/products"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Browse Products
          </a>
          <a
            href="/stores"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            View Stores
          </a>
        </div>
      </div>
    </div>
  );
}
