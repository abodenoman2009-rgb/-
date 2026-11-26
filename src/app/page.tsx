"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";


export default function WelcomePage() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [light, setLight] = useState(false);
  const [toast, setToast] = useState("");
  const pending = useRef<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const [label, setLabel] = useState("");

  useEffect(() => {
    router.prefetch("/downloader");
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  type Outcome = "shared" | "cancelled" | "blocked" | "saved";

  async function deliver(file: File): Promise<Outcome> {
    const nav = navigator as Navigator & {
      canShare?: (d: ShareData) => boolean;
      share?: (d: ShareData) => Promise<void>;
    };
    const isIOS =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isMobile = isIOS || /Android/i.test(navigator.userAgent);
    if (isMobile && nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file] });
        return "shared";
      } catch (c) {
        const n = c instanceof DOMException ? c.name : "";
        if (n === "AbortError") return "cancelled";
        // Safari only opens the share sheet inside a tap; keep the file for the next tap
        // instead of falling back to Safari's own download prompt.
        if (n === "NotAllowedError" && isIOS) return "blocked";
      }
    }
    const blobUrl = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = file.name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return "saved";
  }

  async function finish(file: File) {
    const outcome = await deliver(file);
    if (outcome === "blocked") {
      pending.current = file;
      setToast("الفيديو جاهز — اضغط «سحب الفيديو» مرة أخرى لفتح نافذة المشاركة");
    } else {
      pending.current = outcome === "cancelled" ? file : null;
      setToast(outcome === "cancelled" ? "تم إغلاق نافذة المشاركة — اضغط مرة أخرى لإعادة فتحها" : "تم تحميل الفيديو بنجاح ✓");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    // File already prepared: open the share sheet right away, inside this tap.
    if (pending.current) {
      void finish(pending.current);
      return;
    }
    const v = (input.current?.value ?? "").trim();
    try {
      const u = new URL(v);
      if (!/^https?:$/.test(u.protocol)) throw new Error("protocol");
    } catch {
      setToast("الصق رابط فيديو صحيح أولاً");
      return;
    }
    setBusy(true);
    setPercent(0);
    setLabel("جارٍ التجهيز…");
    try {
      const r = await fetch("/api/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: v, format: "mp4" }),
      });
      const data = (await r.json().catch(() => null)) as {
        ok?: boolean;
        job?: { id: string; fileName?: string | null; mimeType?: string | null };
        error?: { message?: string };
      } | null;
      if (!data?.ok || !data.job) {
        throw new Error(data?.error?.message ?? "تعذّر تنفيذ الطلب. أعد المحاولة.");
      }
      const res = await fetch(`/api/download/${data.job.id}`, { cache: "no-store" });
      if (!res.ok || !res.body) {
        const d = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(d?.error ?? "تعذّر تجهيز الفيديو. أعد المحاولة.");
      }
      const total = Number(res.headers.get("content-length") ?? "0");
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let got = 0;
      setLabel("جارٍ التحميل…");
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          got += value.byteLength;
          if (total > 0) setPercent(Math.min(99, Math.round((got / total) * 100)));
        }
      }
      if (got === 0 || (total > 0 && got < total)) throw new Error("انقطع التحميل قبل اكتمال الفيديو. أعد المحاولة.");
      let name = data.job.fileName ?? "abd-video.mp4";
      const hn = res.headers.get("x-file-name");
      if (hn) {
        try {
          name = decodeURIComponent(hn);
        } catch {}
      }
      const type = res.headers.get("content-type")?.split(";")[0] || data.job.mimeType || "video/mp4";
      const file = new File(chunks as BlobPart[], name, { type });
      setPercent(100);
      await finish(file);
    } catch (err) {
      setToast(err instanceof Error && err.message ? err.message : "حدث خطأ أثناء التحميل. أعد المحاولة.");
    } finally {
      setBusy(false);
      setPercent(0);
    }
  }

  return (
    <main className={`lg lg-app-wrap${light ? " light" : ""}`}>
      <div className="lg-app">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lg-hero" src="/login/hero.jpg" alt="" />
        <button type="button" className="lg-theme lg-glass" aria-label="تبديل المظهر" onClick={() => setLight((v) => !v)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
        </button>

        <div className="lg-sig lg-glass" aria-label="توقيع عبود">عبود</div>
        <h1>حمل <span>الفيديو</span> ياعبود</h1>
        <p className="sub">عبود جاهز ليستقبل رابطك – الصقه في الحقل،<br />والملف يصل إلى جهازك مباشرة.</p>

        <form className="lg-card lg-glass" onSubmit={submit} noValidate>
          <label className="lg-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>
            <input ref={input} onChange={() => { pending.current = null; }} type="url" inputMode="url" autoComplete="off" placeholder="https://tiktok.com/@abd/video/..." />
            <span className="lg-fmt">MP4</span>
          </label>
          <button className="lg-go" type="submit" disabled={busy} aria-busy={busy} style={busy ? { position: "relative", overflow: "hidden", opacity: 1 } : undefined}>
            {busy && <span aria-hidden style={{ position: "absolute", insetBlock: 0, insetInlineStart: 0, width: `${percent}%`, background: "rgba(169,92,255,.35)", transition: "width .3s" }} />}
            {busy ? (
              <span style={{ position: "relative" }}>{label} {percent > 0 ? `${percent}%` : ""}</span>
            ) : (<>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11m-5-4 5 5 5-5M5 20h14" /></svg>
            سحب الفيديو
            </>)}
          </button>
        </form>

        <div className="lg-or">أو مشاركة معنا</div>
        <nav className="lg-soc">
      <a className="lg-glass" href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><svg viewBox="0 0 24 24"><path fill="#25f4ee" d="M16.5 3.5c.3 2.4 1.7 3.9 4 4.1v3a7 7 0 0 1-4-1.3v6.2a5.6 5.6 0 1 1-5.6-5.6h.6v3.1a2.6 2.6 0 1 0 2 2.5V3.5z" transform="translate(-.7 .5)"/><path fill="#fe2c55" d="M16.5 3.5c.3 2.4 1.7 3.9 4 4.1v3a7 7 0 0 1-4-1.3v6.2a5.6 5.6 0 1 1-5.6-5.6h.6v3.1a2.6 2.6 0 1 0 2 2.5V3.5z" transform="translate(.7 -.3)"/><path fill="#fff" d="M16.5 3.5c.3 2.4 1.7 3.9 4 4.1v3a7 7 0 0 1-4-1.3v6.2a5.6 5.6 0 1 1-5.6-5.6h.6v3.1a2.6 2.6 0 1 0 2 2.5V3.5z"/></svg></a>
      <a className="lg-glass" href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none"><defs><linearGradient id="lg-ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#feda75"/><stop offset=".4" stopColor="#fa7e1e"/><stop offset=".65" stopColor="#d62976"/><stop offset="1" stopColor="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#lg-ig)"/><rect x="6" y="6" width="12" height="12" rx="4" stroke="#fff" strokeWidth="1.8"/><circle cx="12" cy="12" r="2.8" stroke="#fff" strokeWidth="1.8"/><circle cx="16.3" cy="7.7" r="1" fill="#fff"/></svg></a>
      <a className="lg-glass" href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24"><rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#f00"/><path d="M10 9v6l5.2-3z" fill="#fff"/></svg></a>
      <a className="lg-glass" href="https://www.snapchat.com" target="_blank" rel="noopener noreferrer" aria-label="Snapchat"><svg viewBox="0 0 24 24"><rect x="0" y="0" width="24" height="24" rx="12" fill="#fffc00"/><path fill="#fff" stroke="#111" strokeWidth="1" d="M12 4.5c2.3 0 3.6 1.7 3.6 3.8v1.6c.4.3 1.3.3 1.6.5.3.3-.5.8-1 1 .5 1 1.3 1.8 2.3 2.2.2.4-1 .7-1.5.9-.1.4-.1.8-.5.8-.6 0-1.4-.3-2.1.1-.8.5-1.3 1.2-2.4 1.2s-1.6-.7-2.4-1.2c-.7-.4-1.5-.1-2.1-.1-.4 0-.4-.4-.5-.8-.5-.2-1.7-.5-1.5-.9 1-.4 1.8-1.2 2.3-2.2-.5-.2-1.3-.7-1-1 .3-.2 1.2-.2 1.6-.5V8.3c0-2.1 1.3-3.8 3.6-3.8z"/></svg></a>
      <a className="lg-glass" href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1877f2"/><path fill="#fff" d="M13.2 21v-7h2.4l.4-2.8h-2.8v-1.7c0-.8.2-1.4 1.4-1.4H16V5.6c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2.1H8V14h2.4v7z"/></svg></a>
      <a className="lg-glass" href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X"><svg viewBox="0 0 24 24"><path fill="#fff" d="M17.8 3h3l-6.6 7.5L22 21h-6.1l-4.8-6.2L5.6 21h-3l7-8L2.2 3h6.2l4.3 5.7zm-1.1 16.2h1.7L7.4 4.7H5.6z"/></svg></a>
        </nav>

        <div className="lg-row">
          <button type="button" className="lg-btn lg-main" onClick={() => router.push("/downloader")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" /></svg>
            الدخول مباشرة
          </button>
          <button type="button" className="lg-btn" onClick={() => router.push("/downloader#how")}>
            <svg viewBox="0 0 24 24" fill="#d9b8ff"><path d="M9 3l1.6 4.4L15 9l-4.4 1.6L9 15l-1.6-4.4L3 9l4.4-1.6zM17 11l1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1zM17.5 3l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></svg>
            كيف يعمل؟
          </button>
        </div>
        <div className="lg-foot"><span>معاً عبود .. <b>دائماً الأفضل</b> <span style={{ color: "#a95cff" }}>♥</span></span></div>
      </div>

      <div className={`lg-toast lg-glass${toast ? " show" : ""}`} role="status">{toast}</div>
    </main>
  );
}
