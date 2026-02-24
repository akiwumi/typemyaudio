import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CreditCard, AlertCircle } from "lucide-react";

interface SubscriptionData {
  tier: string;
  subscription_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
  cancel_at_period_end: boolean;
  total_free_used: number;
  purchased_tokens: number;
  usage_this_month: number;
}

export default function SubscriptionPage() {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const data = await api.get<SubscriptionData>("/api/payments/subscription-status");
      setSubscription(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel? You'll keep access until the end of your billing period.")) return;
    setActionLoading(true);
    try {
      await api.post("/api/payments/cancel-subscription");
      await loadSubscription();
    } catch {
      // error
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    try {
      await api.post("/api/payments/reactivate-subscription");
      await loadSubscription();
    } catch {
      // error
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBuyTokens(quantity: number) {
    try {
      const { url } = await api.post<{ url: string }>("/api/payments/purchase-tokens", { quantity });
      if (url) window.location.href = url;
    } catch {
      // error
    }
  }

  if (loading) {
    return <div className="h-40 rounded-lg bg-secondary animate-pulse" />;
  }

  const tierLabels: Record<string, string> = {
    free: "Free", starter: "Starter", annual: "Annual", enterprise: "Enterprise",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-muted mt-1">Manage your plan and billing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{tierLabels[subscription?.tier || "free"]}</p>
              <p className="text-sm text-muted">
                {subscription?.tier === "free"
                  ? `${subscription?.total_free_used ?? 0} of 3 lifetime transcriptions used`
                  : `${subscription?.usage_this_month ?? 0} of 15 transcriptions used this month`}
              </p>
            </div>
            <Badge variant={subscription?.subscription_status === "active" ? "success" : "default"}>
              {subscription?.subscription_status || "inactive"}
            </Badge>
          </div>

          {subscription?.subscription_end && (
            <div className="text-sm text-muted">
              {subscription.cancel_at_period_end ? (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Your subscription will end on{" "}
                    <strong>{formatDate(subscription.subscription_end)}</strong>
                  </span>
                </div>
              ) : (
                <p>Next renewal: {formatDate(subscription.subscription_end)}</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {subscription?.tier === "free" && (
              <Button onClick={() => (window.location.href = "/pricing")}>
                Upgrade plan
              </Button>
            )}
            {subscription?.tier !== "free" && !subscription?.cancel_at_period_end && (
              <Button variant="outline" onClick={handleCancel} loading={actionLoading}>
                Cancel subscription
              </Button>
            )}
            {subscription?.cancel_at_period_end && (
              <Button onClick={handleReactivate} loading={actionLoading}>
                Reactivate subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {subscription?.tier !== "free" && subscription?.tier !== "enterprise" && (
        <Card>
          <CardHeader>
            <CardTitle>Extra Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted">
              You have <strong>{subscription?.purchased_tokens ?? 0}</strong> extra transcription tokens.
              Purchase more if you've reached your monthly limit.
            </p>
            <div className="flex gap-3">
              {[5, 10, 25].map((qty) => (
                <Button key={qty} variant="outline" size="sm" onClick={() => handleBuyTokens(qty)}>
                  Buy {qty} tokens
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
