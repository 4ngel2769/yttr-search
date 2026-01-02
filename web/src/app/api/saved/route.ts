import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const items = await prisma.savedItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      items,
      total: items.length,
    });

  } catch (error) {
    console.error("Get saved items error:", error);
    return NextResponse.json(
      { error: "Failed to get saved items" },
      { status: 500 }
    );
  }
}

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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { videoId, videoTitle, notes } = body;

    // Check if already saved
    const existing = await prisma.savedItem.findFirst({
      where: {
        userId: user.id,
        itemType: "VIDEO",
        itemId: videoId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Item already saved" },
        { status: 400 }
      );
    }

    const item = await prisma.savedItem.create({
      data: {
        userId: user.id,
        itemType: "VIDEO",
        itemId: videoId,
        itemTitle: videoTitle,
        itemUrl: `https://www.youtube.com/watch?v=${videoId}`,
        notes,
      },
    });

    return NextResponse.json(item, { status: 201 });

  } catch (error) {
    console.error("Save item error:", error);
    return NextResponse.json(
      { error: "Failed to save item" },
      { status: 500 }
    );
  }
}
