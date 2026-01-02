// @ts-ignore - youtube-transcript doesn't have types
import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptSegment {
  text: string;
  start: number; // seconds
  duration: number;
}

export interface TranscriptMatch {
  keyword: string;
  timestamp: number;
  text: string;
  contextBefore: string;
  contextAfter: string;
}

export interface SearchResult {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl: string;
  matches: TranscriptMatch[];
  matchCount: number;
}

/**
 * Fetch transcript for a video
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    return transcript.map((segment: any) => ({
      text: segment.text || '',
      start: segment.offset / 1000 || segment.start || 0,
      duration: segment.duration / 1000 || segment.dur || 0,
    }));
  } catch (error: any) {
    if (error.message?.includes('Transcript is disabled')) {
      throw new Error('Transcripts are disabled for this video');
    }
    if (error.message?.includes('No transcript')) {
      throw new Error('No transcript available for this video');
    }
    throw error;
  }
}

/**
 * Search transcript for keywords
 */
export function searchTranscript(
  segments: TranscriptSegment[],
  keywords: string[],
  contextWindow: number = 1
): TranscriptMatch[] {
  const matches: TranscriptMatch[] = [];
  const normalizedKeywords = keywords.map(k => k.toLowerCase().trim());
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const text = segment.text.toLowerCase();
    
    for (const keyword of normalizedKeywords) {
      if (text.includes(keyword)) {
        // Get context
        const contextBeforeSegments: string[] = [];
        const contextAfterSegments: string[] = [];
        
        for (let j = Math.max(0, i - contextWindow); j < i; j++) {
          contextBeforeSegments.push(segments[j].text);
        }
        
        for (let j = i + 1; j <= Math.min(segments.length - 1, i + contextWindow); j++) {
          contextAfterSegments.push(segments[j].text);
        }
        
        matches.push({
          keyword,
          timestamp: segment.start,
          text: segment.text,
          contextBefore: contextBeforeSegments.join(' '),
          contextAfter: contextAfterSegments.join(' '),
        });
      }
    }
  }
  
  // Remove duplicate timestamps (if multiple keywords match same segment)
  const uniqueMatches = matches.reduce((acc, match) => {
    const key = `${match.timestamp}-${match.keyword}`;
    if (!acc.has(key)) {
      acc.set(key, match);
    }
    return acc;
  }, new Map<string, TranscriptMatch>());
  
  return Array.from(uniqueMatches.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Highlight keywords in text with HTML spans
 */
export function highlightKeywords(text: string, keywords: string[]): string {
  const colors = ['bg-cyan-500', 'bg-lime-500', 'bg-red-500', 'bg-green-500'];
  let highlighted = text;
  
  keywords.forEach((keyword, index) => {
    const color = colors[index % colors.length];
    const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi');
    highlighted = highlighted.replace(
      regex,
      `<span class="${color} text-black px-1 rounded">\$1</span>`
    );
  });
  
  return highlighted;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse keywords from comma-separated string
 * Supports quoted phrases: "machine learning", data
 */
export function parseKeywords(input: string): string[] {
  const keywords: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      if (current.trim()) {
        keywords.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    keywords.push(current.trim());
  }
  
  return keywords.filter(k => k.length > 0);
}

/**
 * Generate YouTube jump link
 */
export function generateJumpLink(videoId: string, seconds: number): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`;
}
