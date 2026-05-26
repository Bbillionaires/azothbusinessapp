'use client';

import { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, Flag } from 'lucide-react';

const MOCK_REVIEWS = [
  {
    id: '1',
    reviewer: 'Marcus J.',
    tier: 'gold',
    rating: 5,
    title: 'Best local coffee shop in Jacksonville!',
    body: 'Amazing coffee, even better community vibes. The staff knows every regular by name. This is exactly the kind of local business our community needs.',
    date: '2024-05-15',
    helpful_count: 12,
    weight: 3,
    is_community_legend: false,
    photos: [],
    response: null,
  },
  {
    id: '2',
    reviewer: 'Tanisha W.',
    tier: 'legend',
    rating: 5,
    title: 'A true community landmark',
    body: "I've been coming here for 8 years. This place has been a cornerstone of our neighborhood. They hire local, source local, and give back constantly.",
    date: '2024-05-10',
    helpful_count: 28,
    weight: 10,
    is_community_legend: true,
    photos: [],
    response: "Thank you Tanisha! You've been with us from the beginning. We love our community family!",
  },
  {
    id: '3',
    reviewer: 'Derek P.',
    tier: 'bronze',
    rating: 3,
    title: 'Good food, slow service',
    body: 'The drinks are great but waited 15 minutes during lunch rush. Would love to see more staff during peak hours.',
    date: '2024-05-08',
    helpful_count: 3,
    weight: 1,
    is_community_legend: false,
    photos: [],
    response: null,
  },
];

const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  bronze: { bg: '#FEF3C7', text: '#92400E', label: 'Bronze' },
  silver: { bg: '#F1F5F9', text: '#475569', label: 'Silver' },
  gold: { bg: '#FEF9C3', text: '#854D0E', label: 'Gold' },
  platinum: { bg: '#F0F9FF', text: '#0C4A6E', label: 'Platinum' },
  legend: { bg: '#F0FDF4', text: '#14532D', label: 'Legend' },
};

export default function ReviewsPage() {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterTrusted, setFilterTrusted] = useState(false);

  const avgRating = MOCK_REVIEWS.reduce((s, r) => s + r.rating * r.weight, 0) /
    MOCK_REVIEWS.reduce((s, r) => s + r.weight, 0);

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: MOCK_REVIEWS.filter(rev => rev.rating === r).length,
    pct: (MOCK_REVIEWS.filter(rev => rev.rating === r).length / MOCK_REVIEWS.length) * 100,
  }));

  const filtered = MOCK_REVIEWS
    .filter(r => (!filterRating || r.rating === filterRating))
    .filter(r => (!filterTrusted || r.weight >= 3));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-500 mt-1">Manage and respond to customer reviews</p>
      </div>

      {/* Rating summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row gap-8">
        <div className="text-center">
          <div className="text-6xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</div>
          <div className="flex justify-center gap-0.5 my-2">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={18} className={s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
            ))}
          </div>
          <div className="text-sm text-gray-500">{MOCK_REVIEWS.length} reviews</div>
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
            { tier: 'legend', weight: 10, label: 'Community Legend' },
            { tier: 'gold', weight: 3, label: 'Gold Member' },
            { tier: 'silver', weight: 2, label: 'Silver Member' },
            { tier: 'bronze', weight: 1, label: 'Standard' },
          ].map(item => (
            <div key={item.tier} className="flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded-full font-semibold`}
                style={{ backgroundColor: TIER_COLORS[item.tier].bg, color: TIER_COLORS[item.tier].text }}>
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
          Trusted Reviewers Only
        </button>
        {filterRating && (
          <button
            onClick={() => setFilterRating(null)}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300"
          >
            {filterRating} Stars ×
          </button>
        )}
        <span className="text-sm text-gray-500">{filtered.length} reviews</span>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {filtered.map(review => (
          <div key={review.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-800">
                    {review.reviewer[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{review.reviewer}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: TIER_COLORS[review.tier]?.bg, color: TIER_COLORS[review.tier]?.text }}
                      >
                        {TIER_COLORS[review.tier]?.label}
                      </span>
                      {review.is_community_legend && (
                        <span className="text-xs bg-green-900 text-white px-2 py-0.5 rounded-full font-bold">
                          Community Legend Review
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={13} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{review.date}</span>
                      <span className="text-xs text-gray-400">• Weight ×{review.weight}</span>
                    </div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-red-500 transition-colors">
                  <Flag size={16} />
                </button>
              </div>

              <h4 className="font-semibold text-gray-900 mt-3">{review.title}</h4>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">{review.body}</p>

              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <ThumbsUp size={13} /> {review.helpful_count} helpful
                </span>
              </div>
            </div>

            {/* Existing response */}
            {review.response && (
              <div className="bg-green-50 border-t border-green-100 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={14} className="text-green-700" />
                  <span className="text-sm font-semibold text-green-800">Your Response</span>
                </div>
                <p className="text-sm text-green-900">{review.response}</p>
              </div>
            )}

            {/* Reply form */}
            {replyingTo === review.id && !review.response ? (
              <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Write a professional, helpful response..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 text-sm text-white bg-green-800 rounded-lg hover:bg-green-700 font-semibold">
                    Post Response
                  </button>
                </div>
              </div>
            ) : !review.response ? (
              <div className="border-t border-gray-100 px-5 py-3">
                <button
                  onClick={() => setReplyingTo(review.id)}
                  className="text-sm text-green-800 font-semibold hover:text-green-600 flex items-center gap-1"
                >
                  <MessageSquare size={14} /> Respond to this review
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
