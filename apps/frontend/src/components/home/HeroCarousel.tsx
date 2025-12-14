"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Billboard } from '@repo/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  billboards: Billboard[];
}

export function HeroCarousel({ billboards }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (billboards.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % billboards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [billboards.length]);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? billboards.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % billboards.length);
  };

  if (!billboards || billboards.length === 0) return null;

  return (
    <div className="relative h-[85vh] w-full overflow-hidden bg-black">
      {/* Slides */}
      {billboards.map((billboard, index) => (
        <div
          key={billboard._id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
             <img 
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
                <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight uppercase leading-[0.9]">
                  {billboard.title}
                </h1>
                {billboard.ctaText && (
                  <Link
                    href={billboard.ctaLink || '#'}
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
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors text-white"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors text-white"
          >
            <ChevronRight size={32} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            {billboards.map((_, idx) => (
              <button
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
