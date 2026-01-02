import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRemainingSearches, TIER_LIMITS } from "@/lib/redis";

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
      select: { id: true, tier: true },
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
          sourceType: true,
          matchCount: true,
          createdAt: true,
        },
      }),
    ]);

    const remainingSearches = await getRemainingSearches(user.id, user.tier);
    const dailyLimit = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.FREE;

    return NextResponse.json({
      totalSearches,
      searchesToday,
      remainingSearches,
      dailyLimit,
      tier: user.tier,
      savedItems,
      recentSearches,
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to get dashboard stats" },
      { status: 500 }
    );
  }
}
