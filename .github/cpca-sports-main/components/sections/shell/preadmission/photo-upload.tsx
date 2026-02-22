"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface PhotoUploadProps {
  value?: Id<"_storage"> | null;
  onChange: (storageId: Id<"_storage"> | null) => void;
  required?: boolean;
}

export function PhotoUpload({ value, onChange, required }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setIsUploading(true);
    const localPreviewUrl = URL.createObjectURL(file);

    try {
      const uploadUrl = await generateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(localPreviewUrl);
      onChange(storageId);
    } catch (err) {
      URL.revokeObjectURL(localPreviewUrl);
      setError("Failed to upload photo");
      console.error("[PhotoUpload] Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="photo">
          Photo {required && <span className="text-destructive">*</span>}
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a recent photo. Max size: 10MB
        </p>
      </div>

      <div className="flex items-start gap-4">
        {previewUrl && (
          <div className="relative w-24 h-24 rounded-md overflow-hidden border shrink-0">
            <Image
              src={previewUrl}
              alt="Uploaded photo"
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="flex-1 space-y-2">
          <Input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            required={required && !value}
          />
          {isUploading && (
            <p className="text-sm text-muted-foreground">Uploading photo...</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {value && !isUploading && (
            <p className="text-sm text-green-600">
              ✓ Photo uploaded successfully
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
