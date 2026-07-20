'use client';

import { useSelectedStore } from '@/contexts/store-context';
import { useCreatePage } from '@/hooks/usePages';
import { Card, Button, Checkbox, Input, Textarea } from '@/components/index';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { PAGE_TEMPLATES } from '@/lib/page-templates';

export default function NewPagePage() {
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const createPage = useCreatePage(selectedStoreId || '');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isHomePage, setIsHomePage] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStoreId) return;

    try {
      const result = await createPage.mutateAsync({
        title,
        slug,
        description,
        isHomePage,
        metaTitle: title,
        metaDescription: description,
        isPublished,
        sections: content ? [{ type: 'text_content', title, content, order: 0, isVisible: true }] : [],
      });

      if (result?.data?._id) {
        router.push(`/dashboard/pages/${result.data._id}`);
      }
    } catch {
      // The mutation displays the backend message as a toast.
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

  const applyTemplate = (key: keyof typeof PAGE_TEMPLATES) => {
    const template = PAGE_TEMPLATES[key];
    setTitle(template.title);
    setSlug(template.slug);
    setDescription(template.description);
    setContent(template.content);
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
            <p className="mb-3 text-sm font-medium">Start from a template</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => applyTemplate('privacy')}>Privacy Policy</Button>
              <Button type="button" variant="outline" onClick={() => applyTemplate('terms')}>Terms &amp; Conditions</Button>
              <Button type="button" variant="outline" onClick={() => applyTemplate('returns')}>Returns &amp; Refunds</Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Templates are a starting point. Review dates, return windows, and legal details before publishing.</p>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Page Title *
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., About Us, Contact, New Collection"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Page Content</label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              Slug (URL) *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <Input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                className="flex-1"
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
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="A brief description of this page (for SEO)"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isHomePage"
              checked={isHomePage}
              onCheckedChange={(checked) => setIsHomePage(checked === true)}
            />
            <label htmlFor="isHomePage" className="text-sm font-medium">
              Set as Home Page
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isPublished"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked === true)}
            />
            <label htmlFor="isPublished" className="text-sm font-medium">Publish immediately</label>
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
