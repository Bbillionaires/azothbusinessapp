'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Trash2, Star, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useBusiness } from '@/hooks/useBusiness';

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export default function PhotosPage() {
  const { business } = useBusiness();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!business?.id) return;
    async function load() {
      const { data } = await supabase
        .from('business_photos')
        .select('*')
        .eq('business_id', business!.id)
        .order('order_index', { ascending: true });
      setPhotos(data ?? []);
      setLoading(false);
    }
    load();
  }, [business?.id]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!business?.id) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      for (const file of acceptedFiles) {
        const ext = file.name.split('.').pop();
        const path = `${business.id}/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('business-photos')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (uploadError) continue;

        const { data: { publicUrl } } = supabase.storage
          .from('business-photos')
          .getPublicUrl(uploadData.path);

        const { data: inserted } = await supabase
          .from('business_photos')
          .insert({
            business_id: business.id,
            url: publicUrl,
            is_primary: photos.length === 0,
            order_index: photos.length,
            uploaded_by: user?.id,
          })
          .select()
          .single();

        if (inserted) {
          setPhotos(prev => [...prev, inserted]);
        }
      }
    } finally {
      setUploading(false);
    }
  }, [business?.id, photos.length, supabase]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'video/*': ['.mp4', '.mov'] },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  });

  async function setPrimary(id: string) {
    if (!business?.id) return;
    await supabase
      .from('business_photos')
      .update({ is_primary: false })
      .eq('business_id', business.id);
    await supabase
      .from('business_photos')
      .update({ is_primary: true })
      .eq('id', id);
    setPhotos(prev => prev.map(p => ({ ...p, is_primary: p.id === id })));
  }

  async function deletePhoto(id: string) {
    await supabase.from('business_photos').delete().eq('id', id);
    setPhotos(prev => prev.filter(p => p.id !== id));
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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : photos.length === 0 ? (
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
                photo.is_primary ? 'border-brand-gold-400 shadow-lg' : 'border-transparent hover:border-gray-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? 'Business photo'}
                className="w-full aspect-square object-cover"
              />

              {photo.is_primary && (
                <div className="absolute top-2 left-2 bg-brand-gold-400 text-brand-green-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Primary
                </div>
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.is_primary && (
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

              <div className="p-2 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {new Date(photo.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
