"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Transcription } from "@/types/database";
import { Upload, FileText, Clock, Languages } from "lucide-react";

interface UsageData {
  tier: string;
  used: number;
  limit: number;
  purchased_tokens: number;
  remaining: number;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [recentTranscriptions, setRecentTranscriptions] = useState<Transcription[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [transcriptions, usageData] = await Promise.all([
          api.get<Transcription[]>("/api/transcriptions"),
          api.get<UsageData>("/api/users/usage"),
        ]);
        setRecentTranscriptions(transcriptions.slice(0, 5));
        setUsage(usageData);
      } catch {
        // Will show empty state
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const statusColors: Record<string, "success" | "warning" | "error" | "info"> = {
    completed: "success",
    processing: "info",
    pending: "warning",
    failed: "error",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-xl text-2xl">Welcome back, {profile?.full_name?.split(" ")[0] || "there"}</h1>
        <p className="text-foreground-muted mt-1">Here&apos;s an overview of your transcription activity</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{usage?.used ?? 0}</p>
              <p className="text-sm text-foreground-muted">{profile?.tier === "free" ? "of 3 lifetime" : `of ${usage?.limit ?? 15} this month`}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{usage?.remaining ?? 0}</p>
              <p className="text-sm text-foreground-muted">Transcriptions remaining</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
              <Languages className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold capitalize">{profile?.tier || "Free"}</p>
              <p className="text-sm text-foreground-muted">Current plan</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="heading-md text-lg">Recent Transcriptions</h2>
        <Link href="/dashboard/transcriptions"><Button variant="ghost" size="sm">View all</Button></Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />)}
        </div>
      ) : recentTranscriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="heading-sm text-lg mb-1">No transcriptions yet</h3>
            <p className="text-foreground-muted mb-4">Upload an MP3 or MP4 file to get started</p>
            <Link href="/dashboard/upload"><Button>Upload your first file</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recentTranscriptions.map((t) => (
            <Link key={t.id} href={`/dashboard/transcriptions/${t.id}`}>
              <Card className="hover:border-primary/30 transition-all duration-200 cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-foreground-muted" />
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-sm text-foreground-muted">{formatDate(t.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {t.detected_language_name && <span className="text-sm text-foreground-muted">{t.detected_language_name}</span>}
                    <Badge variant={statusColors[t.status]}>{t.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
