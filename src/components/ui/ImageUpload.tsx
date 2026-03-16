"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage, cleanImageUrl } from "@/lib/image";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
 currentUrl ? : string | null;
 onUpload: (file: File) => Promise < void > ;
 className ? : string;
 maxSizeMB ? : number;
}

export function ImageUpload({
 currentUrl,
 onUpload,
 className,
 maxSizeMB = 5,
}: ImageUploadProps) {
 const inputRef = useRef < HTMLInputElement > (null);
 const [preview, setPreview] = useState < string | null > (null);
 const [uploading, setUploading] = useState(false);
 const [error, setError] = useState < string | null > (null);
 const [isDragging, setIsDragging] = useState(false);
 
 const handleFile = useCallback(
  async (file: File) => {
    setError(null);
    
    // Type check
    if (!file.type.startsWith("image/")) {
     setError("Only image files allowed");
     return;
    }
    
    // Size check (before compress)
    if (file.size > maxSizeMB * 1024 * 1024) {
     setError(`File too large. Max ${maxSizeMB}MB allowed.`);
     return;
    }
    
    // Preview immediately
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    
    setUploading(true);
    try {
     // Compress in browser before sending to server
     const compressed = await compressImage(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.82,
      format: "webp",
     });
     
     await onUpload(compressed);
    } catch (e) {
     setError(e instanceof Error ? e.message : "Upload failed");
     setPreview(null);
    } finally {
     setUploading(false);
     URL.revokeObjectURL(previewUrl);
    }
   },
   [onUpload, maxSizeMB]
 );
 
 const handleDrop = useCallback(
  (e: React.DragEvent) => {
   e.preventDefault();
   setIsDragging(false);
   const file = e.dataTransfer.files[0];
   if (file) handleFile(file);
  },
  [handleFile]
 );
 
 const displayUrl = preview ?? cleanImageUrl(currentUrl);
 
 return (
  <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
          "flex flex-col items-center justify-center min-h-[180px] overflow-hidden"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />

        {/* Current / preview image */}
        <AnimatePresence mode="wait">
          {displayUrl ? (
            <motion.div
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <OptimizedImage
                src={displayUrl}
                alt="Product image"
                fill
                sizes="400px"
                className="object-cover"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="bg-white/90 rounded-lg px-3 py-1.5 text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Change image
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-muted-foreground p-6"
            >
              <ImageIcon className="h-10 w-10" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragging ? "Drop image here" : "Click or drag to upload"}
                </p>
                <p className="text-xs mt-1">
                  JPEG, PNG, WebP — max {maxSizeMB}MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload spinner */}
        {uploading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="h-3 w-3" /> {error}
        </p>
      )}

      {/* Size hint */}
      {!error && (
        <p className="text-xs text-muted-foreground">
          Images are auto-compressed to WebP before upload.
        </p>
      )}
    </div>
 );
}