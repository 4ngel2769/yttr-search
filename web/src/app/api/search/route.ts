import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { searchSchema } from "@/lib/validations";
import { performSearch, getTierLimits } from "@/lib/search";
import { searchRateLimiter } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
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

    // Check rate limit (skip for admins)
    let rateLimitResult = { allowed: true, remaining: 999999, resetAt: new Date() };
    if (!user.isAdmin) {
      rateLimitResult = await searchRateLimiter.check(user.id);
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { 
            error: "Rate limit exceeded",
            remaining: 0,
            message: `You have reached your daily search limit. Upgrade your plan for more searches.`
          },
          { status: 429 }
        );
      }
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
      userId: user.id,
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
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
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
