import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const query = searchParams.get("q") || "";
    const sourceType = searchParams.get("sourceType") || "";
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };
    
    // Filter by search query (fuzzy match on keywords)
    if (query) {
      where.OR = [
        { keywords: { hasSome: query.toLowerCase().split(" ") } },
        { target: { contains: query, mode: "insensitive" } },
      ];
    }
    
    // Filter by source type
    if (sourceType && ["CHANNEL", "VIDEO", "BATCH", "PLAYLIST"].includes(sourceType.toUpperCase())) {
      where.searchMode = sourceType.toUpperCase();
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "matches") {
      orderBy = { resultsCount: sortOrder };
    } else if (sortBy === "date") {
      orderBy = { createdAt: sortOrder };
    }

    const [searches, total] = await Promise.all([
      prisma.search.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          keywords: true,
          searchMode: true,
          target: true,
          resultsCount: true,
          videosScanned: true,
          createdAt: true,
          results: {
            take: 4,
            select: {
              videoId: true,
              videoTitle: true,
              thumbnailUrl: true,
            },
          },
        },
      }),
      prisma.search.count({ where }),
    ]);

    return NextResponse.json({
      searches: searches.map((s) => ({
        id: s.id,
        keywords: s.keywords,
        sourceType: s.searchMode,
        sourceValue: s.target,
        matchCount: s.resultsCount,
        videosProcessed: s.videosScanned,
        status: "COMPLETED",
        createdAt: s.createdAt,
        videos: s.results.map((r) => ({
          videoId: r.videoId,
          videoTitle: r.videoTitle,
          thumbnailUrl: r.thumbnailUrl || `https://i.ytimg.com/vi/${r.videoId}/default.jpg`,
        })),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("Get history error:", error);
    return NextResponse.json(
      { error: "Failed to get history" },
      { status: 500 }
    );
  }
}
