import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { createVerificationToken, sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    // Create reset token and send email
    try {
      const token = await createVerificationToken(`reset:${normalizedEmail}`);
      await sendPasswordResetEmail(normalizedEmail, token);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
    }

    return NextResponse.json({
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
