import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { findJob } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function contentDisposition(fileName: string, inline: boolean): string {
  const safe = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_").slice(0, 120);
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${inline ? "inline" : "attachment"}; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

function parseRange(range: string | null, size: number): { start: number; end: number } | null {
  if (!range) return null;
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  if (!match) return null;
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return null;
  return { start, end };
}

function errorResponse(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await findJob(id);

  if (!job) return errorResponse("لم نجد عملية التحميل المطلوبة.", 404);
  if (job.status !== "ready" || !job.remoteUrl) {
    return errorResponse("هذا الملف غير جاهز للتنزيل بعد.", 409);
  }

  const inline = new URL(request.url).searchParams.get("inline") === "1";
  const range = request.headers.get("range");
  const fileName = job.fileName ?? `abd-video.${job.format === "audio" ? "m4a" : job.format}`;

  if (!inline) {
    void db
      .update(downloads)
      .set({ downloadCount: sql`${downloads.downloadCount} + 1` })
      .where(eq(downloads.id, job.id))
      .catch((error) => console.error("failed to bump download count", error));
  }

  // Local demo asset: streamed from disk with Range support so previews work.
  if (job.engine === "demo") {
    const filePath = path.join(process.cwd(), "public", "media", "abd-sample.mp4");
    try {
      const info = await stat(filePath);
      const slice = parseRange(range, info.size);
      const start = slice?.start ?? 0;
      const end = slice?.end ?? info.size - 1;
      const stream = createReadStream(filePath, { start, end });
      const headers: Record<string, string> = {
        "content-type": "video/mp4",
        "content-length": String(end - start + 1),
        "accept-ranges": "bytes",
        "content-disposition": contentDisposition(fileName, inline),
        "cache-control": "no-store",
      };
      if (slice) headers["content-range"] = `bytes ${start}-${end}/${info.size}`;
      return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
        status: slice ? 206 : 200,
        headers,
      });
    } catch {
      return errorResponse("الملف التجريبي غير متاح على الخادم.", 410);
    }
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(job.remoteHeaders ?? {})) {
    if (typeof value === "string") headers[key] = value;
  }
  if (range) headers.range = range;

  try {
    const upstream = await fetch(job.remoteUrl, {
      headers,
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      return errorResponse(
        `تعذّر جلب الملف من المصدر (رمز ${upstream.status}). أعد المحاولة أو اختر صيغة أخرى.`,
        502,
      );
    }

    const outgoing: Record<string, string> = {
      "content-type": upstream.headers.get("content-type") ?? job.mimeType ?? "application/octet-stream",
      "content-disposition": contentDisposition(fileName, inline),
      "accept-ranges": upstream.headers.get("accept-ranges") ?? "bytes",
      "cache-control": "no-store",
    };
    const length = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    if (length) outgoing["content-length"] = length;
    if (contentRange) outgoing["content-range"] = contentRange;

    return new Response(upstream.body, {
      status: upstream.status === 206 && range ? 206 : 200,
      headers: outgoing,
    });
  } catch (error) {
    console.error("stream failed", error);
    return errorResponse("انتهت مهلة الاتصال بالمصدر. أعد المحاولة بعد لحظات.", 504);
  }
}
