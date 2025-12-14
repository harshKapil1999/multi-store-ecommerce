"use client";

import { CategoryWithChildren, Attribute } from '@repo/types';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

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

  const priceRanges = [
    { label: 'Under ₹2,500', min: 0, max: 2500 },
    { label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
    { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
    { label: 'Over ₹10,000', min: 10000, max: null },
  ];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 lg:block hidden sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-4 scrollbar-thin">
       
       {/* Category Filter */}
       <div className="border-b border-gray-200 dark:border-white/10 pb-6 mb-6">
          <button 
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full mb-4 group"
          >
            <span className="font-medium text-gray-900 dark:text-white">Categories</span>
            {openSections.categories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {openSections.categories && (
            <ul className="space-y-3">
              {categories.map((category) => (
                <li key={category._id}>
                   <Link 
                     href={`/${storeSlug}/category/${category.slug}`}
                     className={`text-sm hover:text-black dark:hover:text-white transition-colors ${
                       activeCategoryId === category._id || activeCategoryId === category.slug 
                         ? 'font-bold text-black dark:text-white' 
                         : 'text-gray-500'
                     }`}
                   >
                     {category.name}
                   </Link>
                   {/* Subcategories */}
                   {category.children && category.children.length > 0 && (
                      <ul className="ml-4 mt-2 space-y-2 border-l border-gray-100 dark:border-white/10 pl-4">
                        {category.children.map(child => (
                           <li key={child._id}>
                              <Link 
                                href={`/${storeSlug}/category/${child.slug}`}
                                className="text-xs text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                              >
                                {child.name}
                              </Link>
                           </li>
                        ))}
                      </ul>
                   )}
                </li>
              ))}
            </ul>
          )}
       </div>

       {/* Dynamic Attribute Filters */}
       {filterableAttributes.map((attribute) => (
         <div key={attribute.name} className="border-b border-gray-200 dark:border-white/10 pb-6 mb-6">
            <button 
              onClick={() => toggleSection(attribute.name)}
              className="flex items-center justify-between w-full mb-4"
            >
               <span className="font-medium text-gray-900 dark:text-white">{attribute.name}</span>
               {openSections[attribute.name] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {openSections[attribute.name] && (
               <div className="space-y-2">
                  {attribute.values.map((value) => (
                     <label key={value} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={(selectedFilters[attribute.name] || []).includes(value)}
                          onChange={() => toggleFilter(attribute.name, value)}
                          className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black dark:border-white/30 dark:bg-transparent"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                          {value}
                        </span>
                     </label>
                  ))}
               </div>
            )}
         </div>
       ))}

       {/* Price Filter */}
       <div className="border-b border-gray-200 dark:border-white/10 pb-6 mb-6">
          <button 
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full mb-4"
          >
             <span className="font-medium text-gray-900 dark:text-white">Shop by Price</span>
             {openSections.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {openSections.price && (
             <div className="space-y-2">
                {priceRanges.map((range, idx) => (
                   <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black dark:border-white/30 dark:bg-transparent"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {range.label}
                      </span>
                   </label>
                ))}
             </div>
          )}
       </div>
    </aside>
  );
}
