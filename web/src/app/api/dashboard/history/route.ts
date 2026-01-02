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

    const skip = (page - 1) * limit;

    const where = {
      userId: user.id,
      ...(query && {
        keywords: {
          hasSome: query.split(" ").map((k) => k.toLowerCase()),
        },
      }),
    };

    const [searches, total] = await Promise.all([
      prisma.search.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          keywords: true,
          sourceType: true,
          sourceValue: true,
          matchCount: true,
          videosProcessed: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.search.count({ where }),
    ]);

    return NextResponse.json({
      searches,
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
