'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';
import { useBusiness } from '@/hooks/useBusiness';

interface Photo {
  id: string;
  url: string;
  name: string;
  size: number;
  isPrimary: boolean;
  uploadedAt: string;
}

// Demo photos
const DEMO_PHOTOS: Photo[] = [
  { id: '1', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80', name: 'storefront.jpg', size: 245000, isPrimary: true, uploadedAt: '2026-05-01' },
  { id: '2', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80', name: 'interior.jpg', size: 312000, isPrimary: false, uploadedAt: '2026-05-10' },
  { id: '3', url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80', name: 'products.jpg', size: 189000, isPrimary: false, uploadedAt: '2026-05-15' },
];

export default function PhotosPage() {
  const { business } = useBusiness();
  const [photos, setPhotos] = useState<Photo[]>(DEMO_PHOTOS);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!business?.id) return;
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const ext = file.name.split('.').pop();
        const path = `${business.id}/${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage
          .from('business-photos')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('business-photos')
          .getPublicUrl(data.path);

        setPhotos((prev) => [
          ...prev,
          {
            id: data.path,
            url: publicUrl,
            name: file.name,
            size: file.size,
            isPrimary: false,
            uploadedAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // In demo mode, simulate upload
      for (const file of acceptedFiles) {
        const url = URL.createObjectURL(file);
        setPhotos((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            url,
            name: file.name,
            size: file.size,
            isPrimary: false,
            uploadedAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setUploading(false);
    }
  }, [business?.id, supabase]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'video/*': ['.mp4', '.mov'] },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  });

  function setPrimary(id: string) {
    setPhotos((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === id })));
  }

  function deletePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function formatSize(bytes: number) {
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Photos &amp; Videos</h1>
        <p className="page-subtitle">
          Upload high-quality images to showcase your business. The primary photo is shown on your listing.
        </p>
      </div>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={[
          'mb-6 border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-brand-green-500 bg-brand-green-50'
            : 'border-gray-300 hover:border-brand-green-400 hover:bg-gray-50',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <Upload
          className={`h-10 w-10 mx-auto mb-3 ${isDragActive ? 'text-brand-green-600' : 'text-gray-400'}`}
        />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'Drop files here…' : 'Drag & drop photos or videos, or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG, WebP, MP4, MOV — max 20 MB per file
        </p>
        {uploading && (
          <p className="text-xs text-brand-green-600 mt-2 font-medium animate-pulse">
            Uploading…
          </p>
        )}
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="section-card flex flex-col items-center py-16 text-center">
          <ImageIcon className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No photos yet</p>
          <p className="text-sm text-gray-400">Upload your first photo above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
                photo.isPrimary ? 'border-brand-gold-400 shadow-lg' : 'border-transparent hover:border-gray-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full aspect-square object-cover"
              />

              {/* Primary badge */}
              {photo.isPrimary && (
                <div className="absolute top-2 left-2 bg-brand-gold-400 text-brand-green-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Primary
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.isPrimary && (
                  <button
                    onClick={() => setPrimary(photo.id)}
                    title="Set as primary"
                    className="p-2 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deletePhoto(photo.id)}
                  title="Delete photo"
                  className="p-2 rounded-lg bg-red-500/80 hover:bg-red-600 text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* File info */}
              <div className="p-2 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-600 font-medium truncate">{photo.name}</p>
                <p className="text-xs text-gray-400">{formatSize(photo.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
