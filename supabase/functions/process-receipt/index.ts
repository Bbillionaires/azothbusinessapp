import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getServiceClient, getUserClient } from '../_shared/supabase.ts';
import { runFraudChecks } from '../_shared/fraud.ts';

interface ProcessReceiptRequest {
  image_base64: string;
  image_mime_type: string;
}

interface OcrResult {
  merchant: string | null;
  date: string | null;
  time: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  receipt_number: string | null;
  items: Array<{ name: string; price: number; qty?: number }>;
  raw_text: string;
  confidence: number;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userClient = getUserClient(authHeader);
  const serviceClient = getServiceClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: ProcessReceiptRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Upload image to Supabase Storage
    const imageBytes = Uint8Array.from(atob(body.image_base64), c => c.charCodeAt(0));
    const fileName = `receipts/${user.id}/${Date.now()}.jpg`;

    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('receipts')
      .upload(fileName, imageBytes, {
        contentType: body.image_mime_type,
        upsert: false,
      });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = serviceClient.storage
      .from('receipts')
      .getPublicUrl(fileName);

    // 2. Run Google Vision OCR
    const ocrResult = await callGoogleVisionOcr(body.image_base64);

    // 3. Generate image hash (SHA-256 of raw bytes)
    const hashBuffer = await crypto.subtle.digest('SHA-256', imageBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const imageHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 4. Run fraud detection
    const fraudResult = await runFraudChecks({
      user_id: user.id,
      merchant: ocrResult.merchant ?? 'Unknown',
      amount: ocrResult.total ?? 0,
      receipt_date: ocrResult.date ?? new Date().toISOString().split('T')[0],
      receipt_time: ocrResult.time ?? '00:00',
      receipt_number: ocrResult.receipt_number ?? undefined,
      image_hash: imageHash,
      ocr_text: ocrResult.raw_text,
      supabase: serviceClient,
    });

    // 5. Determine initial status
    const status =
      fraudResult.recommendation === 'reject' ? 'suspicious' :
      fraudResult.recommendation === 'review' ? 'pending' :
      'pending'; // All go through pending; auto-approve is a future config option

    // 6. Calculate preliminary points (awarded on approval)
    const pointsToAward = Math.floor(ocrResult.total ?? 0); // 1 pt per $1

    // 7. Insert receipt record
    const { data: receipt, error: insertError } = await serviceClient
      .from('receipts')
      .insert({
        user_id: user.id,
        merchant_name: ocrResult.merchant ?? 'Unknown Merchant',
        receipt_date: ocrResult.date ?? new Date().toISOString().split('T')[0],
        receipt_time: ocrResult.time,
        subtotal: ocrResult.subtotal,
        tax: ocrResult.tax,
        total: ocrResult.total ?? 0,
        receipt_number: ocrResult.receipt_number,
        items: ocrResult.items,
        ocr_data: {
          raw_text: ocrResult.raw_text,
          confidence: ocrResult.confidence,
          extracted_at: new Date().toISOString(),
        },
        receipt_hash: imageHash,
        image_url: publicUrl,
        fraud_score: fraudResult.score,
        fraud_flags: fraudResult.flags,
        status,
        points_awarded: status === 'pending' ? pointsToAward : 0,
      })
      .select()
      .single();

    if (insertError) throw new Error(`Receipt insert failed: ${insertError.message}`);

    // 8. Store fingerprint for future dupe detection
    await serviceClient
      .from('receipt_fingerprints')
      .insert({
        receipt_id: receipt.id,
        fingerprint_hash: imageHash,
      });

    // 9. If fraud score is very high, flag the user account
    if (fraudResult.score >= 80) {
      await serviceClient
        .from('profiles')
        .update({ fraud_flag_count: serviceClient.rpc('increment', { x: 1 }) })
        .eq('id', user.id);
    }

    // 10. Auto-approve low-fraud receipts (score < 10) from trusted users
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('tier, total_points_earned')
      .eq('id', user.id)
      .single();

    const isTrustedUser = ['gold', 'platinum', 'legend'].includes(profile?.tier ?? '');
    if (fraudResult.score < 10 && isTrustedUser) {
      await serviceClient
        .from('receipts')
        .update({ status: 'approved', points_awarded: pointsToAward })
        .eq('id', receipt.id);

      // Award points immediately
      await serviceClient.rpc('award_points', {
        p_user_id: user.id,
        p_amount: pointsToAward,
        p_type: 'earned',
        p_reference_id: receipt.id,
        p_reference_type: 'receipt',
        p_description: `Receipt approved: ${ocrResult.merchant} $${ocrResult.total}`,
      });
    }

    return new Response(
      JSON.stringify({
        receipt_id: receipt.id,
        status: receipt.status,
        fraud_score: fraudResult.score,
        fraud_flags: fraudResult.flags,
        ocr: {
          merchant: ocrResult.merchant,
          total: ocrResult.total,
          date: ocrResult.date,
          items_count: ocrResult.items.length,
        },
        points_pending: pointsToAward,
        message:
          fraudResult.recommendation === 'reject'
            ? 'This receipt has been flagged for suspicious activity and will be reviewed.'
            : fraudResult.recommendation === 'review'
            ? 'Your receipt has been submitted and is pending review. Points will be added once approved.'
            : 'Your receipt has been submitted! Points will be added shortly.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('process-receipt error:', err);
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function callGoogleVisionOcr(imageBase64: string): Promise<OcrResult> {
  const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
  if (!apiKey) throw new Error('Google Vision API key not configured');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 1 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
            ],
          },
        ],
      }),
    }
  );

  const json = await response.json();
  const fullText: string = json.responses?.[0]?.fullTextAnnotation?.text ?? '';

  return parseReceiptText(fullText);
}

function parseReceiptText(text: string): OcrResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract total — look for TOTAL, AMOUNT DUE, BALANCE DUE patterns
  const totalPatterns = [
    /(?:TOTAL|AMOUNT DUE|BALANCE DUE|GRAND TOTAL)[:\s]*\$?([\d,]+\.?\d*)/i,
    /\bTOTAL\b[:\s]*\$?([\d,]+\.?\d*)/i,
  ];
  let total: number | null = null;
  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) { total = parseFloat(match[1].replace(',', '')); break; }
  }

  // Extract subtotal
  const subtotalMatch = text.match(/(?:SUBTOTAL|SUB.?TOTAL)[:\s]*\$?([\d,]+\.?\d*)/i);
  const subtotal = subtotalMatch ? parseFloat(subtotalMatch[1].replace(',', '')) : null;

  // Extract tax
  const taxMatch = text.match(/(?:TAX|SALES TAX|STATE TAX)[:\s]*\$?([\d,]+\.?\d*)/i);
  const tax = taxMatch ? parseFloat(taxMatch[1].replace(',', '')) : null;

  // Extract date
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /([A-Z][a-z]+ \d{1,2},? \d{4})/,
  ];
  let date: string | null = null;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        date = new Date(match[1]).toISOString().split('T')[0];
        break;
      } catch {}
    }
  }

  // Extract time
  const timeMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)/i);
  const time = timeMatch ? timeMatch[1] : null;

  // Extract receipt/transaction number
  const receiptNumMatch = text.match(
    /(?:RECEIPT|TRANS(?:ACTION)?|CHECK|ORDER|INV(?:OICE)?)[:\s#]*([A-Z0-9-]{4,20})/i
  );
  const receiptNumber = receiptNumMatch ? receiptNumMatch[1] : null;

  // Extract merchant (typically first non-empty lines before address/phone)
  const merchant = lines[0] ?? null;

  // Extract line items (lines with price at end)
  const itemPattern = /^(.+?)\s+\$?([\d,]+\.\d{2})$/;
  const items: Array<{ name: string; price: number }> = [];
  const skipKeywords = /total|tax|subtotal|change|cash|card|tip|discount/i;
  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match && !skipKeywords.test(match[1])) {
      items.push({ name: match[1].trim(), price: parseFloat(match[2].replace(',', '')) });
    }
  }

  return {
    merchant,
    date,
    time,
    subtotal,
    tax,
    total,
    receipt_number: receiptNumber,
    items,
    raw_text: text,
    confidence: total !== null ? 0.9 : 0.5,
  };
}
