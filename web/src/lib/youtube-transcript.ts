/**
 * YouTube Transcript Fetcher
 * Pure TypeScript implementation based on youtube_transcript_api Python library
 * Scrapes YouTube's internal API to fetch video transcripts
 */

import { XMLParser } from 'fast-xml-parser';
import { request, Agent } from 'undici';

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface CaptionTrack {
  baseUrl: string;
  name: string;
  languageCode: string;
  isTranslatable: boolean;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CONSENT_COOKIE = 'CONSENT=YES+cb.20210328-17-p0.en+FX+';

// Create a shared agent for connection pooling
const agent = new Agent({
  keepAliveTimeout: 10000,
  keepAliveMaxTimeout: 30000,
});

/**
 * Fetch transcript for a YouTube video
 */
export async function fetchYouTubeTranscript(videoId: string, lang: string = 'en'): Promise<TranscriptSegment[]> {
  // Step 1: Fetch the video page to get caption tracks
  const { tracks, html } = await getVideoPageData(videoId);
  
  if (tracks.length === 0) {
    throw new Error('No captions available for this video');
  }

  // Step 2: Find the best matching track
  let selectedTrack = tracks.find(t => t.languageCode === lang);
  if (!selectedTrack) {
    selectedTrack = tracks.find(t => t.languageCode.startsWith('en'));
  }
  if (!selectedTrack) {
    selectedTrack = tracks[0];
  }

  // Step 3: Fetch and parse the transcript
  return await fetchTranscriptFromUrl(selectedTrack.baseUrl, html);
}

/**
 * Get video page data including caption tracks
 */
async function getVideoPageData(videoId: string): Promise<{ tracks: CaptionTrack[], html: string }> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  const { statusCode, body } = await request(watchUrl, {
    method: 'GET',
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cookie': CONSENT_COOKIE,
    },
    dispatcher: agent,
  });

  if (statusCode !== 200) {
    throw new Error(`Failed to fetch video page: ${statusCode}`);
  }

  const html = await body.text();

  // Extract ytInitialPlayerResponse from the page
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  if (!playerResponseMatch) {
    throw new Error('Could not find player response in page');
  }

  let playerResponse: any;
  try {
    playerResponse = JSON.parse(playerResponseMatch[1]);
  } catch (e) {
    throw new Error('Failed to parse player response');
  }

  // Extract caption tracks
  const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  
  if (!captions || captions.length === 0) {
    if (playerResponse?.playabilityStatus?.status === 'ERROR') {
      throw new Error('Video not available');
    }
    throw new Error('No captions available for this video');
  }

  const tracks = captions.map((track: any) => ({
    baseUrl: track.baseUrl,
    name: track.name?.simpleText || track.name?.runs?.[0]?.text || 'Unknown',
    languageCode: track.languageCode,
    isTranslatable: track.isTranslatable || false,
  }));

  return { tracks, html };
}

/**
 * Fetch and parse transcript from caption URL using undici
 */
async function fetchTranscriptFromUrl(captionUrl: string, pageHtml: string): Promise<TranscriptSegment[]> {
  console.log('Fetching transcript from:', captionUrl.substring(0, 100) + '...');
  
  const { statusCode, body } = await request(captionUrl, {
    method: 'GET',
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': '*/*',
      'Referer': 'https://www.youtube.com/',
      'Cookie': CONSENT_COOKIE,
    },
    dispatcher: agent,
  });

  console.log('Response status:', statusCode);

  if (statusCode !== 200) {
    throw new Error(`Failed to fetch transcript: ${statusCode}`);
  }

  const xml = await body.text();
  console.log('Response length:', xml.length);
  console.log('First 200 chars:', xml.substring(0, 200));
  
  if (!xml || xml.length === 0) {
    // Try JSON format
    const jsonUrl = captionUrl + '&fmt=json3';
    console.log('Trying JSON format...');
    
    const { statusCode: jsonStatus, body: jsonBody } = await request(jsonUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'application/json, */*',
        'Referer': 'https://www.youtube.com/',
        'Cookie': CONSENT_COOKIE,
      },
      dispatcher: agent,
    });
    
    if (jsonStatus === 200) {
      const jsonText = await jsonBody.text();
      console.log('JSON response length:', jsonText.length);
      
      if (jsonText && jsonText.length > 0) {
        try {
          const data = JSON.parse(jsonText);
          if (data.events) {
            return data.events
              .filter((e: any) => e.segs)
              .map((e: any) => ({
                text: e.segs.map((s: any) => s.utf8).join(''),
                start: (e.tStartMs || 0) / 1000,
                duration: (e.dDurationMs || 0) / 1000,
              }));
          }
        } catch (e) {
          console.error('Failed to parse JSON transcript:', e);
        }
      }
    }
    
    throw new Error('Empty transcript response');
  }

  // Parse XML
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const result = parser.parse(xml);
  
  // Handle the transcript XML structure
  // Structure: <transcript><text start="0" dur="1.5">Hello</text>...</transcript>
  const transcript = result?.transcript;
  if (!transcript) {
    throw new Error('Invalid transcript XML structure');
  }

  let textElements = transcript.text;
  if (!textElements) {
    return [];
  }

  // Ensure it's an array
  if (!Array.isArray(textElements)) {
    textElements = [textElements];
  }

  return textElements.map((elem: any) => {
    // Text content could be in #text or directly as the value
    let text = '';
    if (typeof elem === 'string') {
      text = elem;
    } else if (elem['#text']) {
      text = elem['#text'];
    } else if (typeof elem === 'object' && !elem['@_start']) {
      // If elem is an object without attributes, it might be the text directly
      text = String(elem);
    }

    // Decode HTML entities
    text = decodeHtmlEntities(text);

    return {
      text,
      start: parseFloat(elem['@_start'] || '0'),
      duration: parseFloat(elem['@_dur'] || '0'),
    };
  });
}

/**
 * Decode common HTML entities in transcript text
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * List available transcripts for a video
 */
export async function listTranscripts(videoId: string): Promise<CaptionTrack[]> {
  const { tracks } = await getVideoPageData(videoId);
  return tracks;
}
