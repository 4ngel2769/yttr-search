import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe";
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
      select: { id: true, email: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, planId } = body;

    if (action === "checkout" && planId) {
      const checkoutUrl = await createCheckoutSession(
        user.id,
        planId,
        `${process.env.NEXTAUTH_URL}/dashboard/settings`
      );
      return NextResponse.json({ url: checkoutUrl });
    }

    if (action === "portal" && user.stripeCustomerId) {
      const portalUrl = await createPortalSession(
        user.id,
        `${process.env.NEXTAUTH_URL}/dashboard/settings`
      );
      return NextResponse.json({ url: portalUrl });
    }

    return NextResponse.json(
      { error: "Invalid action or missing data" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
