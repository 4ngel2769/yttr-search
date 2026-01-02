import { spawn } from 'child_process';
import path from 'path';

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
 * Fetch transcript for a video using Python youtube_transcript_api
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  return new Promise((resolve, reject) => {
    // Use Python from the venv
    const pythonPath = process.env.PYTHON_PATH || 'C:/Users/Angel/Documents/GitHub/yttr-search/.venv/Scripts/python.exe';
    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'fetch_transcript.py');
    
    console.log(`Fetching transcript for ${videoId} using Python...`);
    console.log(`Python path: ${pythonPath}`);
    console.log(`Script path: ${scriptPath}`);
    
    const pythonProcess = spawn(pythonPath, [scriptPath, videoId]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', stderr);
        
        if (stderr.includes('TranscriptsDisabled') || stderr.includes('NoTranscriptFound')) {
          reject(new Error('Transcripts are disabled for this video'));
        } else if (stderr.includes('VideoUnavailable')) {
          reject(new Error('Video not available'));
        } else {
          reject(new Error(`Python script failed: ${stderr}`));
        }
        return;
      }
      
      try {
        const segments = JSON.parse(stdout) as TranscriptSegment[];
        console.log(`Fetched ${segments.length} transcript segments for ${videoId}`);
        resolve(segments);
      } catch (parseError: any) {
        console.error('Failed to parse Python output:', stdout);
        reject(new Error(`Failed to parse transcript: ${parseError.message}`));
      }
    });
    
    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
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
