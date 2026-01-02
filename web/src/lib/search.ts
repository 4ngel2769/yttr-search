import { UserTier } from '@prisma/client';
import { prisma } from './prisma';
import {
  getChannelVideos,
  getPlaylistVideos,
  getVideosInfo,
  resolveChannelHandle,
  VideoInfo,
} from './youtube';
import {
  fetchTranscript,
  searchTranscript,
  parseKeywords,
  TranscriptMatch,
  SearchResult,
} from './transcript';
import { extractVideoId, parseChannelInput, extractPlaylistId, parseDurationFilter } from './utils';
import { searchRateLimiter } from './redis';

export interface SearchOptions {
  mode: 'channel' | 'video' | 'batch' | 'playlist';
  keywords: string;
  target: string;
  sort?: 'newest' | 'oldest' | 'popular';
  maxVideos?: number;
  durationFilters?: string[];
  contextWindow?: number;
  userId?: string | null;
  ipAddress?: string;
}

export interface SearchProgress {
  current: number;
  total: number;
  currentVideo?: string;
  status: 'initializing' | 'fetching' | 'searching' | 'complete' | 'error';
  message?: string;
}

export interface FullSearchResult {
  searchId?: string;
  results: SearchResult[];
  totalMatches: number;
  videosScanned: number;
  videosWithMatches: number;
  executionTimeMs: number;
  keywordsNotFound: string[];
  errors: Array<{ videoId: string; error: string }>;
}

// Tier limits
const TIER_LIMITS: Record<UserTier | 'ANONYMOUS', { searches: number; videos: number; batch: number }> = {
  ANONYMOUS: { searches: 10, videos: 50, batch: 50 },
  FREE: { searches: 30, videos: 50, batch: 50 },
  TIER1: { searches: 120, videos: 100, batch: 100 },
  TIER2: { searches: 340, videos: 250, batch: 500 },
  TIER3: { searches: 500, videos: 500, batch: 1000 },
};

/**
 * Get user tier limits
 */
export function getTierLimits(tier: UserTier | null): typeof TIER_LIMITS.FREE {
  return TIER_LIMITS[tier || 'ANONYMOUS'];
}

/**
 * Check rate limit for user
 */
export async function checkRateLimit(
  userId: string | null,
  ipAddress: string,
  tier: UserTier | null
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const identifier = userId || `ip:${ipAddress}`;
  const limits = getTierLimits(tier);
  
  searchRateLimiter.setMaxRequests(limits.searches);
  return searchRateLimiter.check(identifier);
}

/**
 * Main search function
 */
export async function performSearch(
  options: SearchOptions,
  onProgress?: (progress: SearchProgress) => void
): Promise<FullSearchResult> {
  const startTime = Date.now();
  const keywords = parseKeywords(options.keywords);
  
  if (keywords.length === 0) {
    throw new Error('At least one keyword is required');
  }

  let videoIds: string[] = [];
  
  // Initialize progress
  onProgress?.({
    current: 0,
    total: 0,
    status: 'initializing',
    message: 'Initializing search...',
  });

  // Get video IDs based on search mode
  switch (options.mode) {
    case 'channel': {
      onProgress?.({
        current: 0,
        total: 0,
        status: 'fetching',
        message: 'Fetching channel videos...',
      });
      
      const channelInput = parseChannelInput(options.target);
      let channelId = channelInput.value;
      
      if (channelInput.type === 'handle') {
        channelId = await resolveChannelHandle(channelInput.value);
      }
      
      videoIds = await getChannelVideos(channelId, {
        sortOrder: options.sort,
        maxVideos: options.maxVideos,
      });
      break;
    }
    
    case 'video': {
      const videoId = extractVideoId(options.target);
      if (!videoId) {
        throw new Error('Invalid video URL');
      }
      videoIds = [videoId];
      break;
    }
    
    case 'batch': {
      const urls = options.target.split('\n').filter((url) => url.trim());
      videoIds = urls
        .map((url) => extractVideoId(url.trim()))
        .filter((id): id is string => id !== null);
      
      if (videoIds.length === 0) {
        throw new Error('No valid video URLs found');
      }
      break;
    }
    
    case 'playlist': {
      onProgress?.({
        current: 0,
        total: 0,
        status: 'fetching',
        message: 'Fetching playlist videos...',
      });
      
      const playlistId = extractPlaylistId(options.target);
      if (!playlistId) {
        throw new Error('Invalid playlist URL');
      }
      
      videoIds = await getPlaylistVideos(playlistId, options.maxVideos);
      break;
    }
  }

  // Apply duration filters if specified
  if (options.durationFilters && options.durationFilters.length > 0) {
    onProgress?.({
      current: 0,
      total: videoIds.length,
      status: 'fetching',
      message: 'Filtering by duration...',
    });
    
    const videoInfoMap = await getVideosInfo(videoIds);
    const filters = options.durationFilters
      .map(parseDurationFilter)
      .filter((f): f is NonNullable<typeof f> => f !== null);
    
    videoIds = videoIds.filter((id) => {
      const info = videoInfoMap.get(id);
      if (!info) return false;
      
      return filters.every((filter) => {
        if (filter.op === '>') {
          return info.duration >= filter.seconds;
        } else {
          return info.duration <= filter.seconds;
        }
      });
    });
  }

  // Get video info for all videos
  const videoInfoMap = await getVideosInfo(videoIds);
  
  const results: SearchResult[] = [];
  const errors: Array<{ videoId: string; error: string }> = [];
  const foundKeywords = new Set<string>();
  
  // Search each video
  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    const videoInfo = videoInfoMap.get(videoId);
    
    onProgress?.({
      current: i + 1,
      total: videoIds.length,
      currentVideo: videoInfo?.title || videoId,
      status: 'searching',
      message: `Searching video ${i + 1} of ${videoIds.length}...`,
    });
    
    try {
      const transcript = await fetchTranscript(videoId);
      const matches = searchTranscript(transcript, keywords, options.contextWindow || 1);
      
      if (matches.length > 0) {
        // Track found keywords
        matches.forEach((m) => foundKeywords.add(m.keyword.toLowerCase()));
        
        results.push({
          videoId,
          videoTitle: videoInfo?.title || 'Unknown Title',
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnailUrl: videoInfo?.thumbnailUrl || '',
          matches,
          matchCount: matches.length,
        });
      }
    } catch (error: any) {
      errors.push({
        videoId,
        error: error.message || 'Failed to fetch transcript',
      });
    }
  }

  // Calculate keywords not found
  const keywordsNotFound = keywords.filter(
    (k) => !foundKeywords.has(k.toLowerCase())
  );

  const executionTimeMs = Date.now() - startTime;

  // Save search to database
  let searchId: string | undefined;
  if (options.userId || options.ipAddress) {
    try {
      const search = await prisma.search.create({
        data: {
          userId: options.userId || null,
          searchMode: options.mode.toUpperCase() as any,
          keywords,
          target: options.target,
          filters: {
            sort: options.sort,
            maxVideos: options.maxVideos,
            durationFilters: options.durationFilters,
            contextWindow: options.contextWindow,
          },
          resultsCount: results.reduce((acc, r) => acc + r.matchCount, 0),
          videosScanned: videoIds.length,
          executionTimeMs,
          ipAddress: options.ipAddress || null,
        },
      });

      searchId = search.id;

      // Save results
      if (results.length > 0) {
        await prisma.searchResult.createMany({
          data: results.map((r) => ({
            searchId: search.id,
            videoId: r.videoId,
            videoTitle: r.videoTitle,
            videoUrl: r.videoUrl,
            thumbnailUrl: r.thumbnailUrl || null,
            matchCount: r.matchCount,
            matches: r.matches as any,
          })),
        });
      }
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }

  onProgress?.({
    current: videoIds.length,
    total: videoIds.length,
    status: 'complete',
    message: 'Search complete!',
  });

  return {
    searchId,
    results,
    totalMatches: results.reduce((acc, r) => acc + r.matchCount, 0),
    videosScanned: videoIds.length,
    videosWithMatches: results.length,
    executionTimeMs,
    keywordsNotFound,
    errors,
  };
}

/**
 * Get search history for a user
 */
export async function getSearchHistory(
  userId: string,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [searches, total] = await Promise.all([
    prisma.search.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        results: {
          select: {
            videoId: true,
            videoTitle: true,
            matchCount: true,
          },
        },
      },
    }),
    prisma.search.count({ where: { userId } }),
  ]);

  return {
    searches,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get search by ID
 */
export async function getSearchById(searchId: string, userId?: string) {
  const search = await prisma.search.findUnique({
    where: { id: searchId },
    include: {
      results: true,
    },
  });

  if (!search) {
    return null;
  }

  // Check if user owns this search
  if (userId && search.userId !== userId) {
    return null;
  }

  return search;
}

/**
 * Delete search
 */
export async function deleteSearch(searchId: string, userId: string) {
  const search = await prisma.search.findUnique({
    where: { id: searchId },
    select: { userId: true },
  });

  if (!search || search.userId !== userId) {
    throw new Error('Search not found or unauthorized');
  }

  await prisma.search.delete({ where: { id: searchId } });
}

/**
 * Get user usage stats
 */
export async function getUserStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalSearches, monthlySearches, dailySearches, totalVideos, savedItems] =
    await Promise.all([
      prisma.search.count({ where: { userId } }),
      prisma.search.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.search.count({
        where: {
          userId,
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.search.aggregate({
        where: { userId },
        _sum: { videosScanned: true },
      }),
      prisma.savedItem.count({ where: { userId } }),
    ]);

  // Get most searched keywords
  const recentSearches = await prisma.search.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { keywords: true },
  });

  const keywordCounts = new Map<string, number>();
  recentSearches.forEach((s) => {
    s.keywords.forEach((k) => {
      keywordCounts.set(k.toLowerCase(), (keywordCounts.get(k.toLowerCase()) || 0) + 1);
    });
  });

  const topKeywords = Array.from(keywordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  return {
    totalSearches,
    monthlySearches,
    dailySearches,
    totalVideosScanned: totalVideos._sum.videosScanned || 0,
    savedItems,
    topKeywords,
  };
}
