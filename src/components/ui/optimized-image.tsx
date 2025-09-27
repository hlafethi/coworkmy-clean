import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  fallback = '/placeholder.svg',
  ...props 
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(fallback);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImgSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setImgSrc(fallback);
      setIsLoaded(true);
    };
  }, [src, fallback]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      {...props}
    />
  );
}
