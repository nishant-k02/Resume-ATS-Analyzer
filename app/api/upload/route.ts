import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { createRequire } from "module";

export const runtime = "nodejs";

function isDev() {
  return process.env.NODE_ENV !== "production";
}

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
      // ✅ Turbopack-safe: use Node require semantics
      const require = createRequire(import.meta.url);
      const pdfParse = require("pdf-parse") as (
        data: Buffer
      ) => Promise<{ text?: string }>;

      const parsed = await pdfParse(buf);
      const text = (parsed?.text ?? "").trim();

      return NextResponse.json({ text, fileType: "pdf" });
    }

    if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: buf });
      const text = (result?.value ?? "").trim();
      return NextResponse.json({ text, fileType: "docx" });
    }

    return NextResponse.json(
      { error: "Unsupported file type. Upload PDF or DOCX." },
      { status: 400 }
    );
  } catch (e: unknown) {
    console.error("UPLOAD_ROUTE_ERROR:", e);

    const errorMessage =
      e instanceof Error
        ? e.message
        : typeof e === "string"
        ? e
        : "Upload failed";

    return NextResponse.json(
      {
        error: errorMessage,
        ...(isDev() && e instanceof Error ? { stack: e.stack } : {}),
      },
      { status: 500 }
    );
  }
}
