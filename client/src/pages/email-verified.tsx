import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/auth/auth-layout";

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

        <Link
          to="/login"
          className="inline-flex items-center justify-center w-full h-10 px-5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
        >
          Go to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
