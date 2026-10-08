"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Media } from '@repo/types';

interface ImageGalleryProps {
  featuredImage: string;
  productName: string;
  mediaGallery: Media[];
}

export function ImageGallery({ featuredImage, mediaGallery, productName }: ImageGalleryProps) {
  // Combine featured + gallery, remove duplicates based on URL
  const allImages = [
    { url: featuredImage, type: 'image' },
    ...(mediaGallery || [])
  ];

  const uniqueImages = allImages.filter((img, index, self) =>
    index === self.findIndex((t) => t.url === img.url)
  );

  const [activeImage, setActiveImage] = useState(uniqueImages[0]);

  // Update active image when featuredImage changes (e.g. variant selection)
  useEffect(() => {
    setActiveImage(uniqueImages[0]);
  }, [featuredImage]);

  const images = uniqueImages;

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 relative md:sticky md:top-24">
       {/* Thumbnails */}
       <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-20 md:h-[600px] scrollbar-hide">
          {images.map((img, idx) => (
             <button
               aria-label={`View ${productName} image ${idx + 1}`}
               key={idx}
               onClick={() => setActiveImage(img)}
               onMouseEnter={() => setActiveImage(img)}
               className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-all ${
                 activeImage.url === img.url ? 'border-black dark:border-white' : 'border-transparent hover:border-gray-200'
               }`}
             >
                {img.type === 'video' ? (
                  <video preload="none" src={img.url} className="w-full h-full object-cover" muted />
                ) : (
                  <Image width={80} height={80} sizes="80px" src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                )}
             </button>
          ))}
       </div>

       {/* Main Image */}
       <div className="flex-1 aspect-[3/4] md:aspect-auto md:h-[600px] bg-gray-100 dark:bg-zinc-900 rounded-lg overflow-hidden relative group">
          {activeImage.type === 'video' ? (
            <video
              src={activeImage.url}
              controls
              autoPlay
              muted
              loop
              className="w-full h-full object-contain"
            />
          ) : (
            <Image
              fill sizes="(max-width: 767px) 100vw, 50vw" fetchPriority="high" loading="eager"
              src={activeImage.url}
              alt={productName}
              className="w-full h-full object-cover object-center"
            />
          )}
       </div>
    </div>
  );
}
