import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        id,
        userId: user.id,
      },
      include: {
        results: {
          orderBy: { id: "asc" },
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
        searchMode: search.searchMode,
        target: search.target,
        resultsCount: search.resultsCount,
        videosScanned: search.videosScanned,
        createdAt: search.createdAt,
      },
      results: search.results.map((r) => ({
        id: r.id,
        videoId: r.videoId,
        videoTitle: r.videoTitle,
        videoUrl: r.videoUrl,
        matches: r.matches,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        id,
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
      where: { searchId: id },
    });

    await prisma.search.delete({
      where: { id },
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
