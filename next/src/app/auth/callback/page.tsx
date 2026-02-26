"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignupVerification = searchParams.get("type") === "signup";
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (isSignupVerification) {
      router.replace("/email-verified");
      return;
    }

    function redirectToDashboard() {
      router.replace("/dashboard");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirectToDashboard();
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") {
          redirectToDashboard();
        }
      });
      subRef.current = subscription;
    });

    return () => subRef.current?.unsubscribe();
  }, [router, isSignupVerification]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-foreground-muted">Completing sign-in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
