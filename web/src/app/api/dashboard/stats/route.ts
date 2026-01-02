import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchRateLimiter } from "@/lib/redis";
import { getTierLimits } from "@/lib/search";

export async function GET() {
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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get statistics
    const [totalSearches, searchesToday, savedItems, recentSearches] = await Promise.all([
      prisma.search.count({
        where: { userId: user.id },
      }),
      prisma.search.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.savedItem.count({
        where: { userId: user.id },
      }),
      prisma.search.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          keywords: true,
          searchMode: true,
          resultsCount: true,
          createdAt: true,
          target: true,
          results: {
            take: 3,
            select: {
              videoId: true,
              videoTitle: true,
              thumbnailUrl: true,
            },
          },
        },
      }),
    ]);

    // Calculate remaining searches based on actual usage
    const tierLimits = getTierLimits(user.tier);
    const dailyLimit = user.isAdmin ? 999999 : tierLimits.searches;
    const remainingSearches = user.isAdmin ? 999999 : Math.max(0, dailyLimit - searchesToday);

    return NextResponse.json({
      totalSearches,
      searchesToday,
      remainingSearches,
      dailyLimit,
      tier: user.tier,
      savedItems,
      recentSearches: recentSearches.map((s) => ({
        id: s.id,
        keywords: s.keywords,
        sourceType: s.searchMode,
        sourceValue: s.target,
        matchCount: s.resultsCount,
        createdAt: s.createdAt,
        videos: s.results.map((r) => ({
          videoId: r.videoId,
          videoTitle: r.videoTitle,
          thumbnailUrl: r.thumbnailUrl || `https://i.ytimg.com/vi/${r.videoId}/default.jpg`,
        })),
      })),
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to get dashboard stats" },
      { status: 500 }
    );
  }
}
