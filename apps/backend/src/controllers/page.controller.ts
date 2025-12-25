import { Request, Response } from 'express';
import { Page } from '../models/page.model';
import type { CreatePageInput, UpdatePageInput, AddPageSectionInput, UpdatePageSectionInput } from '@repo/types';

/**
 * Get all pages for a store
 */
export const getPages = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { published } = req.query;

    const query: any = { storeId };

    if (published !== undefined) {
      query.isPublished = published === 'true';
    }

    const pages = await Page.find(query).sort({ isHomePage: -1, createdAt: -1 });

    res.json({
      success: true,
      data: pages,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pages',
      error: error.message,
    });
  }
};

/**
 * Get a single page by ID
 */
export const getPage = async (req: Request, res: Response) => {
  try {
    const { storeId, pageId } = req.params;

    const page = await Page.findOne({ _id: pageId, storeId });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    res.json({
      success: true,
      data: page,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch page',
      error: error.message,
    });
  }
};

/**
 * Get page by slug
 */
export const getPageBySlug = async (req: Request, res: Response) => {
  try {
    const { storeId, slug } = req.params;

    const page = await Page.findOne({ storeId, slug, isPublished: true });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    res.json({
      success: true,
      data: page,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch page',
      error: error.message,
    });
  }
};

/**
 * Get home page for a store
 */
export const getHomePage = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    const page = await Page.findOne({ storeId, isHomePage: true, isPublished: true });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found',
      });
    }

    res.json({
      success: true,
      data: page,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home page',
      error: error.message,
    });
  }
};

/**
 * Create a new page
 */
export const createPage = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const pageData: CreatePageInput = req.body;

    const page = await Page.create({
      ...pageData,
      storeId,
      sections: pageData.sections || [],
    });

    res.status(201).json({
      success: true,
      data: page,
      message: 'Page created successfully',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A page with this slug already exists for this store',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create page',
      error: error.message,
    });
  }
};

/**
 * Update a page
 */
export const updatePage = async (req: Request, res: Response) => {
  try {
    const { storeId, pageId } = req.params;
    const updateData: UpdatePageInput = req.body;

    const page = await Page.findOneAndUpdate(
      { _id: pageId, storeId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    res.json({
      success: true,
      data: page,
      message: 'Page updated successfully',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A page with this slug already exists for this store',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update page',
      error: error.message,
    });
  }
};

/**
 * Delete a page
 */
export const deletePage = async (req: Request, res: Response) => {
  try {
    const { storeId, pageId } = req.params;

    const page = await Page.findOneAndDelete({ _id: pageId, storeId });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    res.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete page',
      error: error.message,
    });
  }
};

/**
 * Toggle page publish status
 */
export const togglePublish = async (req: Request, res: Response) => {
  try {
    const { storeId, pageId } = req.params;

    const page = await Page.findOne({ _id: pageId, storeId });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    page.isPublished = !page.isPublished;
    await page.save();

    res.json({
      success: true,
      data: page,
      message: `Page ${page.isPublished ? 'published' : 'unpublished'} successfully`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle publish status',
      error: error.message,
    });
  }
};

/**
 * Add a section to a page
 */
export const addSection = async (req: Request, res: Response) => {
  try {
    const { storeId, pageId } = req.params;
    const sectionData: AddPageSectionInput = req.body;

    const page = await Page.findOne({ _id: pageId, storeId });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    // Find the maximum order number
    const maxOrder = page.sections.length > 0
      ? Math.max(...page.sections.map(s => s.order))
      : -1;

    page.sections.push({
      ...sectionData,
      _id: new Date().getTime().toString(),
      order: sectionData.order ?? (maxOrder + 1),
      isVisible: sectionData.isVisible ?? true,
    } as any);

    await page.save();

    res.json({
      success: true,
      data: page,
      message: 'Section added successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to add section',
      error: error.message,
    });
  }
};

/**
 * Update a section in a page
 */
export const updateSection = async (req: Request, res: Response) => {
  try {
    const { storeId, pageId, sectionId } = req.params;
    const sectionData: Partial<UpdatePageSectionInput> = req.body;

    const page = await Page.findOne({ _id: pageId, storeId });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    const sectionIndex = page.sections.findIndex(s => String(s._id) === sectionId);

    if (sectionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // Update section
    page.sections[sectionIndex] = {
      ...page.sections[sectionIndex],
      ...sectionData,
    } as any;

    await page.save();

    res.json({
      success: true,
      data: page,
      message: 'Section updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update section',
      error: error.message,
    });
  }
};

/**
 * Delete a section from a page
 */
export const deleteSection = async (req: Request, res: Response) => {
  try {
    const { storeId, pageId, sectionId } = req.params;

    const page = await Page.findOne({ _id: pageId, storeId });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    page.sections = page.sections.filter(s => String(s._id) !== sectionId);

    await page.save();

    res.json({
      success: true,
      data: page,
      message: 'Section deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete section',
      error: error.message,
    });
  }
};

/**
 * Reorder sections
 */
export const reorderSections = async (req: Request, res: Response) => {
  try {
    const { storeId, pageId } = req.params;
    const { sectionIds }: { sectionIds: string[] } = req.body;

    const page = await Page.findOne({ _id: pageId, storeId });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    // Reorder sections based on sectionIds array
    const reorderedSections = sectionIds.map((id, index) => {
      const section = page.sections.find(s => String(s._id) === id);
      if (section) {
        section.order = index;
        return section;
      }
      return null;
    }).filter(Boolean);

    page.sections = reorderedSections as any;
    await page.save();

    res.json({
      success: true,
      data: page,
      message: 'Sections reordered successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to reorder sections',
      error: error.message,
    });
  }
};
