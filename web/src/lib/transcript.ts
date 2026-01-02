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
    
    // Debug: log first segment to understand the structure
    if (transcript.length > 0) {
      console.log('Transcript segment count:', transcript.length);
      console.log('First segment structure:', JSON.stringify(transcript[0]));
      console.log('First segment text:', transcript[0].text);
    } else {
      console.log('Transcript is empty');
    }
    
    return transcript.map((segment: any) => {
      // Handle different property names from different versions of youtube-transcript
      // v1.x uses: { text, offset (ms), duration (ms) }
      // Some versions use: { text, start (sec), dur (sec) }
      let startTime = 0;
      if (typeof segment.offset === 'number') {
        startTime = segment.offset / 1000; // offset is in milliseconds
      } else if (typeof segment.start === 'number') {
        startTime = segment.start; // start is already in seconds
      }
      
      let durationTime = 0;
      if (typeof segment.duration === 'number') {
        // If duration > 100, assume it's milliseconds
        durationTime = segment.duration > 100 ? segment.duration / 1000 : segment.duration;
      } else if (typeof segment.dur === 'number') {
        durationTime = segment.dur;
      }
      
      return {
        text: segment.text || '',
        start: startTime,
        duration: durationTime,
      };
    });
  } catch (error: any) {
    console.error('Transcript fetch error for video', videoId, ':', error);
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
  
  console.log(`Searching ${segments.length} segments for keywords:`, normalizedKeywords);

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const text = segment.text.toLowerCase();
    
    for (const keyword of normalizedKeywords) {
      if (text.includes(keyword)) {
        console.log(`Match found for '${keyword}' in segment:`, text);
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
