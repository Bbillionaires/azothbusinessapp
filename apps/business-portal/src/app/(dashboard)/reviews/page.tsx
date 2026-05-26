'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, ThumbsUp, Flag, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  bronze:   { bg: '#FEF3C7', text: '#92400E', label: 'Bronze' },
  silver:   { bg: '#F1F5F9', text: '#475569', label: 'Silver' },
  gold:     { bg: '#FEF9C3', text: '#854D0E', label: 'Gold' },
  platinum: { bg: '#F0F9FF', text: '#0C4A6E', label: 'Platinum' },
  legend:   { bg: '#F0FDF4', text: '#14532D', label: 'Legend' },
};

const TIER_WEIGHT: Record<string, number> = {
  bronze: 1, silver: 2, gold: 3, platinum: 5, legend: 10,
};

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  tags: string[] | null;
  status: string;
  weighted_score: number;
  helpful_count: number;
  created_at: string;
  reviewer_id: string;
  profiles?: { display_name: string | null; tier: string | null } | null;
  review_responses?: Array<{ id: string; body: string; created_at: string }>;
};

function useBusinessId() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      setBusinessId(data?.id ?? null);
    }
    load();
  }, []);

  return { supabase, businessId };
}

export default function ReviewsPage() {
  const { supabase, businessId } = useBusinessId();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterTrusted, setFilterTrusted] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    async function load() {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles(display_name, tier), review_responses(id, body, created_at)')
        .eq('business_id', businessId)
        .eq('status', 'published')
        .order('weighted_score', { ascending: false });
      setReviews((data ?? []) as Review[]);
      setLoading(false);
    }
    load();
  }, [businessId]);

  const submitReply = useCallback(async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/reviews/${reviewId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_text: replyText.trim() }),
    });
    if (res.ok) {
      setReviews(prev => prev.map(r =>
        r.id === reviewId
          ? { ...r, review_responses: [{ id: 'new', body: replyText.trim(), created_at: new Date().toISOString() }] }
          : r
      ));
      setReplyingTo(null);
      setReplyText('');
    }
    setSubmitting(false);
  }, [replyText]);

  const avgRating = reviews.length === 0 ? 0 :
    reviews.reduce((s, r) => {
      const w = TIER_WEIGHT[r.profiles?.tier ?? 'bronze'] ?? 1;
      return s + r.rating * w;
    }, 0) / reviews.reduce((s, r) => s + (TIER_WEIGHT[r.profiles?.tier ?? 'bronze'] ?? 1), 0);

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rev => rev.rating === r).length,
    pct: reviews.length === 0 ? 0 : (reviews.filter(rev => rev.rating === r).length / reviews.length) * 100,
  }));

  const filtered = reviews
    .filter(r => !filterRating || r.rating === filterRating)
    .filter(r => !filterTrusted || (TIER_WEIGHT[r.profiles?.tier ?? 'bronze'] ?? 1) >= 3);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-green-800" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-500 mt-1">Manage and respond to customer reviews</p>
      </div>

      {/* Rating summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row gap-8">
        <div className="text-center">
          <div className="text-6xl font-extrabold text-gray-900">
            {reviews.length === 0 ? '—' : avgRating.toFixed(1)}
          </div>
          <div className="flex justify-center gap-0.5 my-2">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={18} className={s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
            ))}
          </div>
          <div className="text-sm text-gray-500">{reviews.length} reviews</div>
          <div className="text-xs text-gray-400 mt-1">Weighted average</div>
        </div>

        <div className="flex-1 space-y-2">
          {ratingDist.map(({ rating, count, pct }) => (
            <button
              key={rating}
              onClick={() => setFilterRating(filterRating === rating ? null : rating)}
              className={`flex items-center gap-3 w-full text-sm ${filterRating === rating ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
            >
              <span className="w-4 text-right text-gray-700 font-medium">{rating}</span>
              <Star size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-4 text-gray-500">{count}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2 min-w-48">
          <div className="text-sm font-semibold text-gray-700 mb-3">Trusted Reviewer System™</div>
          {[
            { tier: 'legend',   weight: 10, label: 'Community Legend' },
            { tier: 'platinum', weight: 5,  label: 'Platinum Member' },
            { tier: 'gold',     weight: 3,  label: 'Gold Member' },
            { tier: 'silver',   weight: 2,  label: 'Silver Member' },
            { tier: 'bronze',   weight: 1,  label: 'Standard' },
          ].map(item => (
            <div key={item.tier} className="flex items-center justify-between text-xs">
              <span
                className="px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: TIER_COLORS[item.tier].bg, color: TIER_COLORS[item.tier].text }}
              >
                {item.label}
              </span>
              <span className="text-gray-500">Weight ×{item.weight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setFilterTrusted(!filterTrusted)}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            filterTrusted ? 'bg-green-800 text-white border-green-800' : 'bg-white text-gray-700 border-gray-200 hover:border-green-800'
          }`}
        >
          Trusted Reviewers Only (×3+)
        </button>
        {filterRating && (
          <button
            onClick={() => setFilterRating(null)}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300"
          >
            {filterRating} Stars ×
          </button>
        )}
        <span className="text-sm text-gray-500">{filtered.length} review{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Review list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Star size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No reviews yet. Share your business profile to get your first review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(review => {
            const tier = review.profiles?.tier ?? 'bronze';
            const tierColor = TIER_COLORS[tier] ?? TIER_COLORS.bronze;
            const weight = TIER_WEIGHT[tier] ?? 1;
            const reviewerName = review.profiles?.display_name ?? 'Anonymous';
            const hasResponse = review.review_responses && review.review_responses.length > 0;

            return (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-800">
                        {reviewerName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{reviewerName}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: tierColor.bg, color: tierColor.text }}
                          >
                            {tierColor.label}
                          </span>
                          {tier === 'legend' && (
                            <span className="text-xs bg-green-900 text-white px-2 py-0.5 rounded-full font-bold">
                              Community Legend
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={13} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-gray-400">• Weight ×{weight}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <Flag size={16} />
                    </button>
                  </div>

                  {review.title && (
                    <h4 className="font-semibold text-gray-900 mt-3">{review.title}</h4>
                  )}
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">{review.body}</p>

                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {review.tags.map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <ThumbsUp size={13} /> {review.helpful_count} helpful
                    </span>
                  </div>
                </div>

                {/* Existing response */}
                {hasResponse && (
                  <div className="bg-green-50 border-t border-green-100 px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={14} className="text-green-700" />
                      <span className="text-sm font-semibold text-green-800">Your Response</span>
                    </div>
                    <p className="text-sm text-green-900">{review.review_responses![0].body}</p>
                  </div>
                )}

                {/* Reply form */}
                {replyingTo === review.id && !hasResponse ? (
                  <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Write a professional, helpful response..."
                      maxLength={1000}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{replyText.length}/1000</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitReply(review.id)}
                          disabled={submitting || !replyText.trim()}
                          className="px-4 py-2 text-sm text-white bg-green-800 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {submitting && <Loader2 size={14} className="animate-spin" />}
                          Post Response
                        </button>
                      </div>
                    </div>
                  </div>
                ) : !hasResponse ? (
                  <div className="border-t border-gray-100 px-5 py-3">
                    <button
                      onClick={() => { setReplyingTo(review.id); setReplyText(''); }}
                      className="text-sm text-green-800 font-semibold hover:text-green-600 flex items-center gap-1"
                    >
                      <MessageSquare size={14} /> Respond to this review
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
