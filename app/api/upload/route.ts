import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { createRequire } from "module";

export const runtime = "nodejs";

function isDev() {
  return process.env.NODE_ENV !== "production";
}

type PdfParseResult = { text?: string };
type PdfParseFn = (data: Buffer) => Promise<PdfParseResult>;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function resolvePdfParse(mod: unknown): PdfParseFn {
  // pdf-parse@1.1.1 usually exports a function (CJS)
  if (typeof mod === "function") return mod as PdfParseFn;

  // some bundlers wrap it
  if (isRecord(mod) && typeof mod.default === "function") {
    return mod.default as PdfParseFn;
  }

  // last resort: try known named key
  if (isRecord(mod) && typeof mod.pdfParse === "function") {
    return mod.pdfParse as PdfParseFn;
  }

  const keys = isRecord(mod) ? Object.keys(mod) : [];
  throw new TypeError(
    `pdf-parse export is not a function. keys=${JSON.stringify(keys)}`
  );
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
      // ✅ Force Node resolution (CJS) so we get the actual parser function
      const require = createRequire(import.meta.url);
      const mod: unknown = require("pdf-parse/lib/pdf-parse.js");
      const pdfParse = resolvePdfParse(mod);

      const parsed = await pdfParse(buf);
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
    console.error("UPLOAD_ROUTE_ERROR:", e);

    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
        ? e
        : "Upload failed";

    return NextResponse.json(
      {
        error: message,
        ...(isDev() && e instanceof Error ? { stack: e.stack } : {}),
      },
      { status: 500 }
    );
  }
}
