import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format seconds to MM:SS timestamp
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration for display (e.g., "5m 30s", "1h 23m")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Parse human-friendly video count (e.g., "1.3k", "2m") into integer
 */
export function parseMaxVideos(val: string): number {
  const v = val.toLowerCase().replace(',', '').trim();
  if (v.endsWith('k')) {
    return Math.round(parseFloat(v.slice(0, -1)) * 1000);
  }
  if (v.endsWith('m')) {
    return Math.round(parseFloat(v.slice(0, -1)) * 1000000);
  }
  return parseInt(v, 10);
}

/**
 * Parse duration filter expression (e.g., "+5m", "-2h", "30")
 */
export function parseDurationFilter(expr: string): { op: '>' | '<'; seconds: number } | null {
  const match = expr.trim().match(/^([+-])(\d+(?:\.\d+)?)([smh])?$/);
  if (!match) return null;
  
  const [, sign, num, unit] = match;
  const op = sign === '+' ? '>' : '<';
  const multiplier = { s: 1, m: 60, h: 3600 }[unit || 's'] || 1;
  const seconds = parseFloat(num) * multiplier;
  
  return { op, seconds };
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract channel identifier from URL or handle
 */
export function parseChannelInput(input: string): { type: 'id' | 'handle' | 'url'; value: string } {
  // Bare handle (@name)
  if (input.startsWith('@')) {
    return { type: 'handle', value: input.slice(1) };
  }
  
  // Full URL
  if (input.startsWith('http')) {
    const url = new URL(input);
    const pathname = url.pathname;
    
    // /channel/UC...
    const channelMatch = pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (channelMatch) {
      return { type: 'id', value: channelMatch[1] };
    }
    
    // /@handle
    const handleMatch = pathname.match(/\/@([^\/]+)/);
    if (handleMatch) {
      return { type: 'handle', value: handleMatch[1] };
    }
    
    // /c/customname or /user/username
    const customMatch = pathname.match(/\/(c|user)\/([^\/]+)/);
    if (customMatch) {
      return { type: 'handle', value: customMatch[2] };
    }
  }
  
  // Assume it's a channel ID if it starts with UC
  if (input.startsWith('UC')) {
    return { type: 'id', value: input };
  }
  
  // Default to treating as handle
  return { type: 'handle', value: input };
}

/**
 * Extract playlist ID from URL
 */
export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Generate a random API key
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'yttr_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length - 3) + '...';
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    FREE: 'Free',
    TIER1: 'Starter',
    TIER2: 'Pro',
    TIER3: 'Enterprise',
  };
  return names[tier] || tier;
}

/**
 * Get tier color class
 */
export function getTierColorClass(tier: string): string {
  const colors: Record<string, string> = {
    FREE: 'text-gray-500',
    TIER1: 'text-blue-500',
    TIER2: 'text-purple-500',
    TIER3: 'text-yellow-500',
  };
  return colors[tier] || 'text-gray-500';
}
