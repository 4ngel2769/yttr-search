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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Gather stats
    const [
      totalUsers,
      newUsersToday,
      totalSearches,
      searchesToday,
      subscriptionCounts,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.search.count(),
      prisma.search.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.user.groupBy({
        by: ["tier"],
        _count: { tier: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    // Format subscription counts
    const subscriptions = {
      free: 0,
      starter: 0,
      pro: 0,
      enterprise: 0,
    };

    subscriptionCounts.forEach((count) => {
      const tier = count.tier.toLowerCase() as keyof typeof subscriptions;
      if (tier in subscriptions) {
        subscriptions[tier] = count._count.tier;
      }
    });

    // Format recent activity
    const formattedActivity = recentActivity.map((log) => ({
      type: log.action.toLowerCase().includes("search") ? "search" :
            log.action.toLowerCase().includes("subscription") ? "subscription" : "user",
      userId: log.userId,
      userName: log.user?.name || log.user?.email || "Unknown",
      action: log.action.replace(/_/g, " ").toLowerCase(),
      createdAt: log.createdAt.toISOString(),
    }));

    // Calculate revenue (simplified - would need actual payment data)
    const paidUsers = subscriptions.starter + subscriptions.pro + subscriptions.enterprise;
    const monthlyRevenue = 
      subscriptions.starter * 9.99 +
      subscriptions.pro * 24.99 +
      subscriptions.enterprise * 49.99;

    return NextResponse.json({
      totalUsers,
      newUsersToday,
      totalSearches,
      searchesToday,
      revenue: {
        total: monthlyRevenue * 12, // Simplified annual estimate
        thisMonth: monthlyRevenue,
      },
      subscriptions,
      recentActivity: formattedActivity,
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to get admin stats" },
      { status: 500 }
    );
  }
}
