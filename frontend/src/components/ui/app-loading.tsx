'use client';

import { AnimatedLogo } from './morphing-logo';

export function AppLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Animated Logo */}
        <div className="logo-morph">
          <AnimatedLogo size="xl" showText={false} />
        </div>
        
        {/* App Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-purple-600">
            HALO
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Social Media Platform
          </p>
        </div>
        
        {/* Loading Bar */}
        <div className="w-64 mx-auto">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* Loading Text */}
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">
          Initializing your social experience...
        </p>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full particle-float opacity-60"
              style={{
                left: `${10 + i * 10}%`,
                top: `${20 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple loading overlay
export function LoadingOverlay({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-700 dark:text-gray-300">{text}</span>
        </div>
      </div>
    </div>
  );
}

// Skeleton loading for content
export function ContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>
  );
}