"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface PhotoUploadProps {
  value?: Id<"_storage"> | null;
  onChange: (storageId: Id<"_storage"> | null) => void;
  required?: boolean;
}

export function PhotoUpload({ value, onChange, required }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const photoUrl = useQuery(
    api.files.getUrl,
    value ? { storageId: value } : "skip"
  );

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
      onChange(storageId);
    } catch (err) {
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
        {value && photoUrl !== undefined && (
          <div className="relative w-24 h-24 rounded-md overflow-hidden border shrink-0">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt="Uploaded photo"
                fill
                className="object-cover"
              />
            ) : (
              <Skeleton className="w-full h-full" />
            )}
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
            <p className="text-sm text-green-600">✓ Photo uploaded successfully</p>
          )}
        </div>
      </div>
    </div>
  );
}