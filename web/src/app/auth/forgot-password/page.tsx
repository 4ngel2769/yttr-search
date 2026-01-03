"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";
import { Search, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

// Check if email verification is enabled
const isEmailVerificationEnabled = process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION !== 'false';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetMethod, setResetMethod] = useState<'password' | 'magic-link'>('password');

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setIsLoading(true);
    try {
      const endpoint = resetMethod === 'magic-link' 
        ? '/api/auth/magic-link'
        : '/api/auth/forgot-password';

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to send reset link",
        });
      } else {
        setIsSuccess(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              {resetMethod === 'magic-link'
                ? "We've sent you a magic link to sign in."
                : "If an account exists with that email, we've sent a password reset link."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Didn&apos;t receive the email? Check your spam folder or wait a few minutes.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setIsSuccess(false)} variant="outline">
                Try another email
              </Button>
              <Button asChild>
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <Search className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">YTTR Search</span>
          </Link>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            {resetMethod === 'magic-link'
              ? "We'll send you a secure link to sign in without a password."
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isEmailVerificationEnabled && (
              <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
                <Button
                  type="button"
                  variant={resetMethod === 'password' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setResetMethod('password')}
                  size="sm"
                >
                  Reset Password
                </Button>
                <Button
                  type="button"
                  variant={resetMethod === 'magic-link' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setResetMethod('magic-link')}
                  size="sm"
                >
                  🔗 Magic Link
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                disabled={isLoading}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {resetMethod === 'magic-link' ? 'Send Magic Link' : 'Send Reset Link'}
            </Button>

            {resetMethod === 'magic-link' && (
              <p className="text-xs text-center text-muted-foreground">
                The magic link will work only once and expires in 15 minutes
              </p>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
