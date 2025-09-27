import { FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { useState } from "react";

interface ImageUploadProps {
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  isUploading?: boolean;
}

export const ImageUpload = ({ onImageChange, imagePreview, isUploading = false }: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const input = document.getElementById('imageUpload') as HTMLInputElement;
      if (input) {
        input.files = e.dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    }
  };

  const clearImage = () => {
    const input = document.getElementById('imageUpload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    // Déclencher un événement change vide
    const event = new Event('change', { bubbles: true });
    if (input) {
      input.dispatchEvent(event);
    }
  };

  return (
    <FormItem>
      <div className="space-y-4">
        {/* Zone de drag & drop */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={onImageChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-600">Upload en cours...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Glissez-déposez une image ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, WebP • Max 5MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Prévisualisation de l'image */}
        {imagePreview && (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border">
            <img 
              src={imagePreview} 
              alt="Prévisualisation de l'espace" 
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={clearImage}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </FormItem>
  );
};
