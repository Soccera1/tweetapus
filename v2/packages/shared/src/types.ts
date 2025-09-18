import { z } from "zod";

// User schemas
export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/),
  name: z.string().min(1).max(50),
  email: z.string().email().optional(),
  bio: z.string().max(160).optional(),
  location: z.string().max(30).optional(),
  website: z.string().url().optional(),
  pronouns: z.string().max(20).optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Post schemas
export const CreatePostSchema = z.object({
  content: z.string().min(1).max(280),
  replyTo: z.string().optional(),
  quoteTweetId: z.string().optional(),
  replyRestriction: z
    .enum(["everyone", "followers", "following", "verified"])
    .default("everyone"),
  poll: z
    .object({
      options: z.array(z.string().min(1).max(25)).min(2).max(4),
      expiresAt: z.string().datetime(),
    })
    .optional(),
});

export const UpdatePostSchema = z.object({
  content: z.string().min(1).max(280),
});

// DM schemas
export const CreateConversationSchema = z.object({
  participants: z.array(z.string()).min(1),
  title: z.string().max(100).optional(),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  conversationId: z.string(),
});

// Admin schemas
export const SuspendUserSchema = z.object({
  reason: z.string().min(1).max(500),
  severity: z.number().min(1).max(5),
  duration: z.number().positive().optional(), // minutes
  notes: z.string().max(1000).optional(),
});

// General types
export type User = {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  location?: string;
  website?: string;
  pronouns?: string;
  verified: boolean;
  admin: boolean;
  suspended: boolean;
  private: boolean;
  theme?: string;
  accentColor?: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  createdAt: Date;
};

export type Post = {
  id: string;
  userId: string;
  content: string;
  replyTo?: string;
  quoteTweetId?: string;
  pollId?: string;
  source?: string;
  pinned: boolean;
  replyRestriction: "everyone" | "followers" | "following" | "verified";
  likeCount: number;
  replyCount: number;
  retweetCount: number;
  quoteCount: number;
  createdAt: Date;
  author?: User;
  poll?: Poll;
  quotedTweet?: Post;
  attachments?: Attachment[];
};

export type Poll = {
  id: string;
  postId: string;
  expiresAt: Date;
  createdAt: Date;
  options: PollOption[];
  totalVotes: number;
  userVote?: string; // option id
};

export type PollOption = {
  id: string;
  pollId: string;
  optionText: string;
  voteCount: number;
  optionOrder: number;
};

export type Attachment = {
  id: string;
  postId: string;
  fileHash: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: Date;
};

export type Conversation = {
  id: string;
  type: "direct" | "group";
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "text" | "image" | "video";
  createdAt: Date;
  editedAt?: Date;
  sender: User;
  attachments?: MessageAttachment[];
};

export type MessageAttachment = {
  id: string;
  messageId: string;
  fileHash: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: Date;
};

export type Notification = {
  id: string;
  userId: string;
  type: "like" | "retweet" | "reply" | "follow" | "mention" | "dm";
  content: string;
  relatedId?: string;
  read: boolean;
  createdAt: Date;
};

// API Response types
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T = unknown> = ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>;

// WebSocket message types
export type WSMessage =
  | { type: "authenticate"; token: string }
  | { type: "new_message"; data: Message }
  | { type: "notification"; data: Notification }
  | { type: "user_online"; userId: string }
  | { type: "user_offline"; userId: string };

// Export all schemas
export type {
  CreateUserSchema,
  UpdateUserSchema,
  LoginSchema,
  CreatePostSchema,
  UpdatePostSchema,
  CreateConversationSchema,
  SendMessageSchema,
  SuspendUserSchema,
};
