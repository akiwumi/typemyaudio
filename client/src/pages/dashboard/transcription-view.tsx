import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Transcription } from "@/types/database";
import {
  ArrowLeft,
  Download,
  Languages,
  Clock,
  Edit3,
  Save,
  FileText,
  FileDown,
} from "lucide-react";

export default function TranscriptionViewPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [exporting, setExporting] = useState(false);
  const playerRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  useEffect(() => {
    loadTranscription();
  }, [id]);

  useEffect(() => {
    if (!transcription) return;
    if (transcription.status === "processing" || transcription.status === "pending") {
      const interval = setInterval(loadTranscription, 5000);
      return () => clearInterval(interval);
    }
  }, [transcription?.status]);

  async function loadTranscription() {
    try {
      const data = await api.get<Transcription>(`/api/transcriptions/${id}`);
      setTranscription(data);
      setEditText(data.formatted_text || data.raw_text || "");
    } catch {
      navigate("/dashboard/transcriptions");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!transcription) return;
    setSaving(true);
    try {
      const updated = await api.put<Transcription>(`/api/transcriptions/${transcription.id}`, {
        formatted_text: editText,
      });
      setTranscription(updated);
      setEditing(false);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(format: string) {
    if (!transcription) return;
    setExporting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) headers.Authorization = `Bearer ${session.access_token}`;

      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/exports/${transcription.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ format }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${transcription.title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // error toast
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!transcription) return null;

  const isEnterprise = profile?.tier === "enterprise";
  const canExportSrt = profile?.tier === "annual" || isEnterprise;
  const displayText = showTranslation && transcription.translated_text
    ? transcription.translated_text
    : transcription.formatted_text || transcription.raw_text || "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{transcription.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted">
            <span>{formatDate(transcription.created_at)}</span>
            {transcription.detected_language_name && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  {transcription.detected_language_name}
                </span>
              </>
            )}
          </div>
        </div>
        <Badge
          variant={
            transcription.status === "completed"
              ? "success"
              : transcription.status === "failed"
              ? "error"
              : "info"
          }
        >
          {transcription.status}
        </Badge>
      </div>

      {(transcription.status === "pending" || transcription.status === "processing") && (
        <Card>
          <CardContent className="flex items-center gap-4 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div>
              <p className="font-medium">
                {transcription.status === "pending" ? "Queued for processing..." : "Transcribing your file..."}
              </p>
              <p className="text-sm text-muted">This may take a few minutes depending on file length.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {transcription.status === "failed" && (
        <Card className="border-red-200">
          <CardContent className="py-6">
            <p className="text-red-700 font-medium">Transcription failed</p>
            <p className="text-sm text-red-600 mt-1">
              {transcription.error_message || "An unexpected error occurred. Please try again."}
            </p>
          </CardContent>
        </Card>
      )}

      {transcription.status === "completed" && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            {transcription.translated_text && (
              <Button
                variant={showTranslation ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowTranslation(!showTranslation)}
              >
                <Languages className="h-4 w-4" />
                {showTranslation ? "Show original" : "Show translation"}
              </Button>
            )}

            <Button
              variant={editing ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                if (editing) handleSave();
                else setEditing(true);
              }}
              loading={saving}
            >
              {editing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              {editing ? "Save" : "Edit"}
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Export:</span>
              {["txt", "pdf", "docx"].map((fmt) => (
                <Button
                  key={fmt}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(fmt)}
                  disabled={exporting}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {fmt.toUpperCase()}
                </Button>
              ))}
              {canExportSrt && (
                <Button variant="outline" size="sm" onClick={() => handleExport("srt")} disabled={exporting}>
                  <FileDown className="h-3.5 w-3.5" />
                  SRT
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardContent>
              {editing ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full min-h-[400px] p-4 rounded-lg border border-border bg-background text-sm leading-relaxed font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : isEnterprise && transcription.sentence_timecodes ? (
                <div className="space-y-1">
                  {transcription.sentence_timecodes.map((s, i) => (
                    <div key={i} className="flex gap-3 group hover:bg-gray-50 p-2 rounded">
                      <button
                        onClick={() => {
                          const player = playerRef.current;
                          if (player) {
                            player.currentTime = s.start;
                            player.play();
                          }
                        }}
                        className="text-xs font-mono text-primary hover:underline whitespace-nowrap mt-0.5 cursor-pointer"
                      >
                        {s.start_fmt}
                      </button>
                      <p className="text-sm leading-relaxed">{s.sentence}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed">{displayText}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {transcription.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{transcription.summary}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
