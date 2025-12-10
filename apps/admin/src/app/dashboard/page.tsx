'use client';

import { useSelectedStore } from '@/contexts/store-context';
import { useStores } from '@/hooks/useStores';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Card, Button } from '@/components/index';
import Link from 'next/link';
import { Package, Grid3x3, Image, ShoppingCart, Plus, AlertCircle, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { selectedStoreId } = useSelectedStore();
  const { data: stores, isLoading: storesLoading, error: storesError } = useStores(1, 1);
  console.log(stores);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your store dashboard</p>
        </div>
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Data</h2>
          <p className="text-red-700 mb-4">
            {storesError?.message || productsError?.message || categoriesError?.message || 
             'Unable to load dashboard data. Please try refreshing the page.'}
          </p>
          <Button onClick={() => window.location.reload()}>
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
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'New Product',
      description: 'Add a new product to your catalog',
      href: '/dashboard/products',
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'New Category',
      description: 'Create a new product category',
      href: '/dashboard/categories',
      icon: Grid3x3,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'New Billboard',
      description: 'Create a promotional banner',
      href: '/dashboard/billboards',
      icon: Image,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'View Orders',
      description: 'Manage incoming orders',
      href: '/dashboard/orders',
      icon: ShoppingCart,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  const stats = [
    {
      title: 'Total Stores',
      value: storeCount,
      description: storeCount === 0 ? 'Create your first store' : 'Active stores',
      loading: storesLoading,
    },
    {
      title: 'Total Products',
      value: productCount,
      description: productCount === 0 ? 'No products yet' : 'In current store',
      loading: productsLoading && selectedStoreId,
    },
    {
      title: 'Total Categories',
      value: categoryCount,
      description: categoryCount === 0 ? 'No categories yet' : 'In current store',
      loading: categoriesLoading && selectedStoreId,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {selectedStoreId
            ? 'Welcome to your store dashboard'
            : storeCount === 0 
            ? 'Create your first store to get started'
            : 'Select a store to get started'}
        </p>
      </div>

      {storeCount === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Stores Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first store to start managing products, categories, and orders.
          </p>
          <Link href="/dashboard/stores">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Store
            </Button>
          </Link>
        </Card>
      ) : !selectedStoreId ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Store Selected</h2>
          <p className="text-muted-foreground mb-6">
            Select a store from the header to begin managing your products, categories, and
            orders.
          </p>
          <Link href="/dashboard/stores">
            <Button>Manage Stores</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="p-6">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">
                  {stat.loading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Products */}
          {productsLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          )}
          
          {!productsLoading && productsList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recent Products</h2>
                <Link href="/dashboard/products">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsList.slice(0, 5).map((product: any) => (
                        <tr key={product._id || product.id} className="border-b hover:bg-muted/50">
                          <td className="px-6 py-4 text-sm">{product.name || 'Unnamed Product'}</td>
                          <td className="px-6 py-4 text-sm">
                            ₹{product.sellingPrice || product.price || 0}
                          </td>
                          <td className="px-6 py-4 text-sm">{product.stock || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {!productsLoading && productsList.length === 0 && (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">No Products Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start building your catalog by adding your first product.
              </p>
              <Link href="/dashboard/products">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
