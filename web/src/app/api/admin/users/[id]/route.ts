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

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        isAdmin: true,
        createdAt: true,
        emailVerified: true,
        stripeCustomerId: true,
        _count: {
          select: { 
            searches: true,
            savedItems: true,
          },
        },
        subscription: {
          select: {
            status: true,
            stripeCurrentPeriodEnd: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to get user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, id: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tier, isAdmin } = body;

    // Prevent self-demotion
    if (params.id === currentUser.id && isAdmin === false) {
      return NextResponse.json(
        { error: "Cannot remove your own admin privileges" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (tier) updateData.tier = tier;
    if (typeof isAdmin === 'boolean') updateData.isAdmin = isAdmin;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        isAdmin: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: currentUser.id,
        action: "USER_UPDATED",
        targetType: "user",
        targetId: params.id,
        details: { updates: updateData },
      },
    });

    return NextResponse.json(user);

  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
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

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, id: true },
    });

    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (params.id === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user and all related data
    await prisma.$transaction([
      prisma.searchResult.deleteMany({
        where: { search: { userId: params.id } },
      }),
      prisma.search.deleteMany({
        where: { userId: params.id },
      }),
      prisma.savedItem.deleteMany({
        where: { userId: params.id },
      }),
      prisma.subscription.deleteMany({
        where: { userId: params.id },
      }),
      prisma.rateLimit.deleteMany({
        where: { identifier: params.id },
      }),
      prisma.auditLog.deleteMany({
        where: { adminId: params.id },
      }),
      prisma.account.deleteMany({
        where: { userId: params.id },
      }),
      prisma.session.deleteMany({
        where: { userId: params.id },
      }),
      prisma.user.delete({
        where: { id: params.id },
      }),
    ]);

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: currentUser.id,
        action: "USER_DELETED",
        targetType: "user",
        targetId: params.id,
        details: {},
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
