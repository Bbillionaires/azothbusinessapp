// =============================================================================
// useReceipts — receipt history and upload via process-receipt edge function
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReceiptRow {
  id: string;
  user_id: string;
  business_id: string | null;
  image_url: string | null;
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  merchant_name: string | null;
  receipt_date: string | null;
  receipt_number: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'duplicate' | 'suspicious' | 'resubmission_requested';
  fraud_score: number | null;
  fraud_flags: string[] | null;
  points_awarded: number | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  businesses?: {
    id: string;
    name: string;
    logo_url: string | null;
    category: string | null;
  } | null;
}

export interface ReceiptUploadResult {
  receipt: ReceiptRow | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// useReceipts — fetch receipts for current user
// ---------------------------------------------------------------------------

export function useReceipts() {
  const user = useAuthStore((s) => s.user);

  const [data, setData]       = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchReceipts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: rows, error: err } = await supabase
        .from('receipts')
        .select('*, businesses(id, name, logo_url, category)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (err) throw err;
      setData((rows ?? []) as unknown as ReceiptRow[]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load receipts.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  return { data, loading, error, refetch: fetchReceipts };
}

// ---------------------------------------------------------------------------
// useReceiptUpload — convert image to base64 and POST to process-receipt
// ---------------------------------------------------------------------------

export function useReceiptUpload() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState<string | null>(null);

  const upload = useCallback(
    async (imageUri: string): Promise<ReceiptUploadResult> => {
      if (!user || !session) return { receipt: null, error: 'Not authenticated' };

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // ── Step 1: attempt expo-image-picker if no URI was passed ──────────
        // If the caller passed a URI directly we use it as-is.
        // (expo-image-picker is optional; callers can pass the URI themselves.)
        let resolvedUri = imageUri;

        // ── Step 2: convert image to base64 ─────────────────────────────────
        setProgress(20);
        let base64: string;

        try {
          // expo-file-system is available in all Expo managed workflows
          base64 = await FileSystem.readAsStringAsync(resolvedUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch {
          // Fallback: fetch the URI and convert via FileReader
          const response = await fetch(resolvedUri);
          const blob = await response.blob();
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1] ?? result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }

        setProgress(50);

        // ── Step 3: determine MIME type from URI extension ──────────────────
        const ext = resolvedUri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const mimeMap: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          webp: 'image/webp',
          heic: 'image/heic',
        };
        const mimeType = mimeMap[ext] ?? 'image/jpeg';

        setProgress(60);

        // ── Step 4: POST to process-receipt edge function ───────────────────
        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          'process-receipt',
          {
            body: {
              image_base64: base64,
              image_mime_type: mimeType,
            },
          }
        );

        if (fnError) throw fnError;

        setProgress(100);
        return { receipt: fnData as ReceiptRow, error: null };
      } catch (err: any) {
        const msg = err?.message ?? 'Failed to upload receipt.';
        setError(msg);
        return { receipt: null, error: msg };
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [user, session]
  );

  return { upload, uploading, progress, error };
}
