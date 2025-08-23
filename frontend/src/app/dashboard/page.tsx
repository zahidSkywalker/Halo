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
  Smile,
  Users,
  TrendingUp,
  Hash,
  AtSign,
  Globe,
  Camera,
  X
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
  media?: Array<{
    id: string;
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;
  }>;
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  isVerified: boolean;
  isFollowing: boolean;
  followersCount: number;
  bio?: string;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  message: string;
  isRead: boolean;
  createdAt: string;
  actor?: User;
  postId?: string;
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'following'>('feed');
  
  // Real-time stats state
  const [userStats, setUserStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0
  });
  const [trendingTopics, setTrendingTopics] = useState<Array<{tag: string, count: number}>>([]);
  
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
    fetchSuggestedUsers();
    fetchNotifications();
    fetchUserStats();
    fetchTrendingTopics();
  }, [router]);

  const fetchFeed = async () => {
    try {
      setIsLoadingFeed(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://halo-backend-wye4.onrender.com/api/posts/feed', {
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

  const fetchSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://halo-backend-wye4.onrender.com/api/users/suggestions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://halo-backend-wye4.onrender.com/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadNotifications(data.data?.filter((n: Notification) => !n.isRead).length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://halo-backend-wye4.onrender.com/api/users/${user?.username}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats({
          posts: data.data.posts || 0,
          followers: data.data.following || 0,
          following: data.data.following || 0,
          likes: data.data.likes || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Fetch trending topics
  const fetchTrendingTopics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://halo-backend-wye4.onrender.com/api/posts/trending', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrendingTopics(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    }
  };

  // Test API connection
  const testAPI = async () => {
    try {
      console.log('🧪 Testing API connection...');
      const token = localStorage.getItem('accessToken');
      console.log('🔑 Token present:', !!token);
      
      // Test direct backend health (no auth needed)
      console.log('🔍 Testing direct backend health...');
      try {
        const healthResponse = await fetch('https://halo-backend-wye4.onrender.com/health');
        console.log('📡 Health response status:', healthResponse.status);
        const healthData = await healthResponse.json();
        console.log('📄 Health data:', healthData);
      } catch (healthError) {
        console.error('❌ Health check failed:', healthError);
      }
      
      // Test posts endpoint with auth
      console.log('🔍 Testing posts endpoint with auth...');
      try {
        const postsResponse = await fetch('https://halo-backend-wye4.onrender.com/api/posts/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 Posts response status:', postsResponse.status);
        console.log('📡 Posts response headers:', Object.fromEntries(postsResponse.headers.entries()));
        
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          console.log('📄 Posts data:', postsData);
        } else {
          const errorData = await postsResponse.text();
          console.log('📄 Posts error:', errorData);
        }
      } catch (postsError) {
        console.error('❌ Posts endpoint failed:', postsError);
      }
      
      // Test CORS preflight
      console.log('🔍 Testing CORS preflight...');
      try {
        const corsResponse = await fetch('https://halo-backend-wye4.onrender.com/api/posts/', {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization',
          },
        });
        
        console.log('📡 CORS preflight status:', corsResponse.status);
        console.log('📡 CORS headers:', Object.fromEntries(corsResponse.headers.entries()));
      } catch (corsError) {
        console.error('❌ CORS preflight failed:', corsError);
      }
      
      toast({
        title: 'API Test Complete',
        description: 'Check console for detailed results',
      });
    } catch (error) {
      console.error('❌ API test failed:', error);
      toast({
        title: 'API Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && selectedMedia.length === 0) {
      toast({
        title: 'Empty Post',
        description: 'Please add some content or media to your post',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const postData: any = {
        content: newPost.trim(),
        hashtags: extractHashtags(newPost),
        mentions: extractMentions(newPost)
      };

      console.log('🚀 Creating post with data:', postData);
      console.log('🔗 API URL: https://halo-backend-wye4.onrender.com/api/posts/');
      console.log('🔑 Token present:', !!token);

      console.log('📡 Making fetch request...');
      const response = await fetch('https://halo-backend-wye4.onrender.com/api/posts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      console.log('📡 Response received:', response);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response statusText:', response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('📡 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Post created successfully:', data);
        
        setPosts([data.data, ...posts]);
        setNewPost('');
        setSelectedMedia([]);
        
        // Refresh stats after successful post
        fetchUserStats();
        fetchTrendingTopics();
        
        toast({
          title: 'Success! 🎉',
          description: 'Your post has been created successfully!',
        });
      } else {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('❌ Backend error data:', errorData);
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError);
          try {
            const errorText = await response.text();
            console.error('❌ Error response text:', errorText);
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error('❌ Could not read error response:', textError);
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error creating post:', error);
      toast({
        title: 'Error Creating Post',
        description: error instanceof Error ? error.message : 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://halo-backend-wye4.onrender.com/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://halo-backend-wye4.onrender.com/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuggestedUsers(suggestedUsers.map(user => {
          if (user.id === userId) {
            return {
              ...user,
              isFollowing: !user.isFollowing,
              followersCount: user.isFollowing ? user.followersCount - 1 : user.followersCount + 1
            };
          }
          return user;
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return text.match(hashtagRegex)?.map(tag => tag.slice(1)) || [];
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@[\w\u0590-\u05ff]+/g;
    return text.match(mentionRegex)?.map(mention => mention.slice(1)) || [];
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedMedia(prev => [...prev, ...files].slice(0, 4)); // Max 4 media files
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return <LoadingSpinner size="xl" text="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">HALO</h1>
              <div className="hidden md:flex space-x-1">
                <Button
                  variant={activeTab === 'feed' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('feed')}
                  className="flex items-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Feed</span>
                </Button>
                <Button
                  variant={activeTab === 'trending' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('trending')}
                  className="flex items-center space-x-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending</span>
                </Button>
                <Button
                  variant={activeTab === 'following' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('following')}
                  className="flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Following</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Test API Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={testAPI}
                className="text-xs"
              >
                🧪 Test API
              </Button>

              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search HALO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">Notifications</h3>
                        <Button variant="ghost" size="sm">Mark all read</Button>
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-lg ${
                                notification.isRead ? 'bg-gray-50' : 'bg-blue-50'
                              }`}
                            >
                              <p className="text-sm text-gray-700">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">No notifications yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profilePicture} />
                  <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{user.displayName}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Post Card */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Create Post</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="What's happening in your world?"
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    
                    {/* Media Preview */}
                    {selectedMedia.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {selectedMedia.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Media ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600"
                              onClick={() => removeMedia(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleMediaSelect}
                            className="hidden"
                          />
                          <Camera className="w-5 h-5 text-gray-500 hover:text-blue-500" />
                        </label>
                        <Smile className="w-5 h-5 text-gray-500 hover:text-blue-500" />
                        <Hash className="w-5 h-5 text-gray-500 hover:text-blue-500" />
                        <AtSign className="w-5 h-5 text-gray-500 hover:text-blue-500" />
                      </div>
                      <Button
                        onClick={handleCreatePost}
                        disabled={isLoading || (!newPost.trim() && selectedMedia.length === 0)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Post
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Who to Follow */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Who to Follow</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestedUsers.map((suggestedUser) => (
                  <div key={suggestedUser.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={suggestedUser.profilePicture} />
                        <AvatarFallback>{suggestedUser.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{suggestedUser.displayName}</p>
                        <p className="text-xs text-gray-500">@{suggestedUser.username}</p>
                      </div>
                    </div>
                    <Button
                      variant={suggestedUser.isFollowing ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleFollow(suggestedUser.id)}
                    >
                      {suggestedUser.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {isLoadingFeed ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="xl" text="Loading your feed..." />
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start following people to see their posts in your feed
                  </p>
                  <Button onClick={() => setActiveTab('trending')}>
                    Explore Trending
                  </Button>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={post.author.profilePicture} />
                        <AvatarFallback>{post.author.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">
                            {post.author.displayName}
                          </span>
                          {post.author.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              ✓ Verified
                            </Badge>
                          )}
                          <span className="text-gray-500 text-sm">
                            @{post.author.username}
                          </span>
                          <span className="text-gray-400 text-sm">
                            · {formatTimeAgo(post.createdAt)}
                          </span>
                        </div>

                        <p className="text-gray-900 mb-3">{post.content}</p>

                        {/* Media Display */}
                        {post.media && post.media.length > 0 && (
                          <div className="mb-4">
                            {post.media.length === 1 ? (
                              <div className="rounded-lg overflow-hidden">
                                {post.media[0].type === 'image' ? (
                                  <img
                                    src={post.media[0].url}
                                    alt="Post media"
                                    className="w-full max-h-96 object-cover"
                                  />
                                ) : (
                                  <video
                                    src={post.media[0].url}
                                    controls
                                    className="w-full max-h-96 object-cover"
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                                {post.media.slice(0, 4).map((media, index) => (
                                  <div key={index} className="relative">
                                    {media.type === 'image' ? (
                                      <img
                                        src={media.url}
                                        alt={`Media ${index + 1}`}
                                        className="w-full h-32 object-cover"
                                      />
                                    ) : (
                                      <video
                                        src={media.url}
                                        className="w-full h-32 object-cover"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hashtags and Mentions */}
                        {(post.hashtags.length > 0 || post.mentions.length > 0) && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.hashtags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-blue-600">
                                #{tag}
                              </Badge>
                            ))}
                            {post.mentions.map((mention) => (
                              <Badge key={mention} variant="outline" className="text-green-600">
                                @{mention}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Post Actions */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center space-x-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(post.id)}
                              className={`flex items-center space-x-2 ${
                                post.isLiked ? 'text-red-500' : 'text-gray-500'
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                              <span>{post.likesCount}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                              <MessageSquare className="w-5 h-5 text-gray-500" />
                              <span>{post.commentsCount}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                              <Share2 className="w-5 h-5 text-gray-500" />
                              <span>{post.sharesCount}</span>
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-5 h-5 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Trending Topics</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.length > 0 ? (
                  trendingTopics.map((topic) => (
                    <div key={topic.tag} className="flex items-center justify-between">
                      <span className="text-blue-600 font-medium">#{topic.tag}</span>
                      <span className="text-xs text-gray-500">{topic.count} posts</span>
                    </div>
                  ))
                ) : (
                  // Fallback to default topics if no trending data
                  ['#HALO', '#TechNews', '#Innovation', '#Community', '#DigitalAge'].map((topic) => (
                    <div key={topic} className="flex items-center justify-between">
                      <span className="text-blue-600 font-medium">{topic}</span>
                      <span className="text-xs text-gray-500">0 posts</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Your Stats</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Posts</span>
                  <span className="font-semibold">{userStats.posts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-semibold">{userStats.followers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Following</span>
                  <span className="font-semibold">{userStats.following}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Likes</span>
                  <span className="font-semibold">{userStats.likes}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}