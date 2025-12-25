import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs"; // required since pdf parsing uses Node APIs

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const buf = Buffer.from(await file.arrayBuffer());

    if (name.endsWith(".pdf")) {
      // dynamically import to avoid "no default export" compile error and support different module shapes
      const pdfModule: unknown = await import("pdf-parse");
      type PdfParseFn = (data: Buffer) => Promise<{ text?: string }>;
      const parseFn = ((pdfModule as { default?: PdfParseFn }).default ??
        (pdfModule as PdfParseFn)) as PdfParseFn;
      const parsed = await parseFn(buf);
      const text = (parsed.text ?? "").trim();
      return NextResponse.json({ text, fileType: "pdf" });
    }

    if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: buf });
      const text = (result.value ?? "").trim();
      return NextResponse.json({ text, fileType: "docx" });
    }

    return NextResponse.json(
      { error: "Unsupported file type. Upload PDF or DOCX." },
      { status: 400 }
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
