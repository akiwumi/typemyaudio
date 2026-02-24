import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDuration } from "@/lib/utils";
import type { Transcription } from "@/types/database";
import { FileText, Search, Upload, Trash2 } from "lucide-react";

export default function TranscriptionsPage() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTranscriptions();
  }, []);

  async function loadTranscriptions() {
    try {
      const data = await api.get<Transcription[]>("/api/transcriptions");
      setTranscriptions(data);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this transcription?")) return;

    try {
      await api.delete(`/api/transcriptions/${id}`);
      setTranscriptions((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // error toast
    }
  }

  const filtered = transcriptions.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.detected_language_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, "success" | "warning" | "error" | "info"> = {
    completed: "success",
    processing: "info",
    pending: "warning",
    failed: "error",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Transcriptions</h1>
          <p className="text-muted mt-1">{transcriptions.length} transcription{transcriptions.length !== 1 ? "s" : ""}</p>
        </div>
        <Link to="/dashboard/upload">
          <Button>
            <Upload className="h-4 w-4" />
            New Transcription
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Search transcriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">
              {searchQuery ? "No results found" : "No transcriptions yet"}
            </h3>
            <p className="text-muted mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Upload an MP3 or MP4 file to get started"}
            </p>
            {!searchQuery && (
              <Link to="/dashboard/upload">
                <Button>Upload your first file</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Link key={t.id} to={`/dashboard/transcriptions/${t.id}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{t.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <span>{formatDate(t.created_at)}</span>
                        {t.duration_seconds && (
                          <>
                            <span>·</span>
                            <span>{formatDuration(t.duration_seconds)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {t.detected_language_name && (
                      <span className="text-sm text-muted hidden sm:inline">
                        {t.detected_language_name}
                      </span>
                    )}
                    <Badge variant={statusColors[t.status]}>{t.status}</Badge>
                    <button
                      onClick={(e) => handleDelete(t.id, e)}
                      className="p-1.5 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
