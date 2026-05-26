'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, MapPin, Phone, Globe, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { BusinessStatusBadge } from '../../../../components/businesses/BusinessStatusBadge';
import { VerificationActions } from '../../../../components/businesses/VerificationActions';

export default function BusinessDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // In production: fetch from Supabase
  const business = {
    id,
    name: 'Greenwood Coffee Co.',
    description: 'A community-first coffee shop serving specialty drinks and supporting local artists. Founded in the heart of Jacksonville\'s historic district.',
    category: 'Restaurant & Café',
    city: 'Jacksonville', state: 'FL',
    address: '501 N Main St, Jacksonville, FL 32202',
    phone: '(904) 555-0142',
    website: 'greenwoodcoffee.com',
    email: 'hello@greenwoodcoffee.com',
    status: 'active',
    verification_level: 'pro',
    is_local_owned: true,
    is_community_owned: true,
    is_veteran_owned: false,
    is_woman_owned: true,
    year_founded: 2018,
    average_rating: 4.8,
    total_reviews: 124,
    followers: 892,
    receipts_this_month: 247,
    owner: 'Naomi Williams',
    owner_email: 'naomi@greenwoodcoffee.com',
    created_at: '2022-03-15',
  };

  const ownershipBadges = [
    { active: business.is_local_owned, emoji: '🏠', label: 'Local Owned' },
    { active: business.is_community_owned, emoji: '🤝', label: 'Community Owned' },
    { active: business.is_veteran_owned, emoji: '🎖', label: 'Veteran Owned' },
    { active: business.is_woman_owned, emoji: '👩', label: 'Woman Owned' },
  ].filter(b => b.active);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/businesses" className="text-gray-400 hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{business.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">Business ID: {id}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <BusinessStatusBadge status={business.status} />
          <VerificationActions
            businessId={business.id}
            currentStatus={business.status}
            onApprove={() => {}}
            onSuspend={() => {}}
            onView={() => {}}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Business info */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          <h2 className="font-bold text-gray-100">Business Information</h2>
          <p className="text-sm text-gray-300 leading-relaxed">{business.description}</p>
          <div className="space-y-2">
            {[
              { icon: <MapPin size={14} />, value: business.address },
              { icon: <Phone size={14} />, value: business.phone },
              { icon: <Globe size={14} />, value: business.website },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                {item.icon} {item.value}
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {ownershipBadges.map((b, i) => (
              <span key={i} className="text-xs bg-green-900/40 text-green-400 px-2 py-1 rounded-full font-semibold">
                {b.emoji} {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Owner info */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          <h2 className="font-bold text-gray-100">Owner & Account</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-gray-200">
              {business.owner.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-semibold text-gray-200">{business.owner}</p>
              <p className="text-sm text-gray-400">{business.owner_email}</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Founded', value: business.year_founded },
              { label: 'Registered', value: business.created_at },
              { label: 'Category', value: business.category },
              { label: 'Verification', value: `Greenwood ${business.verification_level.charAt(0).toUpperCase() + business.verification_level.slice(1)}™` },
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="text-gray-300 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Performance Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: <Star size={16} className="text-yellow-400" />, label: 'Avg Rating', value: business.average_rating },
              { icon: <Star size={16} className="text-gray-400" />, label: 'Total Reviews', value: business.total_reviews },
              { icon: <Users size={16} className="text-blue-400" />, label: 'Followers', value: business.followers },
              { icon: <ShieldCheck size={16} className="text-green-400" />, label: 'Receipts (mo)', value: business.receipts_this_month },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                {s.icon}
                <div>
                  <div className="font-bold text-gray-200">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin actions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Admin Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Feature Business', desc: 'Add featured badge to search results', color: 'bg-yellow-700/50 text-yellow-300 hover:bg-yellow-700' },
              { label: 'Mark Top Rated', desc: 'Add Top Rated trust badge', color: 'bg-blue-700/50 text-blue-300 hover:bg-blue-700' },
              { label: 'Grant Verification Override', desc: 'Manually grant a verification level', color: 'bg-purple-700/50 text-purple-300 hover:bg-purple-700' },
              { label: 'Suspend Business', desc: 'Temporarily remove from platform', color: 'bg-red-700/50 text-red-300 hover:bg-red-700' },
            ].map((action, i) => (
              <button key={i} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${action.color}`}>
                {action.label}
                <span className="block font-normal opacity-70 text-xs mt-0.5">{action.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
