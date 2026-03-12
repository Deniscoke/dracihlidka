"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Neznáma chyba");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/80 p-8">
        <div className="flex justify-center mb-6">
          <img
            src="/ilustrations/Logo_Wall_1024x600.jpg"
            alt="Dračí Hlídka"
            className="w-20 h-20 rounded-lg object-cover border border-amber-500/30"
          />
        </div>
        <h1 className="text-xl font-bold text-zinc-100 text-center mb-2">
          Prihlásenie
        </h1>
        <p className="text-sm text-zinc-500 text-center mb-6">
          Prihlás sa cez Google, aby si mal kampane a postavy uložené v cloude.
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 font-medium transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "Presmerovanie…" : "Prihlásiť sa cez Google"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
        )}

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <Link
            href="/"
            className="block text-center text-sm text-amber-500 hover:text-amber-400"
          >
            ← Späť na domov (pokračovať ako hosť)
          </Link>
        </div>
      </div>
    </div>
  );
}
