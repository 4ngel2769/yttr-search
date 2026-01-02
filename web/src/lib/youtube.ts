import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// API key rotation for quota management
const apiKeys = [
  process.env.YOUTUBE_API_KEY,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getNextApiKey(): string {
  const key = apiKeys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  return key;
}

function getYouTubeClient() {
  return google.youtube({
    version: 'v3',
    auth: getNextApiKey(),
  });
}

export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration: number; // seconds
  viewCount: number;
}

export interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  itemCount: number;
}

/**
 * Resolve channel handle to channel ID
 */
export async function resolveChannelHandle(handle: string): Promise<string> {
  const yt = getYouTubeClient();
  
  // Try forHandle first (newer API)
  try {
    const response = await yt.channels.list({
      part: ['id'],
      forHandle: handle,
    });
    
    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id!;
    }
  } catch (error) {
    // forHandle might not work for all handles
  }
  
  // Try forUsername
  try {
    const response = await yt.channels.list({
      part: ['id'],
      forUsername: handle,
    });
    
    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id!;
    }
  } catch (error) {
    // Continue to search
  }
  
  // Fallback: search for channel
  const searchResponse = await yt.search.list({
    part: ['id'],
    q: handle,
    type: ['channel'],
    maxResults: 1,
  });
  
  if (searchResponse.data.items && searchResponse.data.items.length > 0) {
    return searchResponse.data.items[0].id!.channelId!;
  }
  
  throw new Error(`Cannot resolve channel: ${handle}`);
}

/**
 * Get channel info by ID
 */
export async function getChannelInfo(channelId: string): Promise<ChannelInfo> {
  const yt = getYouTubeClient();
  
  const response = await yt.channels.list({
    part: ['snippet', 'statistics'],
    id: [channelId],
  });
  
  if (!response.data.items || response.data.items.length === 0) {
    throw new Error(`Channel not found: ${channelId}`);
  }
  
  const channel = response.data.items[0];
  
  return {
    id: channel.id!,
    title: channel.snippet?.title || 'Unknown',
    description: channel.snippet?.description || '',
    thumbnailUrl: channel.snippet?.thumbnails?.high?.url || '',
    subscriberCount: parseInt(channel.statistics?.subscriberCount || '0', 10),
    videoCount: parseInt(channel.statistics?.videoCount || '0', 10),
  };
}

/**
 * Get video info by ID
 */
export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const yt = getYouTubeClient();
  
  const response = await yt.videos.list({
    part: ['snippet', 'contentDetails', 'statistics'],
    id: [videoId],
  });
  
  if (!response.data.items || response.data.items.length === 0) {
    throw new Error(`Video not found: ${videoId}`);
  }
  
  const video = response.data.items[0];
  
  return {
    id: video.id!,
    title: video.snippet?.title || 'Unknown',
    description: video.snippet?.description || '',
    thumbnailUrl: video.snippet?.thumbnails?.high?.url || '',
    channelId: video.snippet?.channelId || '',
    channelTitle: video.snippet?.channelTitle || '',
    publishedAt: video.snippet?.publishedAt || '',
    duration: parseDuration(video.contentDetails?.duration || 'PT0S'),
    viewCount: parseInt(video.statistics?.viewCount || '0', 10),
  };
}

/**
 * Get videos from a channel
 */
export async function getChannelVideos(
  channelId: string,
  options: {
    sortOrder?: 'newest' | 'oldest' | 'popular';
    maxVideos?: number;
  } = {}
): Promise<string[]> {
  const yt = getYouTubeClient();
  const { sortOrder = 'newest', maxVideos } = options;
  
  const videoIds: string[] = [];
  let pageToken: string | undefined;
  
  const order = sortOrder === 'popular' ? 'viewCount' : 'date';
  
  while (true) {
    const response = await yt.search.list({
      part: ['id'],
      channelId,
      type: ['video'],
      order,
      maxResults: 50,
      pageToken,
    });
    
    if (!response.data.items) break;
    
    for (const item of response.data.items) {
      if (item.id?.videoId) {
        videoIds.push(item.id.videoId);
        if (maxVideos && videoIds.length >= maxVideos) {
          break;
        }
      }
    }
    
    if (maxVideos && videoIds.length >= maxVideos) break;
    if (!response.data.nextPageToken) break;
    
    pageToken = response.data.nextPageToken;
  }
  
  // If oldest, reverse the list (API doesn't support oldest order directly)
  if (sortOrder === 'oldest') {
    videoIds.reverse();
  }
  
  return maxVideos ? videoIds.slice(0, maxVideos) : videoIds;
}

/**
 * Get videos from a playlist
 */
export async function getPlaylistVideos(
  playlistId: string,
  maxVideos?: number
): Promise<string[]> {
  const yt = getYouTubeClient();
  const videoIds: string[] = [];
  let pageToken: string | undefined;
  
  while (true) {
    const response = await yt.playlistItems.list({
      part: ['contentDetails'],
      playlistId,
      maxResults: 50,
      pageToken,
    });
    
    if (!response.data.items) break;
    
    for (const item of response.data.items) {
      if (item.contentDetails?.videoId) {
        videoIds.push(item.contentDetails.videoId);
        if (maxVideos && videoIds.length >= maxVideos) {
          break;
        }
      }
    }
    
    if (maxVideos && videoIds.length >= maxVideos) break;
    if (!response.data.nextPageToken) break;
    
    pageToken = response.data.nextPageToken;
  }
  
  return videoIds;
}

/**
 * Get playlist info
 */
export async function getPlaylistInfo(playlistId: string): Promise<PlaylistInfo> {
  const yt = getYouTubeClient();
  
  const response = await yt.playlists.list({
    part: ['snippet', 'contentDetails'],
    id: [playlistId],
  });
  
  if (!response.data.items || response.data.items.length === 0) {
    throw new Error(`Playlist not found: ${playlistId}`);
  }
  
  const playlist = response.data.items[0];
  
  return {
    id: playlist.id!,
    title: playlist.snippet?.title || 'Unknown',
    description: playlist.snippet?.description || '',
    thumbnailUrl: playlist.snippet?.thumbnails?.high?.url || '',
    channelTitle: playlist.snippet?.channelTitle || '',
    itemCount: playlist.contentDetails?.itemCount || 0,
  };
}

/**
 * Batch get video info
 */
export async function getVideosInfo(videoIds: string[]): Promise<Map<string, VideoInfo>> {
  const yt = getYouTubeClient();
  const results = new Map<string, VideoInfo>();
  
  // Process in batches of 50
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    
    const response = await yt.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: batch,
    });
    
    if (response.data.items) {
      for (const video of response.data.items) {
        results.set(video.id!, {
          id: video.id!,
          title: video.snippet?.title || 'Unknown',
          description: video.snippet?.description || '',
          thumbnailUrl: video.snippet?.thumbnails?.high?.url || '',
          channelId: video.snippet?.channelId || '',
          channelTitle: video.snippet?.channelTitle || '',
          publishedAt: video.snippet?.publishedAt || '',
          duration: parseDuration(video.contentDetails?.duration || 'PT0S'),
          viewCount: parseInt(video.statistics?.viewCount || '0', 10),
        });
      }
    }
  }
  
  return results;
}

/**
 * Parse ISO 8601 duration to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

export { youtube };
