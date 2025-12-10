'use client';

import { useSelectedStore } from '@/contexts/store-context';
import { usePage, useUpdatePage, useAddSection, useDeleteSection, useReorderSections } from '@/hooks/usePages';
import { useBillboards } from '@/hooks/useBillboards';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Card, Button } from '@/components/index';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical, 
  Eye, 
  EyeOff,
  Save,
  Loader2
} from 'lucide-react';
import type { PageSection, SectionType, AddPageSectionInput } from '@repo/types';

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  const { selectedStoreId } = useSelectedStore();
  
  const { data: pageData, isLoading } = usePage(selectedStoreId || '', pageId);
  const { data: billboardsData } = useBillboards(selectedStoreId || '');
  const { data: productsData } = useProducts(selectedStoreId || '', { limit: 100 });
  const { data: categoriesData } = useCategories(selectedStoreId || '');
  
  const updatePage = useUpdatePage(selectedStoreId || '', pageId);
  const addSection = useAddSection(selectedStoreId || '', pageId);
  const deleteSection = useDeleteSection(selectedStoreId || '', pageId);
  const reorderSections = useReorderSections(selectedStoreId || '', pageId);

  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [isHomePage, setIsHomePage] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const page = pageData?.data;
  const billboards = Array.isArray(billboardsData?.data) ? billboardsData.data : [];
  const products = Array.isArray(productsData?.data?.data) ? productsData.data.data : [];
  const categories = Array.isArray(categoriesData?.data?.data) ? categoriesData.data.data : [];

  // Initialize form when page data loads
  useState(() => {
    if (page) {
      setPageTitle(page.title);
      setPageSlug(page.slug);
      setPageDescription(page.description || '');
      setIsHomePage(page.isHomePage);
    }
  });

  const handleSavePageInfo = async () => {
    await updatePage.mutateAsync({
      title: pageTitle,
      slug: pageSlug,
      description: pageDescription,
      isHomePage,
    });
  };

  const handleAddSection = async (sectionData: AddPageSectionInput) => {
    await addSection.mutateAsync(sectionData);
    setShowAddSection(false);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    await deleteSection.mutateAsync(sectionId);
  };

  if (!selectedStoreId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Page Editor</h1>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Please select a store</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">The page you're looking for doesn't exist</p>
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
          <h1 className="text-3xl font-bold">Edit Page</h1>
          <p className="text-muted-foreground">Customize page content and layout</p>
        </div>
      </div>

      {/* Page Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Page Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Page title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input
              type="text"
              value={pageSlug}
              onChange={(e) => setPageSlug(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="page-slug"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={pageDescription}
              onChange={(e) => setPageDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Page description"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isHomePage"
              checked={isHomePage}
              onChange={(e) => setIsHomePage(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isHomePage" className="text-sm font-medium">
              Set as Home Page
            </label>
          </div>
          <Button onClick={handleSavePageInfo} disabled={updatePage.isPending}>
            {updatePage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Page Info
          </Button>
        </div>
      </Card>

      {/* Sections */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Page Sections</h2>
          <Button onClick={() => setShowAddSection(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>

        {page.sections?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No sections yet. Add your first section to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {page.sections?.map((section: PageSection) => (
              <div key={section._id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{section.title || 'Untitled Section'}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {section.type}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {section.type === 'billboard' && section.billboardId && (
                          <span>Billboard: {billboards.find((b: any) => b._id === section.billboardId)?.title}</span>
                        )}
                        {section.type === 'featured_products' && (
                          <span>
                            {section.productIds?.length || 0} selected products
                            {section.showFeaturedOnly && ' (Featured only)'}
                          </span>
                        )}
                        {section.type === 'featured_categories' && (
                          <span>
                            {section.categoryIds?.length || 0} selected categories
                          </span>
                        )}
                        {section.type === 'text_content' && (
                          <span>Text content section</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      {section.isVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSection(section._id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Section Modal - Simplified for now */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Section</h3>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a section type to add to your page
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(['billboard', 'featured_products', 'featured_categories', 'text_content'] as SectionType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      handleAddSection({
                        type,
                        title: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        isVisible: true,
                      });
                    }}
                    className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="font-medium capitalize">{type.replace('_', ' ')}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Add a {type.replace('_', ' ')} section
                    </div>
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={() => setShowAddSection(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
