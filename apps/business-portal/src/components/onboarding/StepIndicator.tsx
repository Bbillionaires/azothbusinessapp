'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 0-based index
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.label} className={`flex items-center ${!isLast ? 'flex-1' : ''}`}>
              {/* Circle */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted
                      ? 'bg-brand-green-700 border-brand-green-700'
                      : isCurrent
                      ? 'bg-white border-brand-green-700'
                      : 'bg-white border-gray-300',
                  ].join(' ')}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                  ) : (
                    <span
                      className={[
                        'text-sm font-semibold',
                        isCurrent ? 'text-brand-green-700' : 'text-gray-400',
                      ].join(' ')}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                {/* Label below circle */}
                <span
                  className={[
                    'mt-1.5 text-xs font-medium text-center whitespace-nowrap',
                    isCompleted || isCurrent ? 'text-brand-green-700' : 'text-gray-400',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={[
                    'h-0.5 flex-1 mx-2 mb-5 transition-colors',
                    isCompleted ? 'bg-brand-green-700' : 'bg-gray-200',
                  ].join(' ')}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
