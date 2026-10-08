"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
}

export default function ImageUploadField({ label, images, onChange, multiple = true }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        const fileList = multiple ? Array.from(files) : [files[0]];
        const uploaded: string[] = [];

        for (const file of fileList) {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (!data.success) {
            toast.error(data.error || `Failed to upload ${file.name}`);
            continue;
          }
          uploaded.push(data.data.url);
        }

        if (uploaded.length > 0) {
          onChange(multiple ? [...images, ...uploaded] : [uploaded[0]]);
          toast.success(uploaded.length > 1 ? `${uploaded.length} images uploaded` : "Image uploaded");
        }
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [images, multiple, onChange]
  );

  const removeImage = (url: string) => {
    onChange(images.filter((i) => i !== url));
  };

  const showUploadSlot = multiple || images.length === 0;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          <div
            key={url}
            className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group flex-shrink-0"
          >
            <Image src={url} alt="" fill className="object-cover" sizes="80px" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {showUploadSlot && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            disabled={uploading}
            className={cn(
              "h-20 w-20 flex-shrink-0 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400 transition-colors disabled:opacity-50",
              isDragging
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-500"
                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-500"
            )}
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="text-[10px] mt-1">{uploading ? "..." : "Upload"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
