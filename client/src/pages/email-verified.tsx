import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";

export default function EmailVerifiedPage() {
  return (
    <AuthLayout>
      <div className="space-y-6 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
          <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="heading-xl text-2xl">Email verified!</h2>
          <p className="text-foreground-muted">
            Your email has been successfully verified. You can now sign in to your account.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
