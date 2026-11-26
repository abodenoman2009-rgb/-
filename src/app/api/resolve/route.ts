import { stat } from "node:fs/promises";
import { eq } from "drizzle-orm";
import path from "node:path";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { detectPlatform, isPublicHttpUrl } from "@/lib/platforms";
import { resolveMedia, ResolverError } from "@/lib/resolver";
import { humanSize } from "@/lib/format";
import { checkRateLimit, clientIp, hashIp, serializeJob } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = { url?: unknown; format?: unknown; sample?: unknown };

const FORMATS = new Set(["mp4", "webm", "audio"]);

async function createSampleJob() {
  let size: number | null = null;
  try {
    const info = await stat(path.join(process.cwd(), "public", "media", "abd-sample.mp4"));
    size = info.size;
  } catch {
    size = null;
  }
  const [row] = await db
    .insert(downloads)
    .values({
      sourceUrl: "https://example.com/abd-sample.mp4",
      platform: "direct",
      status: "ready",
      format: "mp4",
      quality: `${size ? humanSize(size) : "1.1 MB"} · ملف تجريبي`,
      note: "هذا ملف عيّنة محلي لاختبار الواجهة والتنزيل.",
      isSample: true,
      title: "ملف تجريبي — حمل معاء عبود",
      author: "abd-sample.mp4",
      fileName: "abd-sample.mp4",
      fileSizeBytes: size,
      mimeType: "video/mp4",
      engine: "demo",
      remoteUrl: "/media/abd-sample.mp4",
      completedAt: new Date(),
    })
    .returning();
  return row!;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: { code: "bad_json", message: "طلب غير صالح." } }, { status: 400 });
  }

  const ip = hashIp(clientIp(request));
  const limited = checkRateLimit(ip);
  if (!limited.allowed) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "rate_limited",
          message: "طلبات كثيرة جداً في وقت قصير.",
          hint: `انتظر ${limited.retryAfter} ثانية ثم أعد المحاولة.`,
        },
      },
      { status: 429, headers: { "retry-after": String(limited.retryAfter) } },
    );
  }

  const format = typeof body.format === "string" && FORMATS.has(body.format) ? body.format : "mp4";

  if (body.sample === true) {
    const row = await createSampleJob();
    return Response.json({ ok: true, job: serializeJob(row) });
  }

  if (typeof body.url !== "string" || body.url.trim().length < 8) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "missing_url",
          message: "الصق رابط الفيديو أولاً.",
          hint: "مثال: https://www.tiktok.com/@user/video/123…",
        },
      },
      { status: 400 },
    );
  }

  const rawUrl = body.url.trim();
  if (rawUrl.length > 2000) {
    return Response.json(
      { ok: false, error: { code: "too_long", message: "الرابط أطول من المسموح." } },
      { status: 400 },
    );
  }

  const validity = isPublicHttpUrl(rawUrl);
  if (!validity.ok) {
    const messages: Record<string, string> = {
      invalid: "الرابط غير صحيح. تأكد من نسخه كاملاً مع https://",
      protocol: "يُسمح بروابط http و https فقط.",
      private: "لا يمكن الوصول إلى عناوين الشبكة المحلية.",
    };
    return Response.json(
      {
        ok: false,
        error: {
          code: `url_${validity.reason}`,
          message: messages[validity.reason] ?? "رابط غير صالح.",
          hint: "افتح الفيديو في المتصفح، انسخ الرابط من شريط العنوان، ثم الصقه هنا.",
        },
      },
      { status: 400 },
    );
  }

  const normalized = validity.url.toString();
  const platform = detectPlatform(normalized);
  const [pending] = await db
    .insert(downloads)
    .values({
      sourceUrl: normalized,
      platform,
      status: "processing",
      format,
    })
    .returning();

  if (!pending) {
    return Response.json(
      { ok: false, error: { code: "db_error", message: "تعذّر إنشاء عملية التحميل." } },
      { status: 500 },
    );
  }

  try {
    const media = await resolveMedia(normalized, format, platform);
    const [ready] = await db
      .update(downloads)
      .set({
        status: "ready",
        engine: media.engine,
        remoteUrl: media.remoteUrl,
        remoteHeaders: media.remoteHeaders ?? null,
        title: media.title,
        author: media.author,
        thumbnailUrl: media.thumbnailUrl,
        durationSeconds: media.durationSeconds,
        fileName: media.fileName,
        fileSizeBytes: media.fileSizeBytes,
        mimeType: media.mimeType,
        quality: media.quality,
        note: media.note ?? null,
        completedAt: new Date(),
      })
      .where(eq(downloads.id, pending.id))
      .returning();

    return Response.json({ ok: true, job: serializeJob(ready ?? pending) });
  } catch (error) {
    const resolverError =
      error instanceof ResolverError
        ? error
        : new ResolverError(
            "unexpected",
            "حدث خطأ غير متوقع أثناء معالجة الرابط.",
            "أعد المحاولة بعد لحظات، أو جرّب رابطاً مباشراً.",
          );

    if (!(error instanceof ResolverError)) {
      console.error("resolve failed", error);
    }

    const [failed] = await db
      .update(downloads)
      .set({
        status: "error",
        errorCode: resolverError.code,
        errorMessage: resolverError.message,
        completedAt: new Date(),
      })
      .where(eq(downloads.id, pending.id))
      .returning();

    return Response.json(
      {
        ok: false,
        error: {
          code: resolverError.code,
          message: resolverError.message,
          hint: resolverError.hint,
        },
        job: failed ? serializeJob(failed) : null,
      },
      { status: 422 },
    );
  }
}
