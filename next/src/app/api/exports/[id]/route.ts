import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateTxt, generateDocx, generatePdf, generateSrt } from "@/lib/services/export";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;
  const { id } = await params;

  const body = await request.json();
  const { format } = body;

  if (!["pdf", "docx", "txt", "srt"].includes(format)) {
    return NextResponse.json(
      { error: "Invalid format. Use: pdf, docx, txt, or srt" },
      { status: 400 }
    );
  }

  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();

  const profile = profileData as { tier?: string } | null;

  const { data: transcriptionData, error } = await supabaseAdmin
    .from("transcriptions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  const transcription = transcriptionData as { title: string; formatted_text: string | null; raw_text: string | null; translated_text: string | null; detected_language_name: string | null; segments: Array<{ start: number; end: number; text: string }> | null; sentence_timecodes: Array<{ sentence: string; start_fmt: string; end_fmt: string }> | null } | null;

  if (error || !transcription) {
    return NextResponse.json(
      { error: "Transcription not found" },
      { status: 404 }
    );
  }

  if (format === "srt" && !["annual", "enterprise"].includes(profile?.tier || "free")) {
    return NextResponse.json(
      {
        error: "SRT export is available on Annual and Enterprise plans.",
        upgrade_url: "/pricing",
      },
      { status: 403 }
    );
  }

  const includeTimecodes =
    profile?.tier === "enterprise" && !!transcription.sentence_timecodes;
  const options = {
    includeTimecodes,
    includeTranslation: !!transcription.translated_text,
  };

  let buffer: Buffer;
  let contentType: string;
  let extension: string;

  switch (format) {
    case "pdf":
      buffer = await generatePdf(transcription as any, options);
      contentType = "application/pdf";
      extension = "pdf";
      break;
    case "docx":
      buffer = await generateDocx(transcription as any, options);
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      extension = "docx";
      break;
    case "txt":
      buffer = generateTxt(transcription as any, options);
      contentType = "text/plain";
      extension = "txt";
      break;
    case "srt":
      buffer = Buffer.from(
        generateSrt(transcription.segments || []),
        "utf-8"
      );
      contentType = "application/x-subrip";
      extension = "srt";
      break;
    default:
      return NextResponse.json(
        { error: "Invalid format" },
        { status: 400 }
      );
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${transcription.title}.${extension}"`,
    },
  });
}
