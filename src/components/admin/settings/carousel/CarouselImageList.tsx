
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Trash2 } from "lucide-react";

interface CarouselImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface CarouselImageListProps {
  images: CarouselImage[];
  onReorder: (id: string, direction: 'up' | 'down') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CarouselImageList({ images, onReorder, onDelete }: CarouselImageListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <div key={image.id} className="relative group">
          <img
            src={image.image_url}
            alt={`Carousel image ${index + 1}`}
            className="w-full h-48 object-cover rounded-md"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onDelete(image.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onReorder(image.id, 'up')}
              disabled={index === 0}
            >
              <ArrowUpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onReorder(image.id, 'down')}
              disabled={index === images.length - 1}
            >
              <ArrowDownCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
