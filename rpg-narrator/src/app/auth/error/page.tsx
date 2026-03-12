"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") ?? "auth_failed";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-sm rounded-xl border border-red-900/50 bg-zinc-900/80 p-8">
        <h1 className="text-xl font-bold text-red-400 text-center mb-2">
          Chyba prihlásenia
        </h1>
        <p className="text-sm text-zinc-500 text-center mb-6">
          {message === "auth_failed"
            ? "Prihlásenie zlyhalo. Skús to znova alebo pokračuj ako hosť."
            : message === "not_configured"
              ? "Supabase nie je nakonfigurovaný. Pozri GOOGLE-LOGIN-SETUP.md."
              : "Nastala neočakávaná chyba."}
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/auth/login"
            className="block text-center py-3 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-medium"
          >
            Skúsiť znova
          </Link>
          <Link
            href="/"
            className="block text-center text-sm text-amber-500 hover:text-amber-400"
          >
            Späť na domov
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500">Načítavam…</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
