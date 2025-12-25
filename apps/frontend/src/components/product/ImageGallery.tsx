"use client";

import { useState } from 'react';
import { Media } from '@repo/types';

interface ImageGalleryProps {
  featuredImage: string;
  mediaGallery: Media[];
}

export function ImageGallery({ featuredImage, mediaGallery }: ImageGalleryProps) {
  const images = [
    { url: featuredImage, type: 'image' },
    ...(mediaGallery || [])
  ];
  
  const [activeImage, setActiveImage] = useState(images[0]);

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 relative md:sticky md:top-24">
       {/* Thumbnails */}
       <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-20 md:h-[600px] scrollbar-hide">
          {images.map((img, idx) => (
             <button 
               key={idx}
               onClick={() => setActiveImage(img)}
               onMouseEnter={() => setActiveImage(img)}
               className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-all ${
                 activeImage.url === img.url ? 'border-black dark:border-white' : 'border-transparent hover:border-gray-200'
               }`}
             >
                {img.type === 'video' ? (
                  <video src={img.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
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
            <img 
              src={activeImage.url} 
              alt="Product View" 
              className="w-full h-full object-cover object-center"
            />
          )}
       </div>
    </div>
  );
}
