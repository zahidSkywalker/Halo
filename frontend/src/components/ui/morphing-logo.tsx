'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MorphingLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  autoPlay?: boolean;
  speed?: number;
}

export function MorphingLogo({ 
  size = 'md', 
  className, 
  autoPlay = true, 
  speed = 2000 
}: MorphingLogoProps) {
  const [currentLetter, setCurrentLetter] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const letters = ['H', 'A', 'L', 'O'];
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  };

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentLetter((prev) => (prev + 1) % letters.length);
        setIsAnimating(false);
      }, 300);
    }, speed);

    return () => clearInterval(interval);
  }, [autoPlay, speed]);

  const getLetterPath = (letter: string) => {
    switch (letter) {
      case 'H':
        return (
          <path
            d="M10 20V4M10 12H26M26 4V20"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'A':
        return (
          <path
            d="M18 4L30 20H6L18 4ZM18 4V20M12 16H24"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'L':
        return (
          <path
            d="M6 4V20H26"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'O':
        return (
          <path
            d="M18 4C24.6274 4 30 9.37258 30 16C30 22.6274 24.6274 28 18 28C11.3726 28 6 22.6274 6 16C6 9.37258 11.3726 4 18 4Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-xl scale-150 opacity-50" />
      
      {/* Main logo container */}
      <div className={cn(
        'relative font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-purple-600',
        sizeClasses[size]
      )}>
        {/* SVG Logo */}
        <svg
          width={size === 'sm' ? 40 : size === 'md' ? 60 : size === 'lg' ? 80 : 120}
          height={size === 'sm' ? 40 : size === 'md' ? 60 : size === 'lg' ? 80 : 120}
          viewBox="0 0 36 24"
          className={cn(
            'transition-all duration-500 ease-in-out',
            isAnimating ? 'scale-110 rotate-12' : 'scale-100 rotate-0'
          )}
        >
          {getLetterPath(letters[currentLetter])}
        </svg>
        
        {/* Text fallback */}
        <span className="sr-only">HALO</span>
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'absolute w-1 h-1 bg-primary rounded-full animate-ping',
              'opacity-75'
            )}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 20}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: '2s'
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Animated logo with text
export function AnimatedLogo({ 
  size = 'md', 
  showText = true, 
  className 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <MorphingLogo size={size} />
      {showText && (
        <span className={cn(
          'font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-purple-600',
          size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-4xl' : 'text-6xl'
        )}>
          HALO
        </span>
      )}
    </div>
  );
}

// Logo with subtitle
export function LogoWithSubtitle({ 
  size = 'md', 
  className 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return (
    <div className={cn('text-center', className)}>
      <AnimatedLogo size={size} showText={false} />
      <h1 className={cn(
        'font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-purple-600 mt-2',
        size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-4xl' : 'text-6xl'
      )}>
        HALO
      </h1>
      <p className={cn(
        'text-gray-600 dark:text-gray-400 mt-1',
        size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-lg'
      )}>
        Social Media Platform
      </p>
    </div>
  );
}