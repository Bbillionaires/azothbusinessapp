// =============================================================================
// Receipt Types — fraud detection, OCR, points
// =============================================================================

export type ReceiptStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'duplicate'
  | 'suspicious'
  | 'resubmission_requested';

export type ReceiptFraudFlag =
  | 'duplicate_hash'
  | 'amount_outlier'
  | 'frequency_abuse'
  | 'ocr_mismatch'
  | 'image_tampered'
  | 'merchant_blacklisted'
  | 'velocity_exceeded'
  | 'low_confidence_ocr';

// ---------------------------------------------------------------------------
// Receipt Line Item (stored in items JSONB)
// ---------------------------------------------------------------------------
export interface ReceiptLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sku?: string;
  category?: string;
}

// ---------------------------------------------------------------------------
// OCR Data (stored in ocr_data JSONB)
// ---------------------------------------------------------------------------
export interface OcrData {
  raw_text: string;
  confidence: number;            // 0.0-1.0
  detected_merchant?: string;
  detected_date?: string;        // ISO date string
  detected_total?: number;
  detected_subtotal?: number;
  detected_tax?: number;
  detected_items?: ReceiptLineItem[];
  processing_engine?: string;    // 'google_vision' | 'aws_textract' | 'openai_vision'
  processed_at?: string;
}

// ---------------------------------------------------------------------------
// Receipt — mirrors public.receipts
// ---------------------------------------------------------------------------
export interface Receipt {
  id: string;
  user_id: string;
  business_id: string | null;

  merchant_name: string;
  receipt_date: string;           // ISO date
  receipt_time: string | null;    // HH:MM:SS
  subtotal: number | null;
  tax: number | null;
  total: number;
  receipt_number: string | null;

  items: ReceiptLineItem[];
  ocr_data: OcrData;

  receipt_hash: string;
  image_url: string;

  fraud_score: number;            // 0.000 - 1.000
  fraud_flags: ReceiptFraudFlag[];

  status: ReceiptStatus;
  points_awarded: number | null;
  reviewed_by: string | null;
  review_notes: string | null;
  reviewed_at: string | null;

  created_at: string;
  updated_at: string;
}

export type ReceiptInsert = Omit<
  Receipt,
  | 'id'
  | 'fraud_score'
  | 'fraud_flags'
  | 'status'
  | 'points_awarded'
  | 'reviewed_by'
  | 'review_notes'
  | 'reviewed_at'
  | 'created_at'
  | 'updated_at'
> & {
  id?: string;
  fraud_score?: number;
  fraud_flags?: ReceiptFraudFlag[];
  status?: ReceiptStatus;
};

// ---------------------------------------------------------------------------
// Receipt Fingerprint — mirrors public.receipt_fingerprints
// ---------------------------------------------------------------------------
export type FingerprintHashType = 'exact' | 'phash' | 'dhash';

export interface ReceiptFingerprint {
  id: string;
  receipt_id: string;
  fingerprint_hash: string;
  hash_type: FingerprintHashType;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Composite types for UI
// ---------------------------------------------------------------------------
export interface ReceiptWithBusiness extends Receipt {
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
    category: string;
  } | null;
}

export interface ReceiptSummary
  extends Pick<
    Receipt,
    | 'id'
    | 'merchant_name'
    | 'receipt_date'
    | 'total'
    | 'status'
    | 'points_awarded'
    | 'image_url'
    | 'created_at'
  > {
  business_name?: string;
}

// ---------------------------------------------------------------------------
// Receipt upload payload (client -> server)
// ---------------------------------------------------------------------------
export interface ReceiptUploadPayload {
  image_base64?: string;
  image_url?: string;
  business_id?: string;
  receipt_date?: string;
  total?: number;
}
