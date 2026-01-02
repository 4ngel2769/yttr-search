import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const search = await prisma.search.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        results: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!search) {
      return NextResponse.json(
        { error: "Search not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      search: {
        id: search.id,
        keywords: search.keywords,
        sourceType: search.sourceType,
        sourceValue: search.sourceValue,
        status: search.status,
        videosProcessed: search.videosProcessed,
        matchCount: search.matchCount,
        createdAt: search.createdAt,
        completedAt: search.completedAt,
      },
      results: search.results.map((r) => ({
        id: r.id,
        videoId: r.videoId,
        videoTitle: r.videoTitle,
        channelTitle: r.channelTitle,
        timestamp: r.timestamp,
        text: r.text,
        matchedKeywords: r.matchedKeywords,
        videoUrl: `https://www.youtube.com/watch?v=${r.videoId}&t=${Math.floor(r.timestamp)}`,
      })),
    });

  } catch (error) {
    console.error("Get search results error:", error);
    return NextResponse.json(
      { error: "Failed to get search results" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const search = await prisma.search.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!search) {
      return NextResponse.json(
        { error: "Search not found" },
        { status: 404 }
      );
    }

    await prisma.searchResult.deleteMany({
      where: { searchId: params.id },
    });

    await prisma.search.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete search error:", error);
    return NextResponse.json(
      { error: "Failed to delete search" },
      { status: 500 }
    );
  }
}
