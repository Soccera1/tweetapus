/**
 * Generate a UUID v7 using Bun's implementation
 */
export function generateId(): string {
  return Bun.randomUUIDv7();
}

/**
 * Hash a string using SHA-256
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return str.replace(/[&<>"'/]/g, (s) => map[s] || s);
}

/**
 * Format relative time (e.g., "2h", "1d", "3w")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) return `${diffSeconds}s`;
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;

  // For older dates, show actual date
  return date.toLocaleDateString();
}

/**
 * Extract mentions from text (e.g., @username)
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Extract hashtags from text (e.g., #hashtag)
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }

  return [...new Set(hashtags)]; // Remove duplicates
}
/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`;
}

/**
 * Validate image file type
 */
export function isValidImageType(mimeType: string): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  return validTypes.includes(mimeType);
}

/**
 * Validate video file type
 */
export function isValidVideoType(mimeType: string): boolean {
  const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
  return validTypes.includes(mimeType);
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: Timer | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
