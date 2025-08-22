'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AnimatedLogo } from '@/components/ui/morphing-logo';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Users, 
  Sparkles, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface Stats {
  totalUsers: string;
  totalPosts: string;
  totalCommunities: string;
  activeUsers: string;
  countries: string;
  realData: boolean;
}

const features = [
  {
    icon: Heart,
    title: 'Meaningful Connections',
    description: 'Build genuine relationships with people who share your interests and values.'
  },
  {
    icon: MessageCircle,
    title: 'Real-time Messaging',
    description: 'Stay connected with instant messaging, voice calls, and group conversations.'
  },
  {
    icon: Share2,
    title: 'Rich Content Sharing',
    description: 'Share photos, videos, stories, and links with beautiful media previews.'
  },
  {
    icon: Users,
    title: 'Community Building',
    description: 'Join communities, follow topics, and discover new perspectives.'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data is protected with enterprise-grade security and privacy controls.'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built with modern technology for a smooth, responsive experience.'
  }
];

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: '10K+',
    totalPosts: '1M+',
    totalCommunities: '500+',
    activeUsers: '5K+',
    countries: '50+',
    realData: false
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep default stats if API fails
    } finally {
      setIsLoadingStats(false);
    }
  };

  const statsData = [
    { label: 'Active Users', value: stats.totalUsers },
    { label: 'Posts Shared', value: stats.totalPosts },
    { label: 'Communities', value: stats.totalCommunities },
    { label: 'Countries', value: stats.countries }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="relative z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-900/80">
        <div className="container-responsive">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <AnimatedLogo />
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary">
                Features
              </Link>
              <Link href="#about" className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary">
                About
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary">
                Pricing
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container-responsive">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="mr-2 h-4 w-4" />
              Now in Beta
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
              The Future of{' '}
              <span className="gradient-text">Social Media</span>
              {' '}is Here
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              HALO is a modern social platform designed for meaningful connections. 
              Share your world, discover new perspectives, and build genuine relationships 
              in a safe, beautiful environment.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/register">
                <Button size="lg" className="halo-glow">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20">
          <div className="container-responsive">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {statsData.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {isLoadingStats ? <LoadingSpinner /> : stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  {stats.realData && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      <CheckCircle className="inline h-3 w-3 mr-1" />
                      Live Data
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="container-responsive">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Everything you need to connect
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              HALO combines the best features of modern social platforms with a focus on 
              privacy, performance, and meaningful interactions.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="container-responsive">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Ready to join the HALO community?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Start sharing your story, connecting with others, and discovering amazing content today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/register">
                <Button size="lg" className="halo-glow">
                  Create Your Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-responsive">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">HALO</span>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                Building meaningful connections in the digital age. HALO is more than a social media platform - it's a community where ideas flourish and relationships thrive.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Community Guidelines</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <div className="flex flex-col items-center space-y-3">
              {/* HALO Project Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">HALO Project</span>
              </div>
              
              {/* Copyright Text */}
              <p className="text-gray-400 text-sm">
                All rights reserved
              </p>
              
              {/* Additional Info */}
              <p className="text-gray-500 text-xs">
                Building the future of social connection
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}