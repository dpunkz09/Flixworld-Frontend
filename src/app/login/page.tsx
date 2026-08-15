"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { googleAuthApi } from "@/lib/auth-api";
import { useAuth } from "@/hooks/useAuth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ── Inner component — uses useSearchParams, must be inside Suspense ───────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse.credential;
    if (!credential) {
      setError("Google sign-in failed. Please try again.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await googleAuthApi(credential);
      login(data.token, data.user);
      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">Welcome to FlixWorld</h1>
      <p className="text-zinc-400 text-sm mb-5">
        Sign in to track your watch progress, save your wishlist, get
        personalized recommendations, leave comments, and more.
      </p>

      <ul className="mb-8 space-y-2">
        {[
          "Resume watching from where you left off",
          "Save titles to your personal watchlist",
          'Get "Because you watched" recommendations',
          "Join the conversation with comments",
        ].map((text) => (
          <li key={text} className="flex items-start gap-2 text-sm text-zinc-400">
            <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded-full bg-red-600/20 flex items-center justify-center">
              <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" aria-hidden="true">
                <path d="M2 5l2.5 2.5L8 3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {text}
          </li>
        ))}
      </ul>

      {error && (
        <div role="alert" className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        {loading ? (
          <div className="flex items-center justify-center gap-3 w-80 h-11 rounded-lg bg-zinc-800/80 border border-white/10 text-white text-sm font-medium">
            <GoogleIcon />
            <span>Signing in...</span>
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google sign-in was cancelled or failed.")}
            theme="filled_black"
            size="large"
            text="signin_with"
            shape="rectangular"
            logo_alignment="left"
            width="320"
          />
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 text-center">
        <p className="text-xs text-zinc-500">
          By signing in, you agree to our{" "}
          <span className="text-zinc-400">Terms of Service</span> and{" "}
          <span className="text-zinc-400">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

// ── Page export — wraps LoginForm in Suspense (required for useSearchParams) ──

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-black pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              src="/assets/images/main-logo.png"
              alt="FlixWorld"
              width={160}
              height={46}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-8 flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
