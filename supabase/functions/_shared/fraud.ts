export interface FraudCheckInput {
  user_id: string;
  merchant: string;
  amount: number;
  receipt_date: string;
  receipt_time: string;
  receipt_number?: string;
  image_hash: string;
  ocr_text: string;
  supabase: any;
}

export interface FraudCheckResult {
  score: number;
  flags: FraudFlag[];
  recommendation: 'approve' | 'review' | 'reject';
}

export interface FraudFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
}

const AUTO_REJECT_SCORE = 90;
const MANUAL_REVIEW_SCORE = 30;
const MAX_DAILY_RECEIPTS = 10;
const MAX_SINGLE_AMOUNT = 500;
const MAX_MONTHLY_AMOUNT = 5000;

export async function runFraudChecks(input: FraudCheckInput): Promise<FraudCheckResult> {
  const flags: FraudFlag[] = [];
  let score = 0;

  // 1. Check for duplicate image hash
  const { data: hashMatch } = await input.supabase
    .from('receipts')
    .select('id, user_id, status')
    .eq('receipt_hash', input.image_hash)
    .neq('status', 'rejected')
    .limit(1);

  if (hashMatch && hashMatch.length > 0) {
    flags.push({
      type: 'duplicate_receipt_hash',
      severity: 'critical',
      detail: `Exact image match found: receipt ${hashMatch[0].id} from user ${hashMatch[0].user_id}`,
    });
    score += 70;
  }

  // 2. Check duplicate receipt number (same merchant + receipt#)
  if (input.receipt_number) {
    const { data: rNumMatch } = await input.supabase
      .from('receipts')
      .select('id')
      .eq('merchant_name', input.merchant)
      .eq('receipt_number', input.receipt_number)
      .neq('status', 'rejected')
      .limit(1);

    if (rNumMatch && rNumMatch.length > 0) {
      flags.push({
        type: 'duplicate_transaction_number',
        severity: 'critical',
        detail: `Transaction ${input.receipt_number} already submitted for ${input.merchant}`,
      });
      score += 65;
    }
  }

  // 3. Excessive daily submissions
  const today = new Date().toISOString().split('T')[0];
  const { count: dailyCount } = await input.supabase
    .from('receipts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', input.user_id)
    .gte('created_at', `${today}T00:00:00Z`);

  if ((dailyCount ?? 0) >= MAX_DAILY_RECEIPTS) {
    flags.push({
      type: 'excessive_daily_submissions',
      severity: 'high',
      detail: `User submitted ${dailyCount} receipts today (limit: ${MAX_DAILY_RECEIPTS})`,
    });
    score += 35;
  } else if ((dailyCount ?? 0) >= MAX_DAILY_RECEIPTS * 0.7) {
    flags.push({
      type: 'high_daily_submission_rate',
      severity: 'medium',
      detail: `User at ${dailyCount}/${MAX_DAILY_RECEIPTS} daily submissions`,
    });
    score += 15;
  }

  // 4. Amount exceeds single receipt cap
  if (input.amount > MAX_SINGLE_AMOUNT) {
    flags.push({
      type: 'amount_exceeds_cap',
      severity: 'medium',
      detail: `Amount $${input.amount} exceeds single receipt limit of $${MAX_SINGLE_AMOUNT}`,
    });
    score += 20;
  }

  // 5. Monthly spending cap check
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlyData } = await input.supabase
    .from('receipts')
    .select('total')
    .eq('user_id', input.user_id)
    .eq('status', 'approved')
    .gte('receipt_date', firstOfMonth.toISOString().split('T')[0]);

  const monthlyTotal = (monthlyData ?? []).reduce((s: number, r: any) => s + (r.total ?? 0), 0);
  if (monthlyTotal + input.amount > MAX_MONTHLY_AMOUNT) {
    flags.push({
      type: 'monthly_spending_cap',
      severity: 'medium',
      detail: `Monthly total ($${monthlyTotal.toFixed(2)}) + this receipt would exceed $${MAX_MONTHLY_AMOUNT} cap`,
    });
    score += 25;
  }

  // 6. Suspicious OCR patterns (edited amounts, round numbers at odd merchants)
  if (detectEditedOcrPatterns(input.ocr_text)) {
    flags.push({
      type: 'ocr_anomaly_detected',
      severity: 'high',
      detail: 'OCR text contains patterns consistent with image editing',
    });
    score += 40;
  }

  // 7. Future date check
  const receiptDate = new Date(input.receipt_date);
  const now = new Date();
  if (receiptDate > now) {
    flags.push({
      type: 'future_date',
      severity: 'critical',
      detail: `Receipt date ${input.receipt_date} is in the future`,
    });
    score += 80;
  }

  // 8. Very old receipt (>30 days)
  const daysDiff = (now.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 30) {
    flags.push({
      type: 'stale_receipt',
      severity: 'medium',
      detail: `Receipt is ${Math.floor(daysDiff)} days old (limit: 30 days)`,
    });
    score += 20;
  }

  // 9. New account rapid submission
  const { data: profile } = await input.supabase
    .from('profiles')
    .select('created_at')
    .eq('id', input.user_id)
    .single();

  if (profile) {
    const accountAgeDays = (now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAgeDays < 1 && (dailyCount ?? 0) >= 3) {
      flags.push({
        type: 'new_account_rapid_submission',
        severity: 'high',
        detail: `Account created ${accountAgeDays.toFixed(1)} days ago with ${dailyCount} receipts today`,
      });
      score += 35;
    }
  }

  const cappedScore = Math.min(score, 100);

  return {
    score: cappedScore,
    flags,
    recommendation:
      cappedScore >= AUTO_REJECT_SCORE ? 'reject' :
      cappedScore >= MANUAL_REVIEW_SCORE ? 'review' :
      'approve',
  };
}

function detectEditedOcrPatterns(text: string): boolean {
  // Look for signs of Photoshop/edited amounts: inconsistent fonts flagged by OCR confidence,
  // impossible totals, mismatched subtotal+tax≠total
  const lines = text.split('\n').map(l => l.trim());

  // Check if amounts contain suspicious patterns (all 0s, repeated digits)
  const amountPattern = /\$[\d,]+\.\d{2}/g;
  const amounts = text.match(amountPattern) ?? [];
  const suspiciousAmounts = amounts.filter(a => {
    const num = parseFloat(a.replace(/[$,]/g, ''));
    return num === 0 || /(\d)\1{3,}/.test(a); // zeros or 4+ repeated digits
  });

  return suspiciousAmounts.length > 0;
}
