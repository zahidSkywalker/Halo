'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { 
  Home, 
  User, 
  Search, 
  Bell, 
  MessageCircle, 
  Bookmark, 
  Settings,
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Send,
  Image,
  Video,
  Smile
} from 'lucide-react';

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    profilePicture?: string;
    isVerified: boolean;
  };
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  hashtags: string[];
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchFeed();
  }, [router]);

  const fetchFeed = async () => {
    try {
      setIsLoadingFeed(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/posts/feed', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newPost,
          hashtags: newPost.match(/#\w+/g) || [],
        }),
      });

      if (response.ok) {
        setNewPost('');
        fetchFeed();
        toast({
          title: 'Success!',
          description: 'Your post has been created.',
        });
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchFeed();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">HALO</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profilePicture} />
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="/dashboard">
                      <Home className="mr-3 h-5 w-5" />
                      Home
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href={`/profile/${user?.username}`}>
                      <User className="mr-3 h-5 w-5" />
                      Profile
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="/bookmarks">
                      <Bookmark className="mr-3 h-5 w-5" />
                      Bookmarks
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="/settings">
                      <Settings className="mr-3 h-5 w-5" />
                      Settings
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <Settings className="mr-3 h-5 w-5" />
                    Logout
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card>
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.profilePicture} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      placeholder="What's happening?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="border-0 focus:ring-0 text-lg"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Image className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        onClick={handleCreatePost}
                        disabled={isLoading || !newPost.trim()}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isLoading ? <LoadingSpinner size="sm" /> : 'Post'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Your Feed</h2>
              
              {isLoadingFeed ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" text="Loading your feed..." />
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No posts yet. Be the first to share something!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.author.profilePicture} />
                          <AvatarFallback>{post.author.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold">{post.author.displayName}</span>
                            {post.author.isVerified && (
                              <Badge variant="secondary" className="text-xs">
                                ✓ Verified
                              </Badge>
                            )}
                            <span className="text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-gray-900 dark:text-gray-100 mb-3">
                            {post.content}
                          </p>
                          
                          {post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {post.hashtags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(post.id)}
                                className={post.isLiked ? 'text-red-500' : ''}
                              >
                                <Heart className={`h-4 w-4 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
                                {post.likesCount}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {post.commentsCount}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Share2 className="h-4 w-4 mr-2" />
                                {post.sharesCount}
                              </Button>
                            </div>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Trending Topics</h3>
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-full justify-center">
                    #Technology
                  </Badge>
                  <Badge variant="secondary" className="w-full justify-center">
                    #Innovation
                  </Badge>
                  <Badge variant="secondary" className="w-full justify-center">
                    #SocialMedia
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}