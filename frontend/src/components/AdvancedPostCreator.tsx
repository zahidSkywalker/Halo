'use client';

import React, { useState, useRef } from 'react';
import { 
  Send, 
  Image, 
  Video, 
  Smile, 
  Hash, 
  AtSign, 
  X, 
  MapPin, 
  Globe,
  Lock,
  Users,
  Camera,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface AdvancedPostCreatorProps {
  user: any;
  onPostCreated: () => void;
}

export function AdvancedPostCreator({ user, onPostCreated }: AdvancedPostCreatorProps) {
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'followers' | 'private'>('public');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [charCount, setCharCount] = useState(0);
  const [suggestedHashtags] = useState(['HALO', 'TechNews', 'Innovation', 'Community', 'DigitalAge', 'SocialMedia', 'Web3', 'AI', 'Startup', 'Design']);
  const [suggestedUsers] = useState(['john_doe', 'jane_smith', 'tech_guru', 'design_master', 'code_ninja']);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const MAX_CHARS = 1000;
  const MAX_MEDIA = 4;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setCharCount(newContent.length);
    
    // Auto-extract hashtags and mentions
    const hashtagMatches = newContent.match(/#\w+/g) || [];
    const mentionMatches = newContent.match(/@\w+/g) || [];
    
    setHashtags([...new Set(hashtagMatches.map(tag => tag.slice(1)))]);
    setMentions([...new Set(mentionMatches.map(mention => mention.slice(1)))]);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedMedia.length + files.length > MAX_MEDIA) {
      toast({
        title: 'Too many files',
        description: `You can only upload up to ${MAX_MEDIA} files`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        toast({
          title: 'Invalid file type',
          description: 'Only images and videos are allowed',
          variant: 'destructive',
        });
      }
      
      if (!isValidSize) {
        toast({
          title: 'File too large',
          description: 'Files must be under 10MB',
          variant: 'destructive',
        });
      }
      
      return isValidType && isValidSize;
    });

    setSelectedMedia([...selectedMedia, ...validFiles]);
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
  };

  const addHashtag = (tag: string) => {
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setContent(content + ` #${tag}`);
    }
  };

  const addMention = (username: string) => {
    if (!mentions.includes(username)) {
      setMentions([...mentions, username]);
      setContent(content + ` @${username}`);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedMedia.length === 0) {
      toast({
        title: 'Empty post',
        description: 'Please add some content or media to your post',
        variant: 'destructive',
      });
      return;
    }

    if (charCount > MAX_CHARS) {
      toast({
        title: 'Post too long',
        description: `Posts cannot exceed ${MAX_CHARS} characters`,
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
        content: content.trim(),
        hashtags,
        mentions,
        privacy,
        location: location || undefined,
      };

      console.log('🚀 Creating advanced post with data:', postData);

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Advanced post created successfully:', data);
        
        toast({
          title: 'Success! 🎉',
          description: 'Your advanced post has been created successfully!',
        });
        
        // Reset form
        setContent('');
        setSelectedMedia([]);
        setHashtags([]);
        setMentions([]);
        setLocation('');
        setPrivacy('public');
        setCharCount(0);
        setShowAdvanced(false);
        
        // Notify parent
        onPostCreated();
      } else {
        const errorData = await response.json();
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error creating advanced post:', error);
      toast({
        title: 'Error Creating Post',
        description: error instanceof Error ? error.message : 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPrivacyIcon = () => {
    switch (privacy) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'followers': return <Users className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getPrivacyText = () => {
    switch (privacy) {
      case 'public': return 'Everyone';
      case 'followers': return 'Followers';
      case 'private': return 'Private';
      default: return 'Everyone';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Create Advanced Post</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.profilePicture} />
            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{user.displayName}</p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>@{user.username}</span>
              <span>•</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setPrivacy(privacy === 'public' ? 'followers' : privacy === 'followers' ? 'private' : 'public')}
              >
                {getPrivacyIcon()}
                <span className="ml-1">{getPrivacyText()}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Input */}
        <div className="relative">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="What's happening in your world? Use #hashtags and @mentions!"
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            maxLength={MAX_CHARS}
          />
          
          {/* Character Count */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {charCount}/{MAX_CHARS}
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            {/* Location */}
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Add location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Suggested hashtags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedHashtags.slice(0, 8).map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-blue-50"
                    onClick={() => addHashtag(tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Your hashtags:</span>
                  {hashtags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      #{tag}
                      <button
                        onClick={() => setHashtags(hashtags.filter((_, i) => i !== index))}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Mentions */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AtSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Suggested users:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedUsers.slice(0, 5).map((username) => (
                  <Badge 
                    key={username} 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-green-50"
                    onClick={() => addMention(username)}
                  >
                    @{username}
                  </Badge>
                ))}
              </div>
              {mentions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Your mentions:</span>
                  {mentions.map((mention, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      @{mention}
                      <button
                        onClick={() => setMentions(mentions.filter((_, i) => i !== index))}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Media Preview */}
        {selectedMedia.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {selectedMedia.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Media ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-32 object-cover rounded-lg"
                    controls
                  />
                )}
                
                <button
                  onClick={() => removeMedia(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-2">
            {/* Media Upload */}
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
              />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Camera className="w-4 h-4" />
              </Button>
            </label>

            {/* Emoji */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Smile className="w-4 h-4" />
            </Button>

            {/* Hashtag */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => addHashtag('HALO')}
            >
              <Hash className="w-4 h-4" />
            </Button>

            {/* Mention */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => addMention('friend')}
            >
              <AtSign className="w-4 h-4" />
            </Button>
          </div>

          {/* Post Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (!content.trim() && selectedMedia.length === 0)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}