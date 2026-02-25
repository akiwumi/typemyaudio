import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TypeMyAudio — AI Transcription",
  description: "AI-powered transcription for MP3 and MP4 files. Auto-detect language, translate, export to PDF, DOCX, TXT, SRT.",
  icons: { icon: "/imgs/typeMyAudioLogo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
