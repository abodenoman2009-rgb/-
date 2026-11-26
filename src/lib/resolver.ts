import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, rm, stat as fsStat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  isDirectMediaUrl,
  isStreamManifest,
  mediaExtension,
  platformById,
} from "./platforms";
import { humanSize } from "./format";

const execFileAsync = promisify(execFile);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

/** Hard ceiling for a single stream so a job can never exhaust server memory. */
export const MAX_BYTES = 300 * 1024 * 1024;

export type EngineId = "ytdlp" | "direct" | "demo";

export type ResolvedMedia = {
  engine: EngineId;
  remoteUrl: string;
  remoteHeaders?: Record<string, string>;
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  fileName: string;
  mimeType: string;
  quality: string;
  fileSizeBytes: number | null;
  note?: string;
};

export class ResolverError extends Error {
  code: string;
  hint: string;

  constructor(code: string, message: string, hint: string) {
    super(message);
    this.name = "ResolverError";
    this.code = code;
    this.hint = hint;
  }
}

type YtFormat = {
  url?: string;
  protocol?: string;
  ext?: string;
  vcodec?: string;
  acodec?: string;
  height?: number;
  width?: number;
  fps?: number;
  abr?: number;
  tbr?: number;
  filesize?: number;
  filesize_approx?: number;
  format_note?: string;
};

type YtInfo = {
  title?: string;
  fulltitle?: string;
  uploader?: string;
  channel?: string;
  creator?: string;
  thumbnail?: string;
  duration?: number;
  url?: string;
  ext?: string;
  acodec?: string;
  vcodec?: string;
  http_headers?: Record<string, string>;
  formats?: YtFormat[];
  entries?: YtInfo[];
  _type?: string;
};

const ytdlpCache = globalThis as typeof globalThis & {
  __abdYtdlp?: { command: string; prefix: string[] } | null;
};

async function probeYtdlp(command: string, prefix: string[]) {
  try {
    const { stdout } = await execFileAsync(command, [...prefix, "--version"], {
      timeout: 8000,
    });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/** Finds a usable yt-dlp (env override, PATH binary, or python module). */
export async function getYtdlpEngine(): Promise<{ command: string; prefix: string[] } | null> {
  if (ytdlpCache.__abdYtdlp !== undefined) return ytdlpCache.__abdYtdlp;

  const candidates: { command: string; prefix: string[] }[] = [];
  if (process.env.YTDLP_PATH) {
    candidates.push({ command: process.env.YTDLP_PATH, prefix: [] });
  }
  candidates.push({ command: "yt-dlp", prefix: [] });
  candidates.push({ command: "python3", prefix: ["-m", "yt_dlp"] });
  candidates.push({ command: "python", prefix: ["-m", "yt_dlp"] });

  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    if (await probeYtdlp(candidate.command, candidate.prefix)) {
      ytdlpCache.__abdYtdlp = candidate;
      return candidate;
    }
  }
  ytdlpCache.__abdYtdlp = null;
  return null;
}

function sanitizeFileName(value: string, extension: string): string {
  const cleaned = value
    .replace(/[\\/:*?"<>|\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110);
  const base = cleaned.length > 1 ? cleaned : "abd-video";
  return `${base}.${extension}`;
}

function extensionFromMime(mime: string | null): string {
  if (!mime) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("quicktime")) return "mov";
  if (mime.includes("matroska")) return "mkv";
  if (mime.includes("mpeg") && mime.startsWith("audio")) return "mp3";
  if (mime.includes("mp4") && mime.startsWith("audio")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("aac")) return "aac";
  return "mp4";
}

function cleanMime(raw: string | null): string {
  if (!raw) return "";
  return raw.split(";")[0]!.trim().toLowerCase();
}

function isMediaMime(mime: string): boolean {
  return mime.startsWith("video/") || mime.startsWith("audio/");
}

function parseFileNameFromHeaders(disposition: string | null): string | null {
  if (!disposition) return null;
  const extended = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (extended?.[1]) {
    try {
      return decodeURIComponent(extended[1]);
    } catch {
      /* ignore malformed */
    }
  }
  const simple = disposition.match(/filename="?([^";]+)"?/i);
  return simple?.[1]?.trim() ?? null;
}

async function probeDirect(url: string, format: string): Promise<ResolvedMedia | null> {
  if (isStreamManifest(url)) {
    throw new ResolverError(
      "manifest_stream",
      "الرابط يشير إلى بث مباشر بصيغة HLS/DASH وليس ملفاً جاهزاً.",
      "نزّل الفيديو من المنصة نفسها ثم ارفعه، أو انتظر دعم دمج البث.",
    );
  }

  const request = async (method: "HEAD" | "GET") =>
    fetch(url, {
      method,
      redirect: "follow",
      cache: "no-store",
      headers: method === "GET" ? { "user-agent": UA, range: "bytes=0-1" } : { "user-agent": UA },
      signal: AbortSignal.timeout(15000),
    });

  let response: Response | null = null;
  try {
    response = await request("HEAD");
    const mime = cleanMime(response.headers.get("content-type"));
    if (!response.ok || !isMediaMime(mime)) {
      response = await request("GET");
    }
  } catch {
    try {
      response = await request("GET");
    } catch {
      return null;
    }
  }

  if (!response) return null;
  const mime = cleanMime(response.headers.get("content-type"));
  if (!response.ok && response.status !== 206) return null;
  if (!isMediaMime(mime)) return null;

  const originalName = parseFileNameFromHeaders(response.headers.get("content-disposition"));
  const fromPath = (() => {
    try {
      const segment = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() ?? "");
      return segment.length > 0 ? segment : null;
    } catch {
      return null;
    }
  })();

  const detectedExt = mediaExtension(originalName ?? "") ?? mediaExtension(url) ?? extensionFromMime(mime);
  let extension = detectedExt;
  if (format === "audio" && mime.startsWith("video/")) {
    extension = detectedExt;
  }

  const lengthHeader = response.headers.get("content-range")?.split("/")[1] ?? response.headers.get("content-length");
  const size = lengthHeader ? Number(lengthHeader) : null;
  const duration = null;

  const baseName =
    (originalName ?? fromPath ?? "abd-video").replace(/\.[a-z0-9]{2,5}$/i, "") || "abd-video";

  return {
    engine: "direct",
    remoteUrl: url,
    title: baseName.replace(/[-_]+/g, " ").slice(0, 120),
    author: safeHostnameLabel(url),
    thumbnailUrl: null,
    durationSeconds: duration,
    fileName: sanitizeFileName(baseName, extension),
    mimeType: mime || `video/${extension}`,
    quality: size ? `${humanSize(size)} · ملف مباشر` : "رابط مباشر",
    fileSizeBytes: size && Number.isFinite(size) ? size : null,
    note:
      format === "audio" && mime.startsWith("video/")
        ? "الرابط المباشر يعرض الفيديو بصيغته الأصلية؛ التحويل إلى صوت يتم لروابط المنصات."
        : undefined,
  };
}

function safeHostnameLabel(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function pickFormat(info: YtInfo, format: string): { format: YtFormat; note?: string } {
  const all = (info.formats ?? []).filter((item) => {
    if (!item.url) return false;
    // HLS / DASH manifests are playlists, not downloadable files (they also
    // require muxing with ffmpeg, which the stateless server does not run).
    const protocol = (item.protocol ?? "").toLowerCase();
    if (/m3u8|mpegurl|dash|mpd/.test(protocol)) return false;
    if (/\.(m3u8|mpd)(\?|$)/i.test(item.url)) return false;
    if (item.ext === "mhtml") return false;
    return true;
  });
  const available = all.filter((item) => {
    const size = item.filesize ?? item.filesize_approx ?? 0;
    return size === 0 || size <= MAX_BYTES;
  });
  const pool = available.length > 0 ? available : all;

  if (format === "audio") {
    const audio = pool
      .filter((item) => item.acodec !== "none" && item.vcodec === "none")
      .sort((a, b) => (b.abr ?? b.tbr ?? 0) - (a.abr ?? a.tbr ?? 0));
    const preferred = audio.find((item) => item.ext === "m4a") ?? audio[0];
    if (preferred) return { format: preferred };
  }

  const progressive = pool.filter(
    (item) => item.vcodec !== "none" && item.acodec !== "none" && item.ext !== "mhtml",
  );
  const byQuality = (a: YtFormat, b: YtFormat) => {
    const aH = a.height ?? 0;
    const bH = b.height ?? 0;
    const aScore = aH > 1080 ? 1 : 0;
    const bScore = bH > 1080 ? 1 : 0;
    return aScore - bScore || bH - aH || (b.tbr ?? 0) - (a.tbr ?? 0);
  };
  const mp4 = progressive.filter((item) => item.ext === "mp4").sort(byQuality);
  const webm = progressive.filter((item) => item.ext === "webm").sort(byQuality);

  if (format === "webm") {
    if (webm[0]) return { format: webm[0] };
    if (mp4[0]) return { format: mp4[0], note: "لم يتوفر WEBM، تم اختيار أفضل ملف MP4." };
  }
  if (mp4[0]) return { format: mp4[0] };
  if (webm[0]) return { format: webm[0], note: "تم اختيار ملف WEBM لأنه الأعلى جودة المتاح." };
  if (progressive[0]) return { format: progressive[0] };

  const rankedVideoOnly = pool
    .filter((item) => item.vcodec !== "none")
    .sort((a, b) => {
      const compat = (item: YtFormat) => (item.vcodec?.startsWith("avc") ? 0 : 1);
      const cap = (height: number | undefined) => ((height ?? 0) > 1080 ? 1 : 0);
      return (
        cap(a.height) - cap(b.height) ||
        compat(a) - compat(b) ||
        (b.height ?? 0) - (a.height ?? 0)
      );
    });
  if (rankedVideoOnly[0]) {
    return {
      format: rankedVideoOnly[0],
      note: "المنصة لم توفر ملفاً مدمجاً (صوت + صورة) لهذا الفيديو، لذا قد يصل الملف بلا صوت.",
    };
  }

  if (info.url) {
    if (/\.(m3u8|mpd)(\?|$)/i.test(info.url)) {
      throw new ResolverError(
        "manifest_stream",
        "المصدر يعرض البث بصيغة قائمة تشغيل (HLS/DASH) وليس ملفاً جاهزاً.",
        "جرّب صيغة أخرى، أو نزّل الفيديو من المنصة مباشرةً.",
      );
    }
    return {
      format: {
        url: info.url,
        ext: info.ext,
        vcodec: info.vcodec,
        acodec: info.acodec,
      },
    };
  }

  throw new ResolverError(
    "no_formats",
    "لم نعثر على ملف فيديو قابل للتنزيل في هذا الرابط.",
    "جرّب رابطاً آخر أو رابطاً مباشراً ينتهي بـ mp4.",
  );
}

export function mapYtdlpError(stderr: string, platformId: string): ResolverError {
  const text = stderr.toLowerCase();
  if (text.includes("sign in to confirm") || text.includes("not a bot")) {
    return new ResolverError(
      "auth_blocked",
      "المنصة رفضت الطلب من عنوان الخادم (تحتاج تسجيل دخول أو كوكيز).",
      "هذا قيد من المنصة نفسها على خوادم الاستضافة. جرّب رابطاً مباشراً أو منصة أخرى، وستعمل بقية الصيغ.",
    );
  }
  if (text.includes("login") || text.includes("private") || text.includes("members-only")) {
    return new ResolverError(
      "private_content",
      "المحتوى خاص أو يحتاج تسجيل دخول.",
      "التحميل مقتصر على الفيديوهات العامة فقط.",
    );
  }
  if (text.includes("unsupported url")) {
    return new ResolverError(
      "unsupported_url",
      "هذا الموقع غير مدعوم من محرك الاستخراج.",
      "الصق رابط الفيديو المباشر (ينتهي بـ mp4) أو رابطاً من منصة مدعومة.",
    );
  }
  if (text.includes("not available") || text.includes("404") || text.includes("unavailable")) {
    return new ResolverError(
      "not_found",
      "الفيديو غير متاح أو تم حذفه.",
      "تأكد من فتح الرابط في المتصفح أولاً ثم أعد المحاولة.",
    );
  }
  if (text.includes("timed out") || text.includes("timeout")) {
    return new ResolverError(
      "timeout",
      "استغرق استخراج الفيديو وقتاً أطول من المسموح.",
      "أعد المحاولة، وقد تحتاج الشبكة إلى اتصال أسرع.",
    );
  }
  if (text.includes("requested format") || text.includes("no video formats")) {
    return new ResolverError(
      "no_formats",
      "لا توجد صيغة قابلة للتنزيل لهذا الفيديو.",
      "جرّب صيغة أخرى (مثلاً WEBM أو صوت).",
    );
  }
  const meta = platformById(platformId);
  return new ResolverError(
    "extract_failed",
    `تعذّر استخراج الفيديو من ${meta.nameAr}.`,
    "قد يكون الرابط قصيراً أو محمياً. جرّب نسخ الرابط الكامل من المتصفح.",
  );
}

async function resolveWithYtdlp(url: string, format: string, platformId: string): Promise<ResolvedMedia> {
  const engine = await getYtdlpEngine();
  if (!engine) {
    throw new ResolverError(
      "engine_missing",
      "محرك الاستخراج yt-dlp غير مثبت على هذا الخادم.",
      "الروابط المباشرة (mp4/webm) تعمل الآن. لتشغيل منصات التواصل ثبّت yt-dlp على الخادم ثم أعد التشغيل.",
    );
  }

  let stdout: string;
  let stderr = "";
  try {
    const result = await execFileAsync(
      engine.command,
      [
        ...engine.prefix,
        "-J",
        "--js-runtimes",
        "node",
        "--no-warnings",
        "--no-playlist",
        "--socket-timeout",
        "15",
        "--retries",
        "1",
        url,
      ],
      { timeout: 45000, maxBuffer: 48 * 1024 * 1024, encoding: "utf8" },
    );
    stdout = result.stdout;
    stderr = result.stderr ?? "";
  } catch (error) {
    const failed = error as { stderr?: string; stdout?: string; killed?: boolean; signal?: string };
    stderr = failed.stderr ?? "";
    if (failed.killed || failed.signal === "SIGTERM") {
      throw new ResolverError(
        "timeout",
        "تجاوز الاستخراج المهلة المحددة (45 ثانية).",
        "أعد المحاولة أو اختر صيغة أخف.",
      );
    }
    throw mapYtdlpError(stderr, platformId);
  }

  if (!stdout.trim() || stdout.trim() === "null") {
    throw mapYtdlpError(stderr, platformId);
  }

  let info: YtInfo;
  try {
    info = JSON.parse(stdout) as YtInfo;
  } catch {
    throw new ResolverError(
      "bad_response",
      "أعاد المحرك بيانات غير مفهومة.",
      "أعد المحاولة بعد لحظات.",
    );
  }

  if (info._type === "playlist" && info.entries?.length) {
    info = info.entries.find((entry) => Boolean(entry)) ?? info;
  }

  const { format: chosen, note } = pickFormat(info, format);
  if (!chosen.url) {
    throw new ResolverError(
      "no_formats",
      "لم نعثر على رابط ملف قابل للتنزيل.",
      "جرّب صيغة أخرى.",
    );
  }

  const extension = chosen.ext && chosen.ext !== "mhtml" ? chosen.ext : format === "audio" ? "m4a" : "mp4";
  const isAudioOnly = format === "audio" && chosen.vcodec === "none";
  const size = chosen.filesize ?? chosen.filesize_approx ?? null;
  const qualityParts: string[] = [];
  if (isAudioOnly) {
    if (chosen.abr) qualityParts.push(`${Math.round(chosen.abr)} kbps`);
  } else if (chosen.height) {
    const bestHeight = Math.max(
      chosen.height,
      ...(info.formats ?? []).filter((item) => item.vcodec !== "none").map((item) => item.height ?? 0),
    );
    qualityParts.push(`${bestHeight}p`);
    if (chosen.fps && chosen.fps >= 50) qualityParts.push(`${Math.round(chosen.fps)}fps`);
  } else if (chosen.format_note) {
    qualityParts.push(chosen.format_note);
  }
  if (size && !(chosen.height && qualityParts[0] !== `${chosen.height}p`)) qualityParts.push(humanSize(size));

  const title = (info.title ?? info.fulltitle ?? "فيديو").toString().trim();
  const author = info.uploader ?? info.channel ?? info.creator ?? null;
  const headers: Record<string, string> = { "user-agent": UA };
  for (const [key, value] of Object.entries(info.http_headers ?? {})) {
    if (typeof value === "string") headers[key.toLowerCase()] = value;
  }
  headers["user-agent"] = headers["user-agent"] || UA;

  const mime = isAudioOnly
    ? extension === "mp3"
      ? "audio/mpeg"
      : extension === "m4a"
        ? "audio/mp4"
        : `audio/${extension}`
    : extension === "webm"
      ? "video/webm"
      : extension === "mp4"
        ? "video/mp4"
        : `video/${extension}`;

  return {
    engine: "ytdlp",
    remoteUrl: chosen.url,
    remoteHeaders: headers,
    title: title.slice(0, 180),
    author: author ? author.toString().slice(0, 120) : null,
    thumbnailUrl: info.thumbnail ?? null,
    durationSeconds: info.duration ? Math.round(info.duration) : null,
    fileName: sanitizeFileName(title, extension),
    mimeType: mime,
    quality: qualityParts.join(" · ") || "أفضل جودة متاحة",
    fileSizeBytes: size && Number.isFinite(size) ? Math.round(size) : null,
    note,
  };
}

/**
 * Resolves a public URL into streamable media. Direct media links are probed
 * first (cheap, no external binary); everything else goes through yt-dlp.
 */
export async function resolveMedia(rawUrl: string, format: string, platformId: string): Promise<ResolvedMedia> {
  const preferDirect = platformId === "direct" || isDirectMediaUrl(rawUrl);

  if (preferDirect) {
    const direct = await probeDirect(rawUrl, format);
    if (direct) return direct;
    if (platformId === "direct") {
      throw new ResolverError(
        "not_media",
        "الرابط لا يعيد ملف فيديو أو صوت صالحاً.",
        "تأكد أن الرابط يفتح الملف مباشرة في المتصفح (mp4 / webm / mp3).",
      );
    }
  }

  try {
    return await resolveWithYtdlp(rawUrl, format, platformId);
  } catch (error) {
    if (!preferDirect) {
      const direct = await probeDirect(rawUrl, format).catch(() => null);
      if (direct) return direct;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Best-quality download: yt-dlp fetches the best video + best audio and ffmpeg
// merges them into one H.264/AAC MP4 (plays on iPhone, Android and desktop).
// ---------------------------------------------------------------------------

const TMP_ROOT = path.join(os.tmpdir(), "abd-downloads");
const MAX_PARALLEL = 3;
let activeDownloads = 0;

export type PreparedFile = {
  filePath: string;
  size: number;
  fileName: string;
  mimeType: string;
  cleanup: () => Promise<void>;
};

async function sweepOld() {
  try {
    const dirs = await readdir(TMP_ROOT);
    const now = Date.now();
    await Promise.all(
      dirs.map(async (dir) => {
        const full = path.join(TMP_ROOT, dir);
        const info = await fsStat(full).catch(() => null);
        if (info && now - info.mtimeMs > 30 * 60 * 1000) await rm(full, { recursive: true, force: true });
      }),
    );
  } catch {
    /* nothing to sweep */
  }
}

export async function prepareBestFile(
  sourceUrl: string,
  platformId: string,
  title: string | null,
): Promise<PreparedFile> {
  const engine = await getYtdlpEngine();
  if (!engine) {
    throw new ResolverError(
      "engine_missing",
      "محرك التحميل غير مثبت على الخادم.",
      "أعد المحاولة لاحقاً أو تواصل مع مالك الموقع.",
    );
  }
  if (activeDownloads >= MAX_PARALLEL) {
    throw new ResolverError(
      "busy",
      "الخادم مشغول بتجهيز فيديوهات أخرى.",
      "انتظر دقيقة ثم اضغط تنزيل مرة أخرى.",
    );
  }

  activeDownloads += 1;
  const dir = path.join(TMP_ROOT, randomUUID());
  const cleanup = async () => {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  };

  try {
    void sweepOld();
    await mkdir(dir, { recursive: true });
    try {
      await execFileAsync(
        engine.command,
        [
          ...engine.prefix,
          "--js-runtimes",
          "node",
          "--no-warnings",
          "--no-playlist",
          "--no-part",
          "--socket-timeout",
          "20",
          "--retries",
          "3",
          "--concurrent-fragments",
          "4",
          "--max-filesize",
          `${Math.round(MAX_BYTES / (1024 * 1024))}M`,
          "-f",
          "bv*[filesize<?280M]+ba/b[filesize<?280M]/bv*+ba/b",
          // H.264 + AAC in MP4 first (plays everywhere, incl. iPhone), then highest resolution.
          "-S",
          "vcodec:h264,ext:mp4:m4a,res,acodec:aac",
          "--merge-output-format",
          "mp4",
          "-o",
          path.join(dir, "video.%(ext)s"),
          sourceUrl,
        ],
        { timeout: 280_000, maxBuffer: 16 * 1024 * 1024, encoding: "utf8" },
      );
    } catch (error) {
      const failed = error as { stderr?: string; killed?: boolean; signal?: string };
      if (failed.killed || failed.signal === "SIGTERM") {
        throw new ResolverError(
          "timeout",
          "استغرق تجهيز الفيديو وقتاً أطول من المسموح.",
          "الفيديو كبير جداً أو الاتصال بطيء. أعد المحاولة.",
        );
      }
      const stderr = failed.stderr ?? "";
      if (/larger than max-filesize|max-filesize/i.test(stderr)) {
        throw new ResolverError(
          "too_large",
          "حجم الفيديو أكبر من الحد المسموح (300MB).",
          "جرّب فيديو أقصر.",
        );
      }
      if (/ffmpeg/i.test(stderr) && /not found|ffprobe and ffmpeg/i.test(stderr)) {
        throw new ResolverError("ffmpeg_missing", "أداة دمج الصوت والصورة غير مثبتة.", "تواصل مع مالك الموقع.");
      }
      throw mapYtdlpError(stderr, platformId);
    }

    // yt-dlp skips (exit 0) a file bigger than --max-filesize, so no output means "too large".
    const files = (await readdir(dir)).filter((name) => /^video\.[a-z0-9]+$/i.test(name));
    const name = files.find((item) => item.endsWith(".mp4")) ?? files[0];
    if (!name) {
      throw new ResolverError(
        "too_large",
        "حجم الفيديو أكبر من الحد المسموح (300MB) أو لم يتوفر ملف قابل للتنزيل.",
        "جرّب فيديو أقصر أو رابطاً آخر.",
      );
    }
    let filePath = path.join(dir, name);
    // Anything that is not MP4/MOV may not play on iPhone: convert to H.264/AAC MP4.
    if (!/\.(mp4|mov)$/i.test(name)) {
      const converted = path.join(dir, "video-converted.mp4");
      try {
        await execFileAsync(
          "ffmpeg",
          ["-y", "-i", filePath, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-movflags", "+faststart", converted],
          { timeout: 200_000, maxBuffer: 16 * 1024 * 1024 },
        );
        filePath = converted;
      } catch {
        throw new ResolverError(
          "convert_failed",
          "تعذّر تحويل الفيديو إلى صيغة MP4 متوافقة مع الجوال.",
          "أعد المحاولة أو جرّب رابطاً آخر.",
        );
      }
    }
    const info = await fsStat(filePath);
    if (info.size === 0) {
      throw new ResolverError("empty_file", "الملف الناتج فارغ.", "أعد المحاولة بعد لحظات.");
    }
    const extension = filePath.split(".").pop()!.toLowerCase();
    const mimeType = extension === "mov" ? "video/quicktime" : "video/mp4";
    return {
      filePath,
      size: info.size,
      fileName: sanitizeFileName(title ?? "abd-video", extension),
      mimeType,
      cleanup: async () => {
        activeDownloads = Math.max(0, activeDownloads - 1);
        await cleanup();
      },
    };
  } catch (error) {
    activeDownloads = Math.max(0, activeDownloads - 1);
    await cleanup();
    throw error;
  }
}
