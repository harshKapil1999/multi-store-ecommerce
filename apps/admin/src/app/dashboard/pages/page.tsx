'use client';

import { useSelectedStore } from '@/contexts/store-context';
import { usePages, useDeletePage, useTogglePublish } from '@/hooks/usePages';
import { Card, Button } from '@/components/index';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, EyeOff, Home, Loader2, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function PagesPage() {
  const { selectedStoreId } = useSelectedStore();
  const { data: pagesData, isLoading } = usePages(selectedStoreId || '');
  const deletePage = useDeletePage(selectedStoreId || '');
  const togglePublish = useTogglePublish(selectedStoreId || '');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pages = Array.isArray(pagesData?.data) ? pagesData.data : [];

  const handleDelete = async (pageId: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    setDeletingId(pageId);
    try {
      await deletePage.mutateAsync(pageId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (pageId: string) => {
    await togglePublish.mutateAsync(pageId);
  };

  if (!selectedStoreId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Please select a store to manage pages</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">
            Create and manage dynamic pages for your store
          </p>
        </div>
        <Link href={`/dashboard/pages/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : pages.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first page to start customizing your store
          </p>
          <Link href="/dashboard/pages/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Page
            </Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                    Sections
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page: any) => (
                  <tr key={page._id} className="border-b hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {page.isHomePage && (
                          <Home className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="font-medium">{page.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      /{page.slug}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {page.sections?.length || 0} section(s)
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          page.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {page.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {page.isHomePage ? 'Home Page' : 'Regular Page'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const pageUrl = page.isHomePage 
                              ? `${window.location.origin}/stores/${selectedStoreId}`
                              : `${window.location.origin}/stores/${selectedStoreId}/${page.slug}`;
                            window.open(pageUrl, '_blank', 'noopener,noreferrer');
                          }}
                          title="View page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(page._id)}
                          title={page.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {page.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Link href={`/dashboard/pages/${page._id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(page._id)}
                          disabled={deletingId === page._id}
                        >
                          {deletingId === page._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
