"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandIcon, UiIcon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { Reveal, Tilt } from "@/components/motion";
import {
  FEATURED_PLATFORMS,
  detectPlatform,
  platformById,
} from "@/lib/platforms";
import { formatDuration, formatNumber, humanSize, timeAgo } from "@/lib/format";
import type { PublicJob, ResolveErrorInfo, SiteStats } from "@/lib/types";

type Phase = "idle" | "loading" | "success" | "error";

function validateUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "الصق رابط الفيديو أولاً.";
  if (value.length < 10) return "الرابط قصير جداً — انسخه كاملاً من المتصفح.";
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "الرابط غير صحيح. تأكد من كتابته مع https://";
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return "يُسمح بروابط http و https فقط.";
  return null;
}

function PlatformTile({ platform, size = 38 }: { platform: string; size?: number }) {
  const meta = platformById(platform);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl border border-white/10"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(150deg, ${meta.accent}2e, rgba(255,255,255,0.03))`,
        color: meta.accent,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12)`,
      }}
      aria-hidden="true"
    >
      <BrandIcon platform={platform} className="h-[45%] w-[45%]" />
    </span>
  );
}

function Thumb({ job }: { job: PublicJob }) {
  const [failed, setFailed] = useState(false);
  const meta = platformById(job.platform);
  const showImage = Boolean(job.thumbnailUrl && job.thumbnailUrl.startsWith("http")) && !failed;

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10"
      style={{
        background: `radial-gradient(120% 120% at 15% 0%, ${meta.accent}33, transparent 55%), linear-gradient(150deg, #0c1220, #070b16)`,
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={job.thumbnailUrl ?? ""}
          alt={job.title ?? "معاينة الفيديو"}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-white/70">
          <BrandIcon platform={job.platform} className="h-9 w-9" style={{ color: meta.accent }} />
          <span className="text-[0.68rem] font-semibold tracking-wide text-mist/60">
            {job.platformName}
          </span>
        </div>
      )}
      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
        <span className="chip !border-white/20 !bg-black/55 !text-[0.65rem] backdrop-blur">
          <UiIcon name="film" className="h-3 w-3" />
          {job.format === "audio" ? "صوت" : job.format.toUpperCase()}
        </span>
        {job.quality ? (
          <span className="chip !border-white/20 !bg-black/55 !text-[0.65rem] backdrop-blur">
            {job.quality.split(" · ")[0]}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ActivityRow({
  job,
  mounted,
  onSampleRetry,
}: {
  job: PublicJob;
  mounted: boolean;
  onSampleRetry: () => void;
}) {
  const ready = job.status === "ready";
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 transition hover:border-white/15 hover:bg-white/[0.05]">
      <PlatformTile platform={job.platform} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.86rem] font-bold text-white/90">
          {job.title ?? (ready ? "ملف جاهز للتنزيل" : job.errorMessage ?? "محاولة تحميل")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] text-mist/50">
          <span className="font-semibold text-mist/70">{job.platformName}</span>
          {job.quality ? <span aria-hidden="true">·</span> : null}
          {job.quality ? <span className="truncate">{job.quality.split(" · ")[0]}</span> : null}
          {job.fileSizeBytes ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{humanSize(job.fileSizeBytes)}</span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{mounted ? timeAgo(job.createdAt, Date.now()) : "قبل قليل"}</span>
          {job.isSample ? (
            <span className="rounded-full border border-mint/30 bg-mint/10 px-1.5 py-0.5 text-[0.6rem] font-bold text-mint">
              عيّنة
            </span>
          ) : null}
        </div>
      </div>
      {ready ? (
        <a
          href={`/api/download/${job.id}`}
          className="grid h-9 w-9 place-items-center rounded-xl border border-mint/25 bg-mint/10 text-mint transition hover:bg-mint/20"
          title="تنزيل الملف"
          aria-label={`تنزيل ${job.title ?? "الملف"}`}
        >
          <UiIcon name="download" className="h-4 w-4" />
        </a>
      ) : job.status === "error" ? (
        <button
          type="button"
          onClick={onSampleRetry}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-mist/70 transition hover:text-white"
          title="تجربة ملف جاهز"
          aria-label="تجربة ملف جاهز"
        >
          <UiIcon name="refresh" className="h-4 w-4" />
        </button>
      ) : (
        <span className="h-2 w-2 animate-pulse rounded-full bg-iris" aria-label="قيد المعالجة" />
      )}
    </li>
  );
}

export function DownloaderClient({
  initialJobs,
  initialStats,
}: {
  initialJobs: PublicJob[];
  initialStats: SiteStats;
}) {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [job, setJob] = useState<PublicJob | null>(null);
  const [error, setError] = useState<ResolveErrorInfo | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [jobs, setJobs] = useState<PublicJob[]>(initialJobs);
  const [stats, setStats] = useState<SiteStats>(initialStats);
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState<{ id: string; percent: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const pre = window.sessionStorage.getItem("abd-prefill");
      if (pre) {
        window.sessionStorage.removeItem("abd-prefill");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUrl(pre);
      }
    } catch {}
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const refresh = useCallback(async () => {
    try {
      const [jobsResponse, statsResponse] = await Promise.all([
        fetch("/api/jobs?limit=6", { cache: "no-store" }),
        fetch("/api/stats", { cache: "no-store" }),
      ]);
      const jobsData = (await jobsResponse.json()) as { ok: boolean; jobs?: PublicJob[] };
      const statsData = (await statsResponse.json()) as { ok: boolean; stats?: SiteStats };
      if (jobsData.ok && jobsData.jobs) setJobs(jobsData.jobs);
      if (statsData.ok && statsData.stats) setStats(statsData.stats);
    } catch {
      /* keep previous data if the refresh fails */
    }
  }, []);

  const preparedRef = useRef<{ id: string; file: File } | null>(null);

  const deliverFile = useCallback(
    async (file: File, title: string | null): Promise<"shared" | "saved" | "blocked" | "cancelled"> => {
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };
      const isMobile =
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

      // Phones and tablets: open the native share sheet (Save Video, Files, WhatsApp...).
      if (isMobile && nav.share && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: title ?? file.name });
          return "shared";
        } catch (caught) {
          const name = caught instanceof DOMException ? caught.name : "";
          if (name === "AbortError") return "cancelled";
          if (name === "NotAllowedError") return "blocked";
          // any other failure: fall through to a normal file save
        }
      }

      const blobUrl = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      return "saved";
    },
    [],
  );

  const startDownload = useCallback(
    async (target: PublicJob) => {
      if (downloading) return;

      // Already prepared (the browser asked for a fresh tap before opening the share sheet).
      const ready = preparedRef.current;
      if (ready && ready.id === target.id) {
        const outcome = await deliverFile(ready.file, target.title);
        if (outcome === "blocked") {
          setNotice("اضغط «تنزيل الآن» مرة أخرى لفتح نافذة الحفظ والمشاركة");
        } else {
          if (outcome === "shared" || outcome === "saved") void refresh();
          setNotice(outcome === "cancelled" ? "تم إغلاق نافذة المشاركة — اضغط تنزيل الآن للمحاولة مجدداً" : null);
        }
        return;
      }

      setDownloading({ id: target.id, percent: 3 });
      setNotice("جارٍ تجهيز الفيديو بأعلى جودة… قد يستغرق ذلك لحظات");

      const fail = (info: ResolveErrorInfo) => {
        setDownloading(null);
        setNotice(null);
        setError(info);
        setPhase("error");
      };

      try {
        const response = await fetch(`/api/download/${target.id}`, { cache: "no-store" });
        if (!response.ok || !response.body) {
          let info: ResolveErrorInfo = {
            code: "download_failed",
            message: "تعذّر تجهيز الفيديو.",
            hint: "أعد المحاولة بعد لحظات.",
          };
          try {
            const data = (await response.json()) as { error?: string; code?: string; hint?: string };
            info = {
              code: data.code ?? info.code,
              message: data.error ?? info.message,
              hint: data.hint ?? info.hint,
            };
          } catch {
            /* keep the generic message */
          }
          fail(info);
          return;
        }

        const total = Number(response.headers.get("content-length") ?? "0");
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        setNotice(null);

        for (;;) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.byteLength;
            if (total > 0) {
              setDownloading({ id: target.id, percent: Math.min(99, Math.max(3, Math.round((received / total) * 100))) });
            }
          }
        }

        if (received === 0 || (total > 0 && received < total)) {
          fail({
            code: "incomplete",
            message: "انقطع التحميل قبل اكتمال الفيديو.",
            hint: "تحقق من اتصالك بالإنترنت ثم اضغط تنزيل مرة أخرى.",
          });
          return;
        }

        let fileName = target.fileName ?? "abd-video.mp4";
        const headerName = response.headers.get("x-file-name");
        if (headerName) {
          try {
            fileName = decodeURIComponent(headerName);
          } catch {
            /* keep the job's name */
          }
        }
        const type = response.headers.get("content-type")?.split(";")[0] || target.mimeType || "video/mp4";
        const file = new File(chunks as BlobPart[], fileName, { type });
        preparedRef.current = { id: target.id, file };
        setDownloading({ id: target.id, percent: 100 });

        const outcome = await deliverFile(file, target.title);
        if (outcome === "blocked") {
          setNotice("الفيديو جاهز — اضغط «تنزيل الآن» لفتح نافذة الحفظ والمشاركة");
        } else if (outcome === "cancelled") {
          setNotice("تم إغلاق نافذة المشاركة — اضغط تنزيل الآن للمحاولة مجدداً");
        } else {
          void refresh();
        }
        window.setTimeout(() => setDownloading(null), 800);
      } catch {
        fail({
          code: "network",
          message: "انقطع الاتصال أثناء تحميل الفيديو.",
          hint: "تحقق من اتصالك بالإنترنت ثم أعد المحاولة.",
        });
      }
    },
    [deliverFile, downloading, refresh],
  );

  const submit = useCallback(
    async (options?: { sample?: boolean }) => {
      if (phase === "loading") return;

      if (!options?.sample) {
        const reason = validateUrl(url);
        if (reason) {
          setError({ code: "invalid_url", message: reason, hint: "مثال: https://vt.tiktok.com/ZSabc123/" });
          setPhase("error");
          inputRef.current?.focus();
          return;
        }
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 75_000);

      setPhase("loading");
      setElapsed(0);
      setError(null);
      setJob(null);
      setPreview(false);
      preparedRef.current = null;

      try {
        const response = await fetch("/api/resolve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            options?.sample ? { sample: true } : { url: url.trim() },
          ),
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          ok: boolean;
          job?: PublicJob | null;
          error?: ResolveErrorInfo;
        };

        if (data.ok && data.job) {
          setJob(data.job);
          setPhase("success");
          void startDownload(data.job);
        } else {
          setError(
            data.error ?? {
              code: "unknown",
              message: "تعذّر تنفيذ الطلب.",
              hint: "أعد المحاولة بعد لحظات.",
            },
          );
          setPhase("error");
        }
      } catch (caught) {
        const aborted = caught instanceof DOMException && caught.name === "AbortError";
        setError(
          aborted
            ? {
                code: "timeout",
                message: "استغرقت العملية وقتاً أطول من المسموح.",
                hint: "أعد المحاولة، أو اختر صيغة أخف، أو جرّب رابطاً مباشراً.",
              }
            : {
                code: "network",
                message: "تعذّر الاتصال بالخادم.",
                hint: "تأكد من اتصالك بالإنترنت ثم أعد المحاولة.",
              },
        );
        setPhase("error");
      } finally {
        window.clearTimeout(timeout);
        void refresh();
      }
    },
    [phase, refresh, startDownload, url],
  );

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setUrl(text.trim());
        setNotice("تم لصق الرابط");
        setPhase("idle");
        setError(null);
      } else {
        setNotice("الحافظة فارغة — الصق الرابط يدوياً");
      }
    } catch {
      setNotice("المتصفح منع قراءة الحافظة — الصق بـ Ctrl + V");
      inputRef.current?.focus();
    }
  }, []);

  const detected = useMemo(() => {
    const value = url.trim();
    if (value.length < 8) return null;
    const id = detectPlatform(value);
    return platformById(id);
  }, [url]);

  const steps = [
    { label: "قراءة الرابط والتحقق منه", icon: "link" as const },
    { label: "استخراج بيانات الفيديو من المصدر", icon: "sparkle" as const },
    { label: "تجهيز رابط التنزيل المباشر", icon: "download" as const },
  ];
  const activeStep = elapsed < 4 ? 0 : elapsed < 9 ? 1 : 2;
  const progress = Math.min(94, 18 + elapsed * 9);

  return (
    <div className="space-y-10">
      {/* ------------------------------- downloader ------------------------------ */}
      <section
        id="download"
        className="glass card-sheen relative overflow-visible rounded-[28px] p-5 sm:p-7"
        aria-labelledby="downloader-title"
      >
        <div className="pointer-events-none absolute -top-[104px] inset-inline-start-3 hidden w-[92px] xl:block">
          <Mascot variant="present" speech="هنا 👇" interactive={false} />
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-mint/25 bg-mint/10 text-mint">
              <UiIcon name="bolt" className="h-5 w-5" />
            </span>
            <div>
              <h2 id="downloader-title" className="text-base font-extrabold text-white">
                جاهز للتحميل
              </h2>
              <p className="text-[0.72rem] text-mist/55">الصق الرابط واضغط تنزيل.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {detected ? (
              <span
                className="chip"
                style={{
                  borderColor: `${detected.accent}55`,
                  background: `${detected.accent}14`,
                  color: detected.accent,
                }}
              >
                <BrandIcon platform={detected.id} className="h-3.5 w-3.5" />
                {detected.id === "direct" ? "ملف مباشر" : `تم رصد ${detected.nameAr}`}
              </span>
            ) : (
              <span className="chip">
                <UiIcon name="globe" className="h-3.5 w-3.5" />
                1000+ موقع مدعوم
              </span>
            )}
            <span className="chip !hidden sm:!inline-flex">
              <UiIcon name="lock" className="h-3.5 w-3.5 text-mint" />
              اتصال آمن
            </span>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="space-y-4"
        >
          <div className="input-shell relative px-3.5 py-3">
            <textarea
              ref={inputRef}
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (phase === "error") {
                  setPhase("idle");
                  setError(null);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              rows={2}
              spellCheck={false}
              autoComplete="off"
              aria-label="رابط الفيديو"
              placeholder="https://www.tiktok.com/@user/video/123456789"
              className="url-input"
              style={{ minHeight: "3rem" }}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => void handlePaste()} className="btn-ghost !px-2.5 !py-1.5 !text-xs">
                  <UiIcon name="clipboard" className="h-3.5 w-3.5" />
                  لصق
                </button>
                {url ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUrl("");
                      setPhase("idle");
                      setError(null);
                      inputRef.current?.focus();
                    }}
                    className="btn-ghost !px-2.5 !py-1.5 !text-xs"
                  >
                    <UiIcon name="close" className="h-3.5 w-3.5" />
                    مسح
                  </button>
                ) : null}
              </div>
              <span className="text-[0.68rem] text-mist/40">
                {url.trim().length > 0 ? `${url.trim().length} حرفاً` : "لصق بـ Ctrl + V · تنزيل بـ Enter"}
              </span>
            </div>
          </div>

          <button type="submit" disabled={phase === "loading"} className="btn-primary glow-button press-3d w-full !rounded-2xl !py-3.5 text-base">
            {phase === "loading" ? (
              <>
                <UiIcon name="refresh" className="h-5 w-5 animate-spin" />
                جارٍ تجهيز الملف…
              </>
            ) : (
              <>
                <UiIcon name="download" className="h-5 w-5" strokeWidth={2.1} />
                تنزيل الفيديو
              </>
            )}
          </button>
        </form>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {FEATURED_PLATFORMS.slice(0, 6).map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => {
                  setNotice(`الصق رابط ${platform.nameAr} في الحقل أعلاه`);
                  inputRef.current?.focus();
                }}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[0.65rem] font-semibold text-mist/60 transition hover:border-white/25 hover:text-white"
                title={`لصق رابط ${platform.nameAr}`}
              >
                <BrandIcon platform={platform.id} className="h-3 w-3" />
                {platform.nameAr}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void submit({ sample: true })}
            className="text-[0.7rem] font-bold text-mint/85 underline decoration-mint/30 decoration-dotted underline-offset-4 transition hover:text-mint"
          >
            جرّب ملفاً تجريبياً →
          </button>
        </div>

        <div aria-live="polite" className="mt-5 empty:mt-0">
          {notice ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-[0.72rem] font-semibold text-mist/80">
              {notice}
            </p>
          ) : null}
        </div>

        {!stats.engine.ytdlp ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] p-3 text-[0.72rem] leading-6 text-amber-100/80">
            <UiIcon name="server" className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
            <span>
              محرك <span className="font-mono">yt-dlp</span> غير مثبّت على هذا الخادم، لذلك قد تفشل روابط
              المنصات. الروابط المباشرة (mp4/webm) تعمل، والملف التجريبي متاح للتجربة.
            </span>
          </div>
        ) : null}

        {/* -------------------------------- loading ------------------------------- */}
        {phase === "loading" ? (
          <div className="mt-5 rounded-2xl border border-iris/25 bg-iris/[0.06] p-4">
            <div className="mb-3 flex items-center justify-between text-[0.75rem]">
              <span className="font-bold shimmer-text">جارٍ استخراج الفيديو…</span>
              <span className="font-mono text-mist/50">{elapsed}s</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%`, transition: "width 1s linear" }} />
            </div>
            <ul className="mt-3.5 space-y-2">
              {steps.map((step, index) => {
                const done = index < activeStep;
                const active = index === activeStep;
                return (
                  <li key={step.label} className="flex items-center gap-2.5 text-[0.75rem]">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-lg border ${
                        done
                          ? "border-mint/40 bg-mint/15 text-mint"
                          : active
                            ? "border-iris/40 bg-iris/15 text-iris"
                            : "border-white/10 bg-white/5 text-mist/35"
                      }`}
                    >
                      {done ? (
                        <UiIcon name="check" className="h-3 w-3" strokeWidth={2.6} />
                      ) : (
                        <UiIcon name={step.icon} className={`h-3 w-3 ${active ? "animate-pulse" : ""}`} />
                      )}
                    </span>
                    <span className={done ? "text-mist/60" : active ? "font-bold text-white" : "text-mist/40"}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[0.68rem] leading-6 text-mist/45">
              قد يستغرق هذا حتى ٤٥ ثانية حسب المنصة. الملف لن يُخزَّن على الخادم.
            </p>
          </div>
        ) : null}

        {/* --------------------------------- error -------------------------------- */}
        {phase === "error" && error ? (
          <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-400/[0.07] p-4" role="alert">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-rose-400/30 bg-rose-400/10 text-rose-300">
                <UiIcon name="alert" className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.84rem] font-bold text-rose-100">{error.message}</p>
                {error.hint ? (
                  <p className="mt-1 text-[0.72rem] leading-6 text-rose-100/65">{error.hint}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => void submit()} className="btn-ghost !py-1.5 !text-xs">
                    <UiIcon name="refresh" className="h-3.5 w-3.5" />
                    إعادة المحاولة
                  </button>
                  <button
                    type="button"
                    onClick={() => void submit({ sample: true })}
                    className="btn-ghost !py-1.5 !text-xs"
                  >
                    <UiIcon name="film" className="h-3.5 w-3.5" />
                    ملف تجريبي
                  </button>
                  <Link href="#faq" className="text-[0.7rem] font-bold text-mist/60 underline underline-offset-4 hover:text-white">
                    لماذا فشل الرابط؟
                  </Link>
                </div>
                {error.code ? (
                  <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-widest text-rose-200/35">
                    {error.code}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* -------------------------------- success ------------------------------- */}
        {phase === "success" && job ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-mint/25 bg-mint/[0.05] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="chip !border-mint/35 !bg-mint/10 !text-mint">
                <UiIcon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />
                الملف جاهز للتنزيل
              </span>
              <span className="flex items-center gap-1.5">
                {job.isSample ? (
                  <span className="chip !border-iris/30 !bg-iris/10 !text-iris">ملف عيّنة</span>
                ) : null}
                <span className="chip">
                  <UiIcon name="server" className="h-3.5 w-3.5" />
                  {job.engine === "ytdlp" ? "yt-dlp" : job.engine === "demo" ? "ملف محلي" : "رابط مباشر"}
                </span>
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <Thumb job={job} />
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-[0.95rem] font-extrabold leading-7 text-white">
                  {job.title ?? "الفيديو جاهز"}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] text-mist/55">
                  <span className="font-bold text-mist/80">{job.platformName}</span>
                  {job.author ? <span>· {job.author}</span> : null}
                  {formatDuration(job.durationSeconds) ? (
                    <span className="inline-flex items-center gap-1">
                      <UiIcon name="clock" className="h-3 w-3" />
                      {formatDuration(job.durationSeconds)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="chip">
                    <UiIcon name="file" className="h-3.5 w-3.5 text-mint" />
                    {humanSize(job.fileSizeBytes)}
                  </span>
                  {job.quality ? <span className="chip">{job.quality.split(" · ")[0]}</span> : null}
                  <span className="chip uppercase">{job.format === "audio" ? "M4A" : job.format}</span>
                </div>

                {job.note ? (
                  <p className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-2.5 py-2 text-[0.68rem] leading-6 text-amber-100/75">
                    <UiIcon name="alert" className="mt-1 h-3.5 w-3.5 shrink-0" />
                    {job.note}
                  </p>
                ) : null}

                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void startDownload(job)}
                    disabled={downloading !== null}
                    className="btn-primary glow-button press-3d !py-2.5 !text-sm"
                  >
                    <UiIcon
                      name={downloading && downloading.percent < 100 ? "refresh" : "download"}
                      className={`h-4 w-4 ${downloading && downloading.percent < 100 ? "animate-spin" : ""}`}
                      strokeWidth={2.2}
                    />
                    {downloading
                      ? downloading.percent >= 100
                        ? "تم التنزيل ✓"
                        : `جارٍ التنزيل ${downloading.percent}%`
                      : "تنزيل الآن"}
                  </button>
                  <button type="button" onClick={() => setPreview((value) => !value)} className="btn-ghost !py-2.5 !text-sm">
                    <UiIcon name={preview ? "close" : "play"} className="h-4 w-4" />
                    {preview ? "إغلاق المعاينة" : "معاينة"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("idle");
                      setJob(null);
                      setUrl("");
                      inputRef.current?.focus();
                    }}
                    className="btn-ghost !py-2.5 !text-sm"
                  >
                    <UiIcon name="link" className="h-4 w-4" />
                    رابط آخر
                  </button>
                </div>
              </div>
            </div>

            {downloading ? (
              <div className="mt-3.5">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${downloading.percent}%`, transition: "width .25s linear" }} />
                </div>
                <p className="mt-1.5 text-[0.66rem] text-mint/70">
                  ننقل الملف مباشرة إلى جهازك — {downloading.percent}%
                </p>
              </div>
            ) : null}

            {preview ? (
              <div className="mt-4">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  key={job.id}
                  src={`/api/download/${job.id}?inline=1`}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full rounded-2xl border border-white/10 bg-black"
                />
              </div>
            ) : null}

            <p className="mt-3 text-[0.68rem] leading-6 text-mint/60">
              إن لم يبدأ التنزيل تلقائياً، اضغط «تنزيل الآن» مرة أخرى. يُنصح بحفظ الملف في مجلد التنزيلات.
            </p>
          </div>
        ) : null}
      </section>

      {/* --------------------------------- stats -------------------------------- */}
      <section aria-label="أرقام الخادم" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "عمليات المعالجة",
            value: formatNumber(stats.total),
            hint: `${formatNumber(stats.lastDay)} خلال 24 ساعة`,
            icon: "server" as const,
          },
          {
            label: "ملفات جاهزة",
            value: formatNumber(stats.success),
            hint: `${stats.successRate}% نسبة النجاح`,
            icon: "check" as const,
          },
          {
            label: "حجم الملفات",
            value: humanSize(stats.bytes),
            hint: "وسائط مرّت عبر الخادم",
            icon: "film" as const,
          },
          {
            label: "تنزيلات مكتملة",
            value: formatNumber(stats.downloads),
            hint: stats.engine.ytdlp ? "محرك yt-dlp متصل" : "وضع الروابط المباشرة",
            icon: "download" as const,
          },
        ].map((item, index) => (
          <Reveal key={item.label} delay={index * 60}>
          <div className="glass rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[0.66rem] font-semibold text-mist/50">{item.label}</span>
              <UiIcon name={item.icon} className="h-3.5 w-3.5 text-mint/70" />
            </div>
            <p className="mt-1.5 text-xl font-extrabold text-white">{item.value}</p>
            <p className="mt-0.5 text-[0.62rem] text-mist/40">{item.hint}</p>
          </div>
          </Reveal>
        ))}
      </section>

      {/* -------------------------------- activity ------------------------------ */}
      <Reveal as="section">
      <section id="activity" className="glass rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
              <UiIcon name="clock" className="h-4 w-4 text-iris" />
              سجل العمليات
            </h2>
            <p className="mt-0.5 text-[0.7rem] text-mist/45">آخر الطلبات على هذا الخادم — محدّثة تلقائياً.</p>
          </div>
          <button type="button" onClick={() => void refresh()} className="btn-ghost !py-1.5 !text-[0.7rem]">
            <UiIcon name="refresh" className="h-3.5 w-3.5" />
            تحديث
          </button>
        </div>

        {jobs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-[0.78rem] text-mist/45">
            لا توجد عمليات بعد — ابدأ بلصق رابط أو جرّب الملف التجريبي.
          </p>
        ) : (
          <ul className="space-y-2">
            {jobs.slice(0, 6).map((item) => (
              <ActivityRow key={item.id} job={item} mounted={mounted} onSampleRetry={() => void submit({ sample: true })} />
            ))}
          </ul>
        )}
      </section>
      </Reveal>
    </div>
  );
}
