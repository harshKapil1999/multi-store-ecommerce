'use client';

import { useSelectedStore } from '@/contexts/store-context';
import { useStores } from '@/hooks/useStores';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Card, Button } from '@/components/index';
import Link from 'next/link';
import { Package, Grid3x3, Image, ShoppingCart, Plus, AlertCircle, Loader2, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { selectedStoreId } = useSelectedStore();
  const { data: stores, isLoading: storesLoading, error: storesError } = useStores(1, 1);
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts(
    selectedStoreId || '',
    { limit: 5, page: 1 }
  );
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories(
    selectedStoreId || ''
  );

  // Safely extract data with fallbacks
  const storeCount = stores?.pagination?.total || stores?.data?.length || 0;
  const productCount = products?.pagination?.total || products?.data?.length || 0;
  const categoryCount = categories?.pagination?.total || categories?.data?.length || 0;
  const productsList = Array.isArray(products?.data) ? products.data : [];

  // Show error state if any critical data fetch fails
  if (storesError || (productsError && selectedStoreId) || (categoriesError && selectedStoreId)) {
    return (
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store performance</p>
        </div>
        <Card className="p-8 text-center border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/50">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {storesError?.message || productsError?.message || categoriesError?.message || 
             'Unable to load dashboard data. Please try refreshing the page.'}
          </p>
          <Button onClick={() => window.location.reload()} variant="destructive">
            Refresh Page
          </Button>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (storesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'New Product',
      description: 'Add to catalog',
      href: '/dashboard/products',
      icon: Package,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'New Category',
      description: 'Create category',
      href: '/dashboard/categories',
      icon: Grid3x3,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'New Billboard',
      description: 'Create banner',
      href: '/dashboard/billboards',
      icon: Image,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'View Orders',
      description: 'Manage orders',
      href: '/dashboard/orders',
      icon: ShoppingCart,
      gradient: 'from-orange-500 to-amber-500',
    },
  ];

  const stats = [
    {
      title: 'Total Stores',
      value: storeCount,
      description: storeCount === 0 ? 'Start your journey' : 'Active & running',
      loading: storesLoading,
      icon: TrendingUp,
    },
    {
      title: 'Products',
      value: productCount,
      description: productCount === 0 ? 'No products' : 'In current store',
      loading: productsLoading && selectedStoreId,
      icon: Package,
    },
    {
      title: 'Categories',
      value: categoryCount,
      description: categoryCount === 0 ? 'No categories' : 'Organized Items',
      loading: categoriesLoading && selectedStoreId,
      icon: Grid3x3,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {selectedStoreId
              ? 'Here\'s what\'s happening with your store today.'
              : 'Select a store to view analytics and manage content.'}
          </p>
        </div>
      </div>

      {storeCount === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 bg-gradient-to-b from-background to-muted/20">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Start Your Empire</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            You haven't created any stores yet. Create your first store to start managing products, categories, and orders.
          </p>
          <Link href="/dashboard/stores">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Create First Store
            </Button>
          </Link>
        </Card>
      ) : !selectedStoreId ? (
        <Card className="p-12 text-center border-2 border-dashed">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Store Selected</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Select a store from the header dropdown to begin managing your ecosystem.
          </p>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="p-6 overflow-hidden relative group hover:shadow-lg transition-all duration-300 border-border/50">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className="h-24 w-24" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <p className="text-4xl font-bold tracking-tight">
                        {stat.loading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {stat.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} className="group">
                    <div className="relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-xl hover:-translate-y-1">
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                      <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${action.gradient} p-2.5 text-white shadow-lg mb-4`}>
                        <Icon className="h-full w-full" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Products */}
          <div className="grid gap-6">
            {productsLoading && (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            )}
            
            {!productsLoading && productsList.length > 0 && (
              <Card className="overflow-hidden border-border/50 shadow-sm">
                <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/20">
                  <div>
                    <h2 className="text-lg font-bold">Recent Products</h2>
                    <p className="text-sm text-muted-foreground">Latest additions to your catalog</p>
                  </div>
                  <Link href="/dashboard/products">
                    <Button variant="outline" size="sm" className="hover:bg-background">View All</Button>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/10">
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {productsList.slice(0, 5).map((product: any) => (
                        <tr key={product._id || product.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium">
                            {product.name || 'Unnamed Product'}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                            ₹{product.sellingPrice || product.price || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {product.stock || 0} units
                          </td>
                          <td className="px-6 py-4 text-right text-sm">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              (product.stock || 0) > 0 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {(product.stock || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {!productsLoading && productsList.length === 0 && (
              <Card className="p-16 text-center border-dashed border-2 bg-muted/10">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">No Products Yet</h2>
                <p className="text-muted-foreground mb-8 text-sm max-w-sm mx-auto">
                  Your store is empty. Start building your catalog by adding your first product.
                </p>
                <Link href="/dashboard/products">
                  <Button className="rounded-full shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Product
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
