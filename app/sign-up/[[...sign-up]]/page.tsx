"use client";

import Link from "next/link";
import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Shield } from "lucide-react";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const router = useRouter();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      // Create the sign up with email and password only
      await signUp.create({
        emailAddress,
        password,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err: any) {
      console.error("Sign up error:", err);
      
      // Extract user-friendly error message
      let errorMessage = "An error occurred during sign up.";
      if (err?.errors && err.errors.length > 0) {
        const error = err.errors[0];
        if (error.code === "form_password_pwned") {
          errorMessage = "This password has been found in a data breach. Please choose a different password.";
        } else if (error.code === "form_password_length_too_short") {
          errorMessage = "Password must be at least 8 characters long.";
        } else if (error.code === "form_identifier_exists") {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.code === "form_password_validation_failed") {
          errorMessage = "Password must contain at least 8 characters.";
        } else if (error.longMessage) {
          errorMessage = error.longMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    }

    setIsLoading(false);
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });

      if (completeSignUp.status !== "complete") {
        setError("Verification failed. Please try again.");
      }

      if (completeSignUp.status === "complete") {
        // Sign-up completed successfully
        await setActive({ session: completeSignUp.createdSessionId });
        
        // Force a router refresh to ensure fresh data load
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      
      // Extract user-friendly error message
      let errorMessage = "Verification failed. Please try again.";
      if (err?.errors && err.errors.length > 0) {
        const error = err.errors[0];
        if (error.code === "form_code_incorrect") {
          errorMessage = "The verification code is incorrect. Please try again.";
        } else if (error.code === "verification_expired") {
          errorMessage = "The verification code has expired. Please request a new one.";
        } else if (error.longMessage) {
          errorMessage = error.longMessage;
        }
      }
      
      setError(errorMessage);
    }

    setIsLoading(false);
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      console.error("Google sign up error:", err);
      setError("Google sign up failed. Please try again.");
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Header with Back Button */}
        <div className="flex-shrink-0 p-4">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-4 min-h-0">
          <div className="w-full max-w-md space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <Link href="/" className="inline-block">
                <span className="text-3xl font-bold text-foreground font-serif-elegant">
                  kido
                </span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight font-serif-elegant">
                  Check your email
                </h1>
                <p className="text-muted-foreground text-sm">
                  We sent a verification code to {emailAddress}
                </p>
              </div>
            </div>

            {/* Verification Form */}
            <Card className="border-2">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl font-semibold text-center">Verify Email</CardTitle>
                <CardDescription className="text-center text-sm">
                  Enter the 6-digit code we sent to your email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CAPTCHA Element for Clerk */}
                <div id="clerk-captcha" className="hidden"></div>
                
                {/* Error Message */}
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                    {error}
                  </div>
                )}

                {/* Verification Code Form */}
                <form onSubmit={handleVerification} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="code" className="text-sm">Verification Code</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="code"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        className="pl-10 h-10 text-sm text-center tracking-widest"
                        disabled={isLoading}
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 text-sm font-medium"
                    disabled={isLoading || code.length !== 6}
                  >
                    {isLoading ? "Verifying..." : "Verify Email"}
                  </Button>
                </form>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Didn't receive the code? </span>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-medium text-foreground hover:underline"
                    onClick={() => signUp?.prepareEmailAddressVerification({ strategy: "email_code" })}
                    disabled={isLoading}
                  >
                    Resend
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header with Back Button */}
      <div className="flex-shrink-0 p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-2 min-h-0 overflow-y-auto">
        <div className="w-full max-w-md space-y-4">
          {/* Header */}
          <div className="text-center space-y-3">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-bold text-foreground font-serif-elegant">
                kido
              </span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight font-serif-elegant">
                Create your account
              </h1>
              <p className="text-muted-foreground text-sm">
                Join thousands of families on their learning journey
              </p>
            </div>
          </div>

          {/* Sign Up Form */}
          <Card className="border-2">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle className="text-lg font-semibold text-center">Sign Up</CardTitle>
              <CardDescription className="text-center text-sm">
                Create an account to get started with kido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* CAPTCHA Element for Clerk */}
              <div id="clerk-captcha" className="hidden"></div>
              
              {/* Google Sign Up */}
              <Button
                variant="outline"
                className="w-full h-9 text-sm"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-background px-2 text-xs text-muted-foreground">
                    or continue with email
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}

              {/* Sign Up Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      required
                      className="pl-10 h-9 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-9 text-sm"
                      disabled={isLoading}
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    At least 8 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 text-sm font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/sign-in" className="text-foreground hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <div className="space-x-4">
              <Link href="/terms" className="hover:underline">Terms</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}