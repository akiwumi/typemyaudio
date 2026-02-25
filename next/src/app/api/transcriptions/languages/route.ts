import { NextResponse } from "next/server";
import { TRANSLATION_TARGETS } from "@/lib/services/languages";

export async function GET() {
  return NextResponse.json({ targets: TRANSLATION_TARGETS });
}
