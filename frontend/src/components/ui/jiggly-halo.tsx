'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface JigglyHaloProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export function JigglyHalo({ 
  size = 'md', 
  className, 
  showText = false 
}: JigglyHaloProps) {
  const [isJiggling, setIsJiggling] = useState(false);
  const [bubbleCount, setBubbleCount] = useState(0);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  // Trigger jiggle effect randomly
  useEffect(() => {
    const jiggleInterval = setInterval(() => {
      setIsJiggling(true);
      setTimeout(() => setIsJiggling(false), 600);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(jiggleInterval);
  }, []);

  // Add floating bubbles
  useEffect(() => {
    const bubbleInterval = setInterval(() => {
      setBubbleCount(prev => (prev + 1) % 8);
    }, 800);

    return () => clearInterval(bubbleInterval);
  }, []);

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Main HALO text with jiggle effect */}
      <div className={cn(
        'font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-purple-600',
        sizeClasses[size],
        'transition-all duration-300 ease-out',
        isJiggling ? 'animate-bounce scale-110 rotate-3' : 'scale-100 rotate-0'
      )}>
        HALO
      </div>

      {/* Floating bubbles around the text */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'absolute w-2 h-2 bg-gradient-to-r from-primary/60 to-purple-500/60 rounded-full',
              'animate-pulse opacity-70'
            )}
            style={{
              left: `${20 + i * 10}%`,
              top: `${30 + (i % 2) * 20}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: '2s',
              transform: `translateY(${Math.sin((Date.now() + i * 100) / 1000) * 5}px)`,
            }}
          />
        ))}
      </div>

      {/* Jiggly effect particles */}
      {isJiggling && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={`jiggle-${i}`}
              className="absolute w-1 h-1 bg-primary rounded-full animate-ping"
              style={{
                left: `${30 + i * 8}%`,
                top: `${40 + (i % 2) * 15}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
      )}

      {/* Bubbly effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div
            key={`bubble-${i}`}
            className={cn(
              'absolute w-3 h-3 bg-gradient-to-r from-primary/40 to-purple-500/40 rounded-full',
              'animate-pulse'
            )}
            style={{
              left: `${15 + i * 20}%`,
              top: `${60 + (i % 2) * 10}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: '3s',
              transform: `scale(${1 + Math.sin((Date.now() + i * 200) / 1000) * 0.3})`,
            }}
          />
        ))}
      </div>

      {/* Text if requested */}
      {showText && (
        <div className="mt-2 text-center">
          <span className={cn(
            'text-sm text-gray-600 dark:text-gray-400',
            'animate-pulse'
          )}>
            Social Media Platform
          </span>
        </div>
      )}
    </div>
  );
}

// Special auth form version
export function AuthJigglyHalo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Circular background with jiggly HALO */}
      <div className={cn(
        'relative w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-full',
        'flex items-center justify-center shadow-lg',
        'hover:scale-105 transition-transform duration-300',
        'animate-pulse'
      )}>
        <JigglyHalo size={size} />
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-xl scale-150 opacity-50" />
        
        {/* Sparkle effects */}
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full animate-ping"
              style={{
                left: `${25 + i * 15}%`,
                top: `${25 + i * 15}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact version for small spaces
export function CompactJigglyHalo({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex items-center space-x-2">
      <div className={cn(
        'w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full',
        'flex items-center justify-center shadow-md',
        'hover:scale-110 transition-transform duration-200'
      )}>
        <JigglyHalo size={size} />
      </div>
    </div>
  );
}