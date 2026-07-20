"use client";

import { CategoryWithChildren, Attribute } from '@repo/types';
import Link from 'next/link';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { JSX, useState } from 'react';

interface FilterSidebarProps {
  categories: CategoryWithChildren[];
  storeSlug: string;
  activeCategoryId?: string;
  filterableAttributes?: { name: string; values: string[] }[];
  onFilterChange?: (filters: Record<string, string[]>) => void;
}

export function FilterSidebar({ 
  categories, 
  storeSlug, 
  activeCategoryId,
  filterableAttributes = [],
  onFilterChange
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    price: true,
    ...Object.fromEntries(filterableAttributes.map(attr => [attr.name, true]))
  });
  
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const selectedCount = Object.values(selectedFilters).reduce((count, values) => count + values.length, 0);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFilter = (attributeName: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[attributeName] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      const newFilters = { ...prev, [attributeName]: updated };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    setSelectedFilters({});
    onFilterChange?.({});
  };

  const colorMap: Record<string, string> = {
    black: '#000000',
    blue: '#4f73f6',
    brown: '#7a3f00',
    green: '#17c964',
    grey: '#8a8a8a',
    gray: '#8a8a8a',
    orange: '#f97316',
    pink: '#f58ab0',
    purple: '#6d0177',
    red: '#ef4444',
    white: '#ffffff',
    yellow: '#facc15',
  };

  const isColorAttribute = (name: string) => ['color', 'colour'].includes(name.toLowerCase());

  // Recursive function to render category tree
  const renderCategoryTree = (cats: CategoryWithChildren[], depth = 0): JSX.Element => {
    return (
      <ul className={`space-y-2 ${depth > 0 ? 'ml-4 border-l border-gray-100 dark:border-white/10 pl-4' : ''}`}>
        {cats.map((category) => (
          <li key={category._id}>
            <div className="flex items-center justify-between">
              <Link 
                href={`/${storeSlug}/category/${category.slug}`}
                className={`text-sm hover:text-black dark:hover:text-white transition-colors flex-1 ${
                  activeCategoryId === category._id || activeCategoryId === category.slug 
                    ? 'font-bold text-black dark:text-white' 
                    : 'text-gray-500'
                }`}
              >
                {category.name}
              </Link>
              {category.children && category.children.length > 0 && (
                <button
                  onClick={() => toggleSection(`cat-${category._id}`)}
                  className="ml-2 flex-shrink-0"
                >
                  {openSections[`cat-${category._id}`] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
            {/* Nested children */}
            {category.children && category.children.length > 0 && openSections[`cat-${category._id}`] && (
              renderCategoryTree(category.children, depth + 1)
            )}
          </li>
        ))}
      </ul>
    );
  };

  const priceRanges = [
    { label: 'Under ₹2,500', min: 0, max: 2500 },
    { label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
    { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
    { label: 'Over ₹10,000', min: 10000, max: null },
  ];

  return (
    <>
    <button
      type="button"
      onClick={() => setIsMobileOpen(true)}
      className="flex w-full items-center justify-between rounded-full border border-gray-300 px-5 py-3 font-semibold dark:border-white/20 lg:hidden"
    >
      <span className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" /> Filters</span>
      {selectedCount > 0 && <span>{selectedCount}</span>}
    </button>
    {isMobileOpen && (
      <button
        type="button"
        aria-label="Close filters"
        onClick={() => setIsMobileOpen(false)}
        className="fixed inset-0 z-[65] bg-black/50 lg:hidden"
      />
    )}
    <aside className={`${isMobileOpen ? 'fixed inset-y-0 right-0 z-[70] block w-[min(90vw,24rem)] bg-white p-6 dark:bg-black' : 'hidden'} h-full flex-shrink-0 overflow-y-auto scrollbar-thin lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-6rem)] lg:w-72 lg:bg-transparent lg:p-0 lg:pr-6`}>
       <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10 lg:hidden">
         <span className="text-xl font-semibold">Filters</span>
         <button type="button" onClick={() => setIsMobileOpen(false)} className="p-2" aria-label="Close filters">
           <X className="h-6 w-6" />
         </button>
       </div>
       <div className="mb-6 hidden items-center justify-between lg:flex">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <SlidersHorizontal className="h-5 w-5" />
            Filters
          </div>
          {selectedCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-gray-500 underline-offset-4 hover:text-black hover:underline dark:text-gray-400 dark:hover:text-white"
            >
              Clear all
            </button>
          )}
       </div>
       
       {/* Category Filter */}
       <div className="mb-6 border-b border-gray-200 pb-6 dark:border-white/10">
          <button 
            onClick={() => toggleSection('categories')}
            className="mb-4 flex w-full items-center justify-between group"
          >
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Categories</span>
            {openSections.categories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {openSections.categories && (
            renderCategoryTree(categories)
          )}
       </div>

       {/* Dynamic Attribute Filters */}
       {filterableAttributes.map((attribute) => (
         <div key={attribute.name} className="mb-6 border-b border-gray-200 pb-6 dark:border-white/10">
            <button 
              onClick={() => toggleSection(attribute.name)}
              className="mb-4 flex w-full items-center justify-between"
            >
               <span className="text-lg font-semibold text-gray-900 dark:text-white">{attribute.name}</span>
               {openSections[attribute.name] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {openSections[attribute.name] && (
               isColorAttribute(attribute.name) ? (
                 <div className="grid grid-cols-3 gap-4">
                    {attribute.values.map((value) => {
                      const selected = (selectedFilters[attribute.name] || []).includes(value);
                      const color = colorMap[value.toLowerCase()] || value.toLowerCase();

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleFilter(attribute.name, value)}
                          className="group flex flex-col items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span
                            className={`h-9 w-9 rounded-full border transition ${selected ? 'ring-2 ring-black ring-offset-2 dark:ring-white dark:ring-offset-black' : 'border-gray-300 dark:border-white/20'}`}
                            style={{ backgroundColor: color }}
                          />
                          <span className="group-hover:text-black dark:group-hover:text-white">{value}</span>
                        </button>
                      );
                    })}
                 </div>
               ) : (
                 <div className="space-y-3">
                    {attribute.values.map((value) => (
                       <label key={value} className="group flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={(selectedFilters[attribute.name] || []).includes(value)}
                            onChange={() => toggleFilter(attribute.name, value)}
                            className="h-6 w-6 rounded-md border-gray-400 text-black focus:ring-black dark:border-white/40 dark:bg-transparent dark:text-white"
                          />
                          <span className="text-base text-gray-700 transition-colors group-hover:text-black dark:text-gray-300 dark:group-hover:text-white">
                            {value}
                          </span>
                       </label>
                    ))}
                 </div>
               )
            )}
         </div>
       ))}

       {/* Price Filter */}
       <div className="mb-6 border-b border-gray-200 pb-6 dark:border-white/10">
          <button 
            onClick={() => toggleSection('price')}
            className="mb-4 flex w-full items-center justify-between"
          >
             <span className="text-lg font-semibold text-gray-900 dark:text-white">Shop by Price</span>
             {openSections.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {openSections.price && (
             <div className="space-y-3">
                {priceRanges.map((range, idx) => (
                   <label key={idx} className="group flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={(selectedFilters.price || []).includes(`${range.min}-${range.max ?? 'plus'}`)}
                        onChange={() => toggleFilter('price', `${range.min}-${range.max ?? 'plus'}`)}
                        className="h-6 w-6 rounded-md border-gray-400 text-black focus:ring-black dark:border-white/40 dark:bg-transparent dark:text-white"
                      />
                      <span className="text-base text-gray-700 transition-colors group-hover:text-black dark:text-gray-300 dark:group-hover:text-white">
                        {range.label}
                      </span>
                   </label>
                ))}
             </div>
          )}
       </div>
    </aside>
    </>
  );
}
