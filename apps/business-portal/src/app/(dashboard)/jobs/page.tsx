'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, MapPin, DollarSign, Clock, Trash2, Users, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createBrowserClient } from '@supabase/ssr';

interface DBJob {
  id: string;
  title: string;
  description: string;
  type: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_type: string | null;
  is_active: boolean;
  is_remote: boolean;
  application_count: number;
  created_at: string;
  expires_at: string | null;
}

const TYPE_BADGE: Record<string, string> = {
  full_time:   'bg-emerald-100 text-emerald-700',
  part_time:   'bg-blue-100 text-blue-700',
  contract:    'bg-purple-100 text-purple-700',
  internship:  'bg-amber-100 text-amber-700',
  volunteer:   'bg-teal-100 text-teal-700',
};

const TYPE_LABEL: Record<string, string> = {
  full_time: 'Full-Time', part_time: 'Part-Time', contract: 'Contract',
  internship: 'Internship', volunteer: 'Volunteer',
};

function formatSalary(job: DBJob): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const period = job.salary_type === 'hourly' ? '/hr' : job.salary_type === 'annual' ? '/yr' : '';
  if (job.salary_min && job.salary_max) {
    return job.salary_type === 'annual'
      ? `$${Math.round(job.salary_min / 1000)}k–$${Math.round(job.salary_max / 1000)}k${period}`
      : `$${job.salary_min}–$${job.salary_max}${period}`;
  }
  const val = job.salary_min ?? job.salary_max!;
  return `$${val}${period}`;
}

export default function JobsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<DBJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('businesses').select('id').eq('owner_id', user.id).eq('status', 'active').limit(1).maybeSingle();
      if (data) setBusinessId(data.id);
    }
    init();
  }, []);

  const loadJobs = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const res = await fetch(`/api/jobs?business_id=${businessId}`);
    const json = await res.json();
    setJobs(res.ok ? json : []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  async function deleteJob(id: string) {
    if (!confirm('Delete this job posting? This cannot be undone.')) return;
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
  }

  async function toggleActive(job: DBJob) {
    await fetch(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !job.is_active }),
    });
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: !j.is_active } : j));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-gray-500 mt-1">Hire talent from the Local First Rewards™ community.</p>
        </div>
        <Link
          href="/jobs/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          <Plus size={16} /> Post a Job
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-green-800" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Briefcase size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No job postings yet</h3>
          <p className="text-gray-500 text-sm mb-6">Find great local talent through the Local First Rewards™ community.</p>
          <Link href="/jobs/new" className="px-4 py-2 bg-green-800 text-white rounded-lg font-semibold hover:bg-green-700 inline-flex items-center gap-2">
            <Plus size={16} /> Post First Job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const salary = formatSalary(job);
            return (
              <div key={job.id} className={`bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow ${!job.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                    <Briefcase size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${TYPE_BADGE[job.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {TYPE_LABEL[job.type] ?? job.type}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${job.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {job.is_active ? 'Active' : 'Closed'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {job.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-gray-400" />
                          {job.location}{job.is_remote ? ' (Remote)' : ''}
                        </span>
                      )}
                      {salary && (
                        <span className="flex items-center gap-1.5">
                          <DollarSign size={13} className="text-gray-400" />
                          {salary}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-400" />
                        Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </span>
                      {job.application_count > 0 && (
                        <span className="flex items-center gap-1.5 font-medium text-green-700">
                          <Users size={13} /> {job.application_count} applicants
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(job)}
                      className="px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {job.is_active ? 'Close' : 'Reopen'}
                    </button>
                    <button onClick={() => deleteJob(job.id)} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
