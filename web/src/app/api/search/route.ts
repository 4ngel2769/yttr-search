import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { searchSchema } from "@/lib/validations";
import { performSearch } from "@/lib/search";
import { checkRateLimit, getRemainingSearches } from "@/lib/redis";
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
      select: { id: true, tier: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check rate limit
    const canProceed = await checkRateLimit(user.id, user.tier);
    if (!canProceed) {
      const remaining = await getRemainingSearches(user.id, user.tier);
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          remaining,
          message: `You have reached your daily search limit. Upgrade your plan for more searches.`
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
      userId: user.id,
    });

    // Get remaining searches after this one
    const remaining = await getRemainingSearches(user.id, user.tier);

    return NextResponse.json({
      success: true,
      searchId: result.searchId,
      results: result.results,
      totalVideosProcessed: result.totalVideosProcessed,
      totalMatches: result.totalMatches,
      remaining,
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
      select: { id: true, tier: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get remaining searches
    const remaining = await getRemainingSearches(user.id, user.tier);

    // Get recent searches
    const recentSearches = await prisma.search.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    return NextResponse.json({
      remaining,
      tier: user.tier,
      recentSearches: recentSearches.map((s) => ({
        id: s.id,
        keywords: s.keywords,
        sourceType: s.sourceType,
        sourceValue: s.sourceValue,
        matchCount: s._count.results,
        status: s.status,
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
