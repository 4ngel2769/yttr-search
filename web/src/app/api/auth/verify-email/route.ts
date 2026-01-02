import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/email";
import { sendWelcomeEmail } from "@/lib/email";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const result = await verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get user to send welcome email
    const user = await prisma.user.findUnique({
      where: { email: result.email },
      select: { name: true, email: true },
    });

    if (user) {
      try {
        await sendWelcomeEmail(user.email, user.name || "User");
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    }

    return NextResponse.json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during email verification" },
      { status: 500 }
    );
  }
}
