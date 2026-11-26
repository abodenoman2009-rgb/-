"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuroraBackground } from "@/components/aurora-background";
import { BrandIcon, Logo, UiIcon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { MotionToggle } from "@/components/motion";
import { FEATURED_PLATFORMS } from "@/lib/platforms";

export default function WelcomePage() {
  const router = useRouter();
  const [progress, setProgress] = useState(8);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let returning = false;
    try {
      returning = window.sessionStorage.getItem("abd-welcomed") === "1";
      window.sessionStorage.setItem("abd-welcomed", "1");
    } catch {
      returning = false;
    }

    router.prefetch("/downloader");
    const delay = returning ? 500 : 2100;
    const grow = window.setTimeout(() => setProgress(100), 120);
    const jump = window.setTimeout(() => router.replace("/downloader"), delay);

    return () => {
      window.clearTimeout(grow);
      window.clearTimeout(jump);
    };
  }, [router]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <AuroraBackground density={38} />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="neon-orb h-72 w-72" style={{ top: "8%", insetInlineEnd: "6%", background: "rgba(62,242,255,0.3)" }} />
        <div
          className="neon-orb h-80 w-80"
          style={{ bottom: "-4rem", insetInlineStart: "2%", background: "rgba(139,124,255,0.28)", animationDelay: "1.6s" }}
        />
      </div>

      <div className="absolute inset-x-0 top-4 z-20">
        <div className="page-shell flex items-center justify-between">
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.35em] text-mist/35">abd · 3d</span>
          <MotionToggle />
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className="splash-logo relative mb-4">
          <span className="halo absolute inset-[-22%] rounded-[30px]" aria-hidden="true" />
          <Logo size={72} />
        </div>

        <span className="chip floaty-fast mb-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
          </span>
          تجربة ثلاثية الأبعاد · أسرع من ثانيتين
        </span>

        <h1 className="animate-rise text-[clamp(2rem,6.4vw,3.4rem)] font-extrabold leading-[1.15] tracking-tight text-white">
          حمل <span className="text-gradient">معاء عبود</span>
        </h1>
        <p
          className="animate-rise mt-2.5 max-w-sm text-[0.85rem] leading-7 text-mist/65 sm:text-base"
          style={{ animationDelay: "80ms" }}
        >
          عبود جاهز ليستقبل رابطك — الصقه في الحقل، والملف يصل إلى جهازك مباشرةً.
        </p>

        {/* 3D presenter + real input preview */}
        <div className="relative mt-5 flex w-full max-w-md items-end justify-center gap-1">
          <div className="relative hidden w-[132px] shrink-0 sm:block">
            <Mascot variant="present" interactive={false} className="floaty-slow" />
          </div>

          <div className="scene-3d flex-1">
            <div
              className="glass neon-frame relative rounded-2xl p-3 text-start"
              style={{ transform: "perspective(900px) rotateX(4deg)" }}
            >
              <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-black/45 px-3 py-2.5">
                <UiIcon name="link" className="h-4 w-4 shrink-0 text-mint/80" />
                <span className="flex-1 truncate font-mono text-[0.72rem] text-mist/40" dir="ltr">
                  https://tiktok.com/@abd/video/…
                </span>
                <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[0.55rem] text-mist/45">
                  MP4
                </span>
              </div>
              <div className="glow-button mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-mint to-iris py-2 text-[0.78rem] font-extrabold text-[#03130f]">
                <UiIcon name="download" className="h-3.5 w-3.5" strokeWidth={2.4} />
                سحب الفيديو
              </div>
            </div>
          </div>
        </div>

        <div className="animate-rise mt-5 w-full max-w-sm" style={{ animationDelay: "160ms" }}>
          <div className="progress-track">
            <div
              className="progress-fill transition-[width] duration-[1900ms] ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[0.68rem] font-semibold text-mist/55">
            <span className="inline-flex items-center gap-1.5">
              <UiIcon name="refresh" className="h-3.5 w-3.5 animate-spin" />
              نُجهّز مساحة التحميل…
            </span>
            <span className="font-mono tracking-wider text-mint/70">FAST START</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2" style={{ animationDelay: "220ms" }}>
          {FEATURED_PLATFORMS.slice(0, 6).map((platform, index) => (
            <span
              key={platform.id}
              className="floating-icon grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.05]"
              style={{ color: platform.accent, animationDelay: `${index * 0.5}s` }}
              title={platform.nameAr}
            >
              <BrandIcon platform={platform.id} className="h-4 w-4" />
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link href="/downloader" className="btn-primary press-3d glow-button animate-rise !rounded-xl !px-5 !py-2.5 !text-sm">
            <UiIcon name="download" className="h-4 w-4" strokeWidth={2.2} />
            الدخول مباشرة
          </Link>
          <Link href="/downloader#how" className="btn-ghost press-3d !rounded-xl !px-4 !py-2.5 !text-sm">
            <UiIcon name="sparkle" className="h-4 w-4" />
            كيف يعمل؟
          </Link>
        </div>

        <p className="mt-5 text-[0.68rem] leading-6 text-mist/35">
          بدون تسجيل · لا نحتفظ بملفاتك · للفيديوهات العامة فقط
        </p>
      </div>
    </main>
  );
}
