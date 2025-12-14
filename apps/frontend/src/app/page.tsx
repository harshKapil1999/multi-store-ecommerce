import { api } from '@/lib/api';
import { Store } from '@repo/types';
import Link from 'next/link';
import { ArrowRight, Store as StoreIcon } from 'lucide-react';

async function getStores() {
  try {
    const response = await api.get<{ data: Store[] }>('/stores');
    return (response.data || []).filter((s: Store) => s.isActive);
  } catch (error) {
    console.error('Failed to fetch stores:', error);
    return [];
  }
}

export default async function Home() {
  const stores = await getStores();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-transparent to-transparent" />
        <div className="container mx-auto px-6 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm text-gray-300">{stores.length} Active Stores</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Multi-Store
              </span>
              <br />
              <span className="text-white">E-Commerce Platform</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
              Discover our collection of premium stores. Each store offers a unique shopping experience tailored just for you.
            </p>
          </div>
        </div>
      </header>

      {/* Stores Grid */}
      <main className="container mx-auto px-6 pb-24">
        {stores.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
              <StoreIcon className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-300">No Stores Available</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              There are no active stores at the moment. Please check back later or contact the administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store, index) => (
              <Link 
                key={store._id} 
                href={`/${store.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-white/5 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-white/5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background Gradient Animation */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative p-8">
                  {/* Logo */}
                  <div className="h-16 mb-6 flex items-center">
                    {store.logo ? (
                      <img 
                        src={store.logo} 
                        alt={store.name} 
                        className="h-full w-auto object-contain filter group-hover:brightness-110 transition-all duration-300" 
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                        <span className="text-2xl font-black text-white/80">
                          {store.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Store Info */}
                  <h2 className="text-xl font-bold mb-2 text-white group-hover:text-gray-100 transition-colors">
                    {store.name}
                  </h2>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6 min-h-[2.5rem]">
                    {store.description || 'Explore our collection of premium products.'}
                  </p>
                  
                  {/* CTA */}
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                    <span>Visit Store</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} E-Commerce Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
