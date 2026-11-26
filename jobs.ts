import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";
import path from "node:path";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { downloads, type DownloadRow } from "@/db/schema";
import { getYtdlpEngine } from "./resolver";
import { platformById } from "./platforms";
import type { PublicJob, SiteStats } from "./types";

export type { PublicJob, SiteStats };

export function serializeJob(row: DownloadRow): PublicJob {
  return {
    id: row.id,
    sourceUrl: row.sourceUrl,
    platform: row.platform,
    platformName: platformById(row.platform).nameAr,
    status: row.status,
    format: row.format,
    quality: row.quality,
    note: row.note,
    title: row.title,
    author: row.author,
    thumbnailUrl: row.thumbnailUrl,
    durationSeconds: row.durationSeconds,
    fileName: row.fileName,
    fileSizeBytes: row.fileSizeBytes,
    mimeType: row.mimeType,
    engine: row.engine,
    isSample: row.isSample,
    downloadCount: row.downloadCount,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

const SAMPLE_ROWS = [
  {
    sourceUrl: "https://www.tiktok.com/@abd.coffee/video/7300000000000000000",
    platform: "tiktok",
    title: "وصفة قهوة مختصة في 40 ثانية",
    author: "@abd.coffee",
    quality: "720p · 1.1 MB",
    minutesAgo: 11,
  },
  {
    sourceUrl: "https://www.youtube.com/watch?v=abd-demo-studio",
    platform: "youtube",
    title: "جولة سريعة داخل استوديو التصميم",
    author: "Abd Studio",
    quality: "1080p · عيّنة",
    minutesAgo: 34,
  },
  {
    sourceUrl: "https://www.instagram.com/reel/abd-demo-reel/",
    platform: "instagram",
    title: "خلف الكواليس — ريلز إنستغرام",
    author: "@abd.design",
    quality: "720p · عيّنة",
    minutesAgo: 96,
  },
];

const seedCache = globalThis as typeof globalThis & { __abdSeeded?: Promise<void> };

async function seedSamples() {
  const existing = await db
    .select({ id: downloads.id })
    .from(downloads)
    .where(eq(downloads.isSample, true))
    .limit(1);
  if (existing.length > 0) return;

  let sampleSize: number | null = null;
  try {
    const info = await stat(path.join(process.cwd(), "public", "media", "abd-sample.mp4"));
    sampleSize = info.size;
  } catch {
    sampleSize = null;
  }

  const now = Date.now();
  await db.insert(downloads).values(
    SAMPLE_ROWS.map((sample) => ({
      sourceUrl: sample.sourceUrl,
      platform: sample.platform,
      status: "ready",
      format: "mp4",
      quality: sample.quality,
      title: sample.title,
      author: sample.author,
      fileName: "abd-sample.mp4",
      fileSizeBytes: sampleSize,
      mimeType: "video/mp4",
      engine: "demo",
      isSample: true,
      downloadCount: 0,
      remoteUrl: "/media/abd-sample.mp4",
      createdAt: new Date(now - sample.minutesAgo * 60_000),
      completedAt: new Date(now - sample.minutesAgo * 60_000 + 1200),
    })),
  );
}

export async function ensureSampleRows(): Promise<void> {
  if (!seedCache.__abdSeeded) {
    seedCache.__abdSeeded = seedSamples().catch((error) => {
      seedCache.__abdSeeded = undefined;
      console.error("Failed to seed sample downloads", error);
    });
  }
  await seedCache.__abdSeeded;
}

export async function getRecentJobs(limit = 8): Promise<PublicJob[]> {
  const rows = await db
    .select()
    .from(downloads)
    .orderBy(desc(downloads.createdAt))
    .limit(Math.min(Math.max(limit, 1), 30));
  return rows.map(serializeJob);
}

let engineCache: { value: boolean; at: number } | null = null;

export async function hasYtdlp(): Promise<boolean> {
  if (engineCache && Date.now() - engineCache.at < 120_000) return engineCache.value;
  const engine = await getYtdlpEngine();
  engineCache = { value: Boolean(engine), at: Date.now() };
  return Boolean(engine);
}

export async function getStats(): Promise<SiteStats> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      success: sql<number>`count(*) filter (where ${downloads.status} = 'ready')::int`,
      failed: sql<number>`count(*) filter (where ${downloads.status} = 'error')::int`,
      bytes: sql<string>`coalesce(sum(${downloads.fileSizeBytes}), 0)::text`,
      downloads: sql<number>`coalesce(sum(${downloads.downloadCount}), 0)::int`,
      lastDay: sql<number>`count(*) filter (where ${downloads.createdAt} >= ${yesterday.toISOString()})::int`,
    })
    .from(downloads);

  const byPlatform = await db
    .select({ platform: downloads.platform, count: sql<number>`count(*)::int` })
    .from(downloads)
    .where(gte(downloads.createdAt, new Date(0)))
    .groupBy(downloads.platform)
    .orderBy(desc(sql`count(*)`));

  const finished = (totals?.success ?? 0) + (totals?.failed ?? 0);

  return {
    total: totals?.total ?? 0,
    success: totals?.success ?? 0,
    failed: totals?.failed ?? 0,
    bytes: Number(totals?.bytes ?? 0),
    downloads: totals?.downloads ?? 0,
    lastDay: totals?.lastDay ?? 0,
    successRate: finished > 0 ? Math.round(((totals?.success ?? 0) / finished) * 100) : 0,
    platforms: byPlatform.map((row) => ({
      id: row.platform,
      name: platformById(row.platform).nameAr,
      count: row.count,
    })),
    engine: { ytdlp: await hasYtdlp() },
  };
}

export async function findJob(id: string): Promise<DownloadRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await db.select().from(downloads).where(eq(downloads.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function markJobStarted(id: string) {
  await db
    .update(downloads)
    .set({ status: "processing", errorCode: null, errorMessage: null })
    .where(and(eq(downloads.id, id), eq(downloads.status, "error")));
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}:abd-downloader`).digest("hex").slice(0, 32);
}

const limiter = globalThis as typeof globalThis & {
  __abdRate?: Map<string, number[]>;
};

export function checkRateLimit(key: string, limit = 12, windowMs = 60_000) {
  const store = (limiter.__abdRate ??= new Map<string, number[]>());
  const now = Date.now();
  const hits = (store.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (hits.length >= limit) {
    const retryAfterMs = windowMs - (now - hits[0]!);
    store.set(key, hits);
    return { allowed: false as const, retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }
  hits.push(now);
  store.set(key, hits);
  if (store.size > 5000) store.clear();
  return { allowed: true as const, retryAfter: 0 };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "local";
}
