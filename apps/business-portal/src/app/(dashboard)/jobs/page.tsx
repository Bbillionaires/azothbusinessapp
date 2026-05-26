'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, MapPin, DollarSign, Clock, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

interface Job {
  id: string;
  title: string;
  department: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  location: string;
  salaryMin: number;
  salaryMax: number;
  salaryType: 'hourly' | 'annual';
  postedAt: string;
  applications: number;
  active: boolean;
}

const DEMO_JOBS: Job[] = [
  { id: '1', title: 'Store Manager', department: 'Operations', type: 'full-time', location: 'In-store', salaryMin: 45000, salaryMax: 60000, salaryType: 'annual', postedAt: '2026-05-10', applications: 18, active: true },
  { id: '2', title: 'Barista / Cashier', department: 'Customer Service', type: 'part-time', location: 'In-store', salaryMin: 15, salaryMax: 18, salaryType: 'hourly', postedAt: '2026-05-15', applications: 34, active: true },
  { id: '3', title: 'Social Media Intern', department: 'Marketing', type: 'internship', location: 'Remote', salaryMin: 16, salaryMax: 20, salaryType: 'hourly', postedAt: '2026-04-20', applications: 52, active: false },
];

const typeBadge: Record<Job['type'], string> = {
  'full-time': 'bg-emerald-100 text-emerald-700',
  'part-time': 'bg-blue-100 text-blue-700',
  'contract': 'bg-purple-100 text-purple-700',
  'internship': 'bg-amber-100 text-amber-700',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(DEMO_JOBS);

  function deleteJob(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  function toggleActive(id: string) {
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, active: !j.active } : j));
  }

  function formatSalary(job: Job) {
    if (job.salaryType === 'hourly') {
      return `$${job.salaryMin}–$${job.salaryMax}/hr`;
    }
    return `$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k/yr`;
  }

  return (
    <div className="page-container">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Job Postings</h1>
          <p className="page-subtitle">Hire talent from the Local First Rewards™ community.</p>
        </div>
        <Link href="/jobs/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Post a Job</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="section-card flex flex-col items-center py-16 text-center">
          <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No job postings yet</p>
          <p className="text-sm text-gray-400 mb-4">Find great local talent for your business.</p>
          <Link href="/jobs/new">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>Post First Job</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className={`section-card hover:shadow-card-hover transition-shadow ${!job.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-brand-green-50 text-brand-green-700 flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.department}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${typeBadge[job.type]}`}>
                        {job.type.replace('-', ' ')}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${job.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {job.active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                      {formatSalary(job)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      Posted {format(new Date(job.postedAt), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-brand-green-700">
                      <Users className="h-3.5 w-3.5" />
                      {job.applications} applicants
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => toggleActive(job.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors text-xs font-medium px-2">
                    {job.active ? 'Close' : 'Reopen'}
                  </button>
                  <button onClick={() => deleteJob(job.id)} className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
