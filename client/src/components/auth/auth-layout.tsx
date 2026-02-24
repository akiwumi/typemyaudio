import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-accent to-primary/80 items-center justify-center p-12">
        <div className="max-w-md text-white space-y-6">
          <img src="/imgs/typeMyAudioLogo.png" alt="TypeMyAudio" className="h-24 w-auto" />
          <p className="text-lg text-white/80">
            AI-powered transcription for your audio and video files. Auto-detect language, translate,
            and export to PDF, DOCX, TXT, or SRT.
          </p>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              98+ languages with auto-detection
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              AI-powered grammar cleanup and summarization
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              Export to PDF, DOCX, TXT, and SRT subtitles
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
