// =============================================================================
// useReceipts — receipt submission and history
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { ReceiptWithBusiness } from '../../../packages/shared/src/types/receipt';

interface UploadReceiptPayload {
  imageUri: string;
  businessId?: string;
  totalAmount?: number;
}

interface UseReceiptsResult {
  receipts: ReceiptWithBusiness[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadReceipt: (payload: UploadReceiptPayload) => Promise<{ error: string | null }>;
  refetch: () => void;
}

export function useReceipts(): UseReceiptsResult {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptWithBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('receipts')
        .select('*, businesses(id, name, logo_url, category)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (err) throw err;
      setReceipts((data ?? []) as unknown as ReceiptWithBusiness[]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load receipts.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const uploadReceipt = useCallback(
    async ({ imageUri, businessId, totalAmount }: UploadReceiptPayload) => {
      if (!user) return { error: 'Not authenticated' };
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        // 1. Upload image to Supabase Storage
        setUploadProgress(20);
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

        if (uploadError) throw uploadError;
        setUploadProgress(60);

        // 2. Get public URL
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
        setUploadProgress(80);

        // 3. Create receipt record
        const { error: insertError } = await supabase.from('receipts').insert({
          user_id: user.id,
          business_id: businessId ?? null,
          image_url: urlData.publicUrl,
          total_amount: totalAmount ?? null,
          status: 'pending',
        });

        if (insertError) throw insertError;
        setUploadProgress(100);

        // Refresh list
        await fetchReceipts();
        return { error: null };
      } catch (err: any) {
        const msg = err?.message ?? 'Failed to upload receipt.';
        setError(msg);
        return { error: msg };
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [user, fetchReceipts]
  );

  return {
    receipts,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    uploadReceipt,
    refetch: fetchReceipts,
  };
}
