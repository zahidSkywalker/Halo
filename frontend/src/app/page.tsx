import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export const metadata: Metadata = {
  title: 'HALO - Modern Social Media Platform',
  description: 'Connect, share, and discover on HALO - the next generation social media platform built for meaningful connections.',
};

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

const stats = [
  { label: 'Active Users', value: '10K+' },
  { label: 'Posts Shared', value: '1M+' },
  { label: 'Communities', value: '500+' },
  { label: 'Countries', value: '50+' }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="relative z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-900/80">
        <div className="container-responsive">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">HALO</span>
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
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
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
      <footer className="border-t border-gray-200/50 bg-white/50 backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-900/50">
        <div className="container-responsive py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-purple-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">HALO</span>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Building meaningful connections in the digital age.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Product</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#features" className="hover:text-primary">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="/api/docs" className="hover:text-primary">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Company</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#about" className="hover:text-primary">About</Link></li>
                <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-primary">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Support</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/help" className="hover:text-primary">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 border-t border-gray-200/50 pt-8 dark:border-gray-800/50">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              © 2024 HALO. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}