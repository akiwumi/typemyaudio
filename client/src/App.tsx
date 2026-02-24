import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import AuthCallbackPage from "@/pages/auth-callback";
import PricingPage from "@/pages/pricing";
import DashboardPage from "@/pages/dashboard/index";
import UploadPage from "@/pages/dashboard/upload";
import TranscriptionsPage from "@/pages/dashboard/transcriptions";
import TranscriptionViewPage from "@/pages/dashboard/transcription-view";
import SubscriptionPage from "@/pages/dashboard/subscription";
import SettingsPage from "@/pages/dashboard/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="transcriptions" element={<TranscriptionsPage />} />
            <Route path="transcriptions/:id" element={<TranscriptionViewPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
