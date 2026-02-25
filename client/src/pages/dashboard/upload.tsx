import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFileSize } from "@/lib/utils";
import { Upload, X, Globe, FileAudio, FileVideo } from "lucide-react";

const ACCEPTED_FORMATS = {
  "audio/mpeg": [".mp3"],
  "video/mp4": [".mp4"],
};

const TRANSLATION_TARGETS = [
  { code: "en", name: "English" }, { code: "es", name: "Spanish" },
  { code: "fr", name: "French" }, { code: "de", name: "German" },
  { code: "it", name: "Italian" }, { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" }, { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese (Simplified)" }, { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" }, { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" }, { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" }, { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" }, { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" }, { code: "cs", name: "Czech" },
  { code: "ro", name: "Romanian" }, { code: "hu", name: "Hungarian" },
  { code: "el", name: "Greek" }, { code: "he", name: "Hebrew" },
  { code: "th", name: "Thai" }, { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" }, { code: "ms", name: "Malay" },
  { code: "uk", name: "Ukrainian" }, { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" }, { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" }, { code: "sr", name: "Serbian" },
  { code: "bn", name: "Bengali" }, { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" }, { code: "ur", name: "Urdu" },
  { code: "fa", name: "Persian" }, { code: "sw", name: "Swahili" },
  { code: "tl", name: "Filipino" },
];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxSize: 500 * 1024 * 1024,
    maxFiles: 1,
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors?.[0];
      if (err?.code === "file-too-large") {
        setError("File is too large. Maximum size is 500MB.");
      } else {
        setError("Only MP3 and MP4 files are supported.");
      }
    },
  });

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setProgress(10);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be logged in to upload.");

      const transcriptionId = crypto.randomUUID();
      const storagePath = `${session.user.id}/${transcriptionId}/${file.name}`;

      setProgress(20);
      const { error: storageError } = await supabase.storage
        .from("audio-uploads")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (storageError) throw new Error("File upload failed: " + storageError.message);

      setProgress(70);
      const result = await api.post<{ id: string }>("/api/transcriptions", {
        transcriptionId,
        storagePath,
        originalFilename: file.name,
        fileSize: file.size,
        targetLanguage: targetLanguage || null,
      });

      setProgress(100);
      navigate(`/dashboard/transcriptions/${result.id}`);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="heading-xl text-2xl">New Transcription</h1>
        <p className="text-foreground-muted mt-1">Upload an MP3 or MP4 file to transcribe</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent>
          {file ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
              <div className="flex items-center gap-3">
                {file.type.startsWith("audio") ? (
                  <FileAudio className="h-8 w-8 text-primary" />
                ) : (
                  <FileVideo className="h-8 w-8 text-primary" />
                )}
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-foreground-muted">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-1.5 hover:bg-border-hover rounded-lg cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragActive ? "border-primary bg-primary-light" : "border-border hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-foreground-muted mb-4" />
              <p className="text-lg font-medium">
                {isDragActive ? "Drop your file here" : "Drop your MP3 or MP4 file here"}
              </p>
              <p className="text-sm text-foreground-muted mt-1">or click to browse (max 500MB)</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
        <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>Language is detected automatically — your file will be transcribed in its original language.</p>
      </div>

      <Card>
        <CardContent>
          <label className="block text-sm font-medium mb-2">
            Translate transcription to another language? (optional)
          </label>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="w-full border border-border rounded-xl p-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
          >
            <option value="">No translation — keep original language</option>
            {TRANSLATION_TARGETS.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">Uploading and processing...</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleUpload}
        disabled={!file || uploading}
        loading={uploading}
      >
        Start Transcription
      </Button>
    </div>
  );
}
