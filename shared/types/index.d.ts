export interface User {
    id: string;
    email: string;
    username: string;
    displayName: string;
    bio?: string;
    profilePicture?: string;
    coverPhoto?: string;
    isVerified: boolean;
    isPrivate: boolean;
    location?: string;
    website?: string;
    birthDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    followersCount: number;
    followingCount: number;
    postsCount: number;
}
export interface UserProfile extends User {
    isFollowing?: boolean;
    isFollowedBy?: boolean;
    isBlocked?: boolean;
}
export interface AuthUser {
    id: string;
    email: string;
    username: string;
    displayName: string;
    profilePicture?: string;
    isVerified: boolean;
    role: UserRole;
}
export declare enum UserRole {
    USER = "user",
    MODERATOR = "moderator",
    ADMIN = "admin"
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    username: string;
    displayName: string;
    password: string;
}
export interface Post {
    id: string;
    content: string;
    authorId: string;
    author: User;
    media?: Media[];
    hashtags: string[];
    mentions: string[];
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreatePostData {
    content: string;
    media?: File[];
    hashtags?: string[];
    mentions?: string[];
}
export interface Media {
    id: string;
    url: string;
    type: MediaType;
    altText?: string;
    width?: number;
    height?: number;
}
export declare enum MediaType {
    IMAGE = "image",
    VIDEO = "video",
    GIF = "gif"
}
export interface Comment {
    id: string;
    content: string;
    authorId: string;
    author: User;
    postId: string;
    parentId?: string;
    replies: Comment[];
    likesCount: number;
    isLiked?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Notification {
    id: string;
    type: NotificationType;
    userId: string;
    actorId?: string;
    actor?: User;
    postId?: string;
    commentId?: string;
    messageId?: string;
    isRead: boolean;
    createdAt: Date;
}
export declare enum NotificationType {
    LIKE = "like",
    COMMENT = "comment",
    SHARE = "share",
    FOLLOW = "follow",
    MENTION = "mention",
    MESSAGE = "message"
}
export interface Message {
    id: string;
    content: string;
    senderId: string;
    sender: User;
    conversationId: string;
    media?: Media[];
    isRead: boolean;
    createdAt: Date;
}
export interface Conversation {
    id: string;
    participants: User[];
    lastMessage?: Message;
    unreadCount: number;
    updatedAt: Date;
}
export interface FeedPost extends Post {
    isRepost?: boolean;
    originalPost?: Post;
    repostedBy?: User;
}
export interface FeedResponse {
    posts: FeedPost[];
    hasMore: boolean;
    nextCursor?: string;
}
export interface SearchResult {
    users: User[];
    posts: Post[];
    hashtags: string[];
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
        nextCursor?: string;
    };
}
export interface ApiError {
    message: string;
    code: string;
    status: number;
    details?: any;
}
export interface SocketEvents {
    'user:connect': {
        userId: string;
    };
    'user:disconnect': {
        userId: string;
    };
    'notification:new': Notification;
    'notification:read': {
        notificationId: string;
    };
    'message:new': Message;
    'message:read': {
        messageId: string;
        conversationId: string;
    };
    'message:typing': {
        conversationId: string;
        userId: string;
        isTyping: boolean;
    };
    'post:new': Post;
    'post:like': {
        postId: string;
        userId: string;
        isLiked: boolean;
    };
    'post:comment': {
        postId: string;
        comment: Comment;
    };
    'user:follow': {
        followerId: string;
        followedId: string;
        isFollowing: boolean;
    };
}
//# sourceMappingURL=index.d.ts.map