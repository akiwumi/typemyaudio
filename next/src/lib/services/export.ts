import PDFDocument from "pdfkit";
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";

interface TranscriptionData {
  title: string;
  formatted_text: string | null;
  raw_text: string | null;
  translated_text: string | null;
  detected_language_name: string | null;
  segments: Array<{ start: number; end: number; text: string }> | null;
  sentence_timecodes: Array<{ sentence: string; start_fmt: string; end_fmt: string }> | null;
}

interface ExportOptions {
  includeTimecodes: boolean;
  includeTranslation: boolean;
}

export function generateTxt(data: TranscriptionData, options: ExportOptions): Buffer {
  if (options.includeTimecodes && data.sentence_timecodes) {
    const lines = data.sentence_timecodes.map(
      (s) => `[${s.start_fmt} → ${s.end_fmt}]  ${s.sentence}`
    );
    return Buffer.from(lines.join("\n"), "utf-8");
  }

  let content = data.formatted_text || data.raw_text || "";
  if (options.includeTranslation && data.translated_text) {
    content += "\n\n--- Translation ---\n\n" + data.translated_text;
  }
  return Buffer.from(content, "utf-8");
}

export async function generateDocx(data: TranscriptionData, options: ExportOptions): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ text: data.title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: "" }),
  ];

  if (data.detected_language_name) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Language: ${data.detected_language_name}`, italics: true, color: "666666" })],
      })
    );
  }

  children.push(new Paragraph({ text: "" }));

  if (options.includeTimecodes && data.sentence_timecodes) {
    for (const s of data.sentence_timecodes) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${s.start_fmt} → ${s.end_fmt}] `, bold: true, size: 18, color: "666666" }),
            new TextRun({ text: s.sentence, size: 24 }),
          ],
        })
      );
    }
  } else if (data.segments) {
    for (const seg of data.segments) {
      const timestamp = formatSegmentTime(seg.start);
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${timestamp}] `, bold: true, size: 18, color: "666666" }),
            new TextRun({ text: seg.text.trim(), size: 24 }),
          ],
        })
      );
    }
  } else {
    const text = data.formatted_text || data.raw_text || "";
    for (const para of text.split("\n")) {
      children.push(new Paragraph({ children: [new TextRun({ text: para, size: 24 })] }));
    }
  }

  if (options.includeTranslation && data.translated_text) {
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "Translation", heading: HeadingLevel.HEADING_2 }));
    for (const para of data.translated_text.split("\n")) {
      children.push(new Paragraph({ children: [new TextRun({ text: para, size: 24 })] }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}

export function generatePdf(data: TranscriptionData, options: ExportOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).text(data.title, { align: "center" });
    doc.moveDown();

    if (data.detected_language_name) {
      doc.fontSize(10).fillColor("gray").text(`Language: ${data.detected_language_name}`);
      doc.moveDown();
    }

    doc.fillColor("black");

    if (options.includeTimecodes && data.sentence_timecodes) {
      for (const s of data.sentence_timecodes) {
        doc.fontSize(8).fillColor("gray").text(`[${s.start_fmt} → ${s.end_fmt}]`, { continued: true });
        doc.fontSize(11).fillColor("black").text(`  ${s.sentence}`);
        doc.moveDown(0.3);
      }
    } else {
      const text = data.formatted_text || data.raw_text || "";
      doc.fontSize(11).text(text, { lineGap: 4 });
    }

    if (options.includeTranslation && data.translated_text) {
      doc.addPage();
      doc.fontSize(18).text("Translation", { align: "center" });
      doc.moveDown();
      doc.fontSize(11).text(data.translated_text, { lineGap: 4 });
    }

    doc.end();
  });
}

export function generateSrt(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments
    .map((seg, index) => {
      const startTime = formatSrtTime(seg.start);
      const endTime = formatSrtTime(seg.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text.trim()}\n`;
    })
    .join("\n");
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const ms = Math.round((seconds % 1) * 1000).toString().padStart(3, "0");
  return `${h}:${m}:${s},${ms}`;
}

function formatSegmentTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
