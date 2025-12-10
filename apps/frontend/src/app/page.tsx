import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              E-Commerce
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/stores" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Stores
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-white/90 transition-all font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 items-center justify-center flex relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-transparent opacity-50" />
          <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-black to-transparent" />
        </div>

        <div className="container relative z-10 px-4 py-32 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-xl mb-8">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse" />
            v2.0 is now live
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 max-w-4xl">
            The Future of <br />
            Digital Commerce
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
            A powerful, multi-store ecommerce platform designed for scale. 
            Build, manage, and grow your digital empire with our next-generation tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-8 text-sm font-medium text-white transition-all hover:bg-indigo-500 hover:scale-105 shadow-lg shadow-indigo-500/25 w-full sm:w-40"
            >
              Browse Products
            </Link>
            <Link
              href="/stores"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-8 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10 w-full sm:w-40"
            >
              View Stores
            </Link>
          </div>

          <div className="mt-20 relative w-full max-w-5xl aspect-[16/9] rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-2 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-lg" />
            <div className="w-full h-full rounded-lg bg-black/40 flex items-center justify-center border border-white/5">
              <span className="text-muted-foreground text-sm">Dashboard Preview</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} E-Commerce Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
