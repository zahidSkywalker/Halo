'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
      <div className="relative">
        {/* Outer ring */}
        <div className={cn(
          'border-4 border-gray-200 rounded-full animate-spin',
          sizeClasses[size]
        )} />
        
        {/* Inner ring with HALO colors */}
        <div className={cn(
          'absolute top-0 left-0 border-4 border-transparent border-t-primary border-r-purple-500 rounded-full animate-spin',
          sizeClasses[size]
        )} />
        
        {/* Center dot */}
        <div className={cn(
          'absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2',
          size === 'sm' ? 'w-0.5 h-0.5' : size === 'lg' ? 'w-2 h-2' : size === 'xl' ? 'w-3 h-3' : 'w-1 h-1'
        )} />
      </div>
      
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

// Page loading spinner
export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <h2 className="mt-6 text-xl font-semibold text-gray-700 dark:text-gray-300">
          Loading HALO...
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Preparing your social experience
        </p>
      </div>
    </div>
  );
}

// Button loading spinner
export function ButtonLoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size={size} />
      <span>Loading...</span>
    </div>
  );
}