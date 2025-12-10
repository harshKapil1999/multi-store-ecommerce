import { Router } from 'express';
import * as pageController from '../controllers/page.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All page routes are scoped to a store
// Routes: /api/v1/stores/:storeId/pages

/**
 * @route   GET /api/v1/stores/:storeId/pages
 * @desc    Get all pages for a store
 * @access  Public (with optional filter for published)
 */
router.get('/', pageController.getPages);

/**
 * @route   GET /api/v1/stores/:storeId/pages/home
 * @desc    Get home page for a store
 * @access  Public
 */
router.get('/home', pageController.getHomePage);

/**
 * @route   GET /api/v1/stores/:storeId/pages/slug/:slug
 * @desc    Get page by slug
 * @access  Public
 */
router.get('/slug/:slug', pageController.getPageBySlug);

/**
 * @route   GET /api/v1/stores/:storeId/pages/:pageId
 * @desc    Get a single page
 * @access  Public
 */
router.get('/:pageId', pageController.getPage);

/**
 * @route   POST /api/v1/stores/:storeId/pages
 * @desc    Create a new page
 * @access  Private (requires authentication)
 */
router.post('/', authenticate, pageController.createPage);

/**
 * @route   PUT /api/v1/stores/:storeId/pages/:pageId
 * @desc    Update a page
 * @access  Private
 */
router.put('/:pageId', authenticate, pageController.updatePage);

/**
 * @route   DELETE /api/v1/stores/:storeId/pages/:pageId
 * @desc    Delete a page
 * @access  Private
 */
router.delete('/:pageId', authenticate, pageController.deletePage);

/**
 * @route   PATCH /api/v1/stores/:storeId/pages/:pageId/publish
 * @desc    Toggle page publish status
 * @access  Private
 */
router.patch('/:pageId/publish', authenticate, pageController.togglePublish);

/**
 * @route   POST /api/v1/stores/:storeId/pages/:pageId/sections
 * @desc    Add a section to a page
 * @access  Private
 */
router.post('/:pageId/sections', authenticate, pageController.addSection);

/**
 * @route   PUT /api/v1/stores/:storeId/pages/:pageId/sections/:sectionId
 * @desc    Update a section
 * @access  Private
 */
router.put('/:pageId/sections/:sectionId', authenticate, pageController.updateSection);

/**
 * @route   DELETE /api/v1/stores/:storeId/pages/:pageId/sections/:sectionId
 * @desc    Delete a section
 * @access  Private
 */
router.delete('/:pageId/sections/:sectionId', authenticate, pageController.deleteSection);

/**
 * @route   POST /api/v1/stores/:storeId/pages/:pageId/sections/reorder
 * @desc    Reorder sections
 * @access  Private
 */
router.post('/:pageId/sections/reorder', authenticate, pageController.reorderSections);

export default router;
