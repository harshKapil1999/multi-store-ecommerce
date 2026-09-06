"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Billboard } from '@repo/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  billboards: Billboard[];
  storeSlug?: string;
}

export function HeroCarousel({ billboards, storeSlug }: HeroCarouselProps) {
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (billboards.length <= 1 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % billboards.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [billboards.length, paused]);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? billboards.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % billboards.length);
  };

  // Helper function to build CTA link with store slug prepended
  const buildCtaLink = (ctaLink?: string): string => {
    const fallback = storeSlug ? `/${storeSlug}/products` : '/';
    if (!ctaLink || /[\\\s]/.test(ctaLink) || ctaLink.startsWith('//')) return fallback;
    if (ctaLink.startsWith('/')) return storeSlug && !ctaLink.startsWith(`/${storeSlug}/`) && ctaLink !== `/${storeSlug}` ? `/${storeSlug}${ctaLink}` : ctaLink;
    return /^https:\/\//i.test(ctaLink) ? ctaLink : fallback;
  };

  if (!billboards || billboards.length === 0) return null;

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} className="relative h-[65svh] min-h-[420px] max-h-[780px] w-full overflow-hidden bg-black">
      {/* Slides */}
      {billboards.map((billboard, index) => (
        <div
          aria-hidden={index !== current} inert={index !== current}
          key={billboard._id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
             <img 
               loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"}
               src={billboard.imageUrl} 
               alt={billboard.title}
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-black/20" /> {/* Overlay */}
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-end sm:items-center justify-start sm:pl-20 pb-20 sm:pb-0">
            <div className={`container mx-auto px-4 transform transition-all duration-700 delay-300 ${
              index === current ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="max-w-2xl text-white">
                {billboard.subtitle && (
                   <div className="text-lg md:text-xl font-medium mb-4 uppercase tracking-wider">
                     {billboard.subtitle}
                   </div>
                )}
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 tracking-tight uppercase leading-[0.9]">
                  {billboard.title}
                </h2>
                {billboard.ctaText && (
                  <Link
                    href={buildCtaLink(billboard.ctaLink)}
                    className="inline-block bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-transform hover:scale-105"
                  >
                    {billboard.ctaText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Controls */}
      {billboards.length > 1 && (
        <>
          <button 
            aria-label="Previous slide" onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors text-white"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            aria-label="Next slide" onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors text-white"
          >
            <ChevronRight size={32} />
          </button>

          <button aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused(!paused)} className="absolute bottom-6 right-5 z-20 rounded-full bg-black/50 px-4 py-2 text-xs text-white">{paused ? "Play" : "Pause"}</button>
          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            {billboards.map((_, idx) => (
              <button
                aria-label={`Show slide ${idx + 1}`} aria-pressed={idx === current}
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-12 h-1 rounded-full transition-all duration-300 ${
                  idx === current ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
