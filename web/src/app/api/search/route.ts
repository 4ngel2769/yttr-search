import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { searchSchema } from "@/lib/validations";
import { performSearch, getTierLimits } from "@/lib/search";
import { searchRateLimiter, anonymousSearchRateLimiter } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

// Anonymous rate limiter (10 searches per day)
const ANONYMOUS_DAILY_LIMIT = 10;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || 
                      headersList.get("x-real-ip") || 
                      "unknown";
    
    let user = null;
    let userId: string | null = null;
    let isAdmin = false;
    let rateLimitResult = { allowed: true, remaining: ANONYMOUS_DAILY_LIMIT, resetAt: new Date() };
    
    // Check if user is authenticated
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, tier: true, isAdmin: true },
      });
      
      if (user) {
        userId = user.id;
        isAdmin = user.isAdmin;
        
        // Check rate limit for authenticated users (skip for admins)
        if (!isAdmin) {
          rateLimitResult = await searchRateLimiter.check(user.id);
        } else {
          rateLimitResult = { allowed: true, remaining: 999999, resetAt: new Date() };
        }
      }
    } else {
      // Anonymous user - use IP-based rate limiting with dedicated limiter
      const anonKey = `anon:${ipAddress}`;
      rateLimitResult = await anonymousSearchRateLimiter.check(anonKey);
    }
    
    // Check if rate limit exceeded
    if (!rateLimitResult.allowed) {
      const message = session?.user?.email 
        ? "You have reached your daily search limit. Upgrade your plan for more searches."
        : "You have reached the free search limit. Sign up for a free account to get more searches!";
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          remaining: 0,
          message
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validationResult = searchSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const searchParams = validationResult.data;

    // Perform the search
    const result = await performSearch({
      ...searchParams,
      userId: userId,
      ipAddress: ipAddress,
      maxVideos: searchParams.maxVideos ? parseInt(searchParams.maxVideos) : undefined,
    });

    // Transform results to flatten matches for the frontend
    // Backend returns: { videoId, videoTitle, videoUrl, matches: [{ keyword, timestamp, text, ... }] }
    // Frontend expects: [{ id, videoId, videoTitle, timestamp, text, matchedKeywords, videoUrl }]
    const flattenedResults = result.results.flatMap((videoResult) => 
      videoResult.matches.map((match, matchIndex) => ({
        id: `${videoResult.videoId}-${matchIndex}`,
        videoId: videoResult.videoId,
        videoTitle: videoResult.videoTitle,
        channelTitle: '', // Not available from current data
        timestamp: match.timestamp,
        text: `${match.contextBefore} ${match.text} ${match.contextAfter}`.trim(),
        matchedKeywords: [match.keyword],
        videoUrl: `https://www.youtube.com/watch?v=${videoResult.videoId}&t=${Math.floor(match.timestamp)}s`,
      }))
    );

    return NextResponse.json({
      success: true,
      searchId: result.searchId,
      results: flattenedResults,
      totalVideosProcessed: result.videosScanned,
      totalMatches: result.totalMatches,
      remaining: rateLimitResult.remaining,
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || 
                      headersList.get("x-real-ip") || 
                      "unknown";
    
    // For anonymous users, return basic info with IP-based remaining count
    if (!session?.user?.email) {
      // Check anonymous rate limit status (without incrementing)
      const anonKey = `anon:${ipAddress}`;
      const rateLimitStatus = await anonymousSearchRateLimiter.peek(anonKey);
      
      return NextResponse.json({
        remaining: rateLimitStatus.remaining,
        tier: "ANONYMOUS",
        recentSearches: [],
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, tier: true, isAdmin: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate remaining searches from database
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const searchesToday = await prisma.search.count({
      where: {
        userId: user.id,
        createdAt: { gte: today, lt: tomorrow },
      },
    });
    
    const tierLimits = getTierLimits(user.tier);
    const dailyLimit = user.isAdmin ? 999999 : tierLimits.searches;
    const remaining = user.isAdmin ? 999999 : Math.max(0, dailyLimit - searchesToday);

    // Get recent searches
    const recentSearches = await prisma.search.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        keywords: true,
        searchMode: true,
        target: true,
        resultsCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      remaining,
      tier: user.tier,
      recentSearches: recentSearches.map((s) => ({
        id: s.id,
        keywords: s.keywords,
        sourceType: s.searchMode,
        sourceValue: s.target,
        matchCount: s.resultsCount,
        status: "COMPLETED",
        createdAt: s.createdAt,
      })),
    });

  } catch (error) {
    console.error("Get search info error:", error);
    return NextResponse.json(
      { error: "Failed to get search info" },
      { status: 500 }
    );
  }
}
