'use client';

import { useSelectedStore } from '@/contexts/store-context';
import { useCreatePage } from '@/hooks/usePages';
import { Card, Button } from '@/components/index';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewPagePage() {
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const createPage = useCreatePage(selectedStoreId || '');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isHomePage, setIsHomePage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStoreId) return;

    const result = await createPage.mutateAsync({
      title,
      slug,
      description,
      isHomePage,
      isPublished: false,
      sections: [],
    });

    if (result?.data?._id) {
      router.push(`/dashboard/pages/${result.data._id}`);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
  };

  if (!selectedStoreId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Create New Page</h1>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Please select a store first</p>
          <Button onClick={() => router.push('/dashboard/pages')} className="mt-4">
            Back to Pages
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/pages')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Page</h1>
          <p className="text-muted-foreground">Add a new page to your store</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Page Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., About Us, Contact, New Collection"
              required
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              Slug (URL) *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="about-us"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This will be the URL path for your page
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="A brief description of this page (for SEO)"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isHomePage"
              checked={isHomePage}
              onChange={(e) => setIsHomePage(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isHomePage" className="text-sm font-medium">
              Set as Home Page
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createPage.isPending || !title || !slug}
            >
              {createPage.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Page'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/pages')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
