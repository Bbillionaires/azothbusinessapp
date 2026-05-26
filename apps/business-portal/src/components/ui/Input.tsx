'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <span className="absolute left-3 text-gray-400 pointer-events-none">{leftAddon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            {...props}
            className={[
              'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent',
              error
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300 hover:border-gray-400',
              leftAddon ? 'pl-9' : '',
              rightAddon ? 'pr-9' : '',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
          />
          {rightAddon && (
            <span className="absolute right-3 text-gray-400 pointer-events-none">{rightAddon}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
