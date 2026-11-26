"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------ preferences ------------------------------- */

const REDUCE_KEY = "abd-reduce-motion";

type MotionContextValue = {
  reduced: boolean;
  toggle: () => void;
};

const MotionContext = createContext<MotionContextValue>({ reduced: false, toggle: () => {} });

export function useMotionPrefs() {
  return useContext(MotionContext);
}

export function MotionRoot({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(REDUCE_KEY);
    } catch {
      stored = null;
    }
    const system = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = stored === null ? system : stored === "1";
    setReduced(next);
    root.classList.toggle("reduce-motion", next);
  }, []);

  const toggle = useCallback(() => {
    setReduced((current) => {
      const next = !current;
      document.documentElement.classList.toggle("reduce-motion", next);
      try {
        window.localStorage.setItem(REDUCE_KEY, next ? "1" : "0");
      } catch {
        /* storage may be blocked */
      }
      return next;
    });
  }, []);

  // Pause decorative animations while the tab is in the background (battery).
  useEffect(() => {
    const root = document.documentElement;
    const onVisibility = () => root.classList.toggle("motion-paused", document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const value = useMemo(() => ({ reduced, toggle }), [reduced, toggle]);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function MotionToggle({ className = "" }: { className?: string }) {
  const { reduced, toggle } = useMotionPrefs();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={reduced}
      title={reduced ? "تشغيل الحركات" : "تقليل الحركة"}
      className={`group grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-mist/70 transition hover:border-mint/40 hover:text-white ${className}`}
    >
      <span className="sr-only">{reduced ? "تشغيل الحركات" : "تقليل الحركة"}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4" aria-hidden="true">
        {reduced ? (
          <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M8.4 12h7.2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M12 3.4v3M12 17.6v3M3.4 12h3M17.6 12h3M6 6l2.1 2.1M15.9 15.9 18 18M18 6l-2.1 2.1M8.1 15.9 6 18" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3.4" />
          </>
        )}
      </svg>
    </button>
  );
}

/* --------------------------------- splash --------------------------------- */

const SPLASH_KEY = "abd-splash-seen-v2";

export function SplashGate() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const close = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 520);
    document.body.style.removeProperty("overflow");
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SPLASH_KEY) === "1";
      window.sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      seen = false;
    }
    if (seen) return;

    setMounted(true);
    setVisible(true);
    document.body.style.setProperty("overflow", "hidden");

    const reduced = document.documentElement.classList.contains("reduce-motion");
    const timer = window.setTimeout(close, reduced ? 900 : 2500);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      document.body.style.removeProperty("overflow");
    };
  }, [close]);

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center overflow-hidden bg-[#030617] transition-opacity duration-500"
      style={{ opacity: leaving ? 0 : 1 }}
      onClick={close}
      role="dialog"
      aria-label="شاشة البداية"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(62,242,255,0.24), transparent 62%)" }}
        />
        <div className="grid-overlay" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="splash-logo relative">
          <div className="halo absolute inset-0 rounded-[30px]" />
          <div
            className="relative grid h-28 w-28 place-items-center rounded-[30px] border border-white/20"
            style={{
              background: "linear-gradient(150deg, #3ef2ff, #7c9dff 46%, #9c8bff)",
              boxShadow:
                "0 26px 70px -24px rgba(62,242,255,0.8), inset 0 1px 0 rgba(255,255,255,0.75)",
              transform: "perspective(600px) rotateX(10deg)",
            }}
          >
            <svg viewBox="0 0 64 64" className="h-16 w-16 text-[#04121a]" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 40h24a10 10 0 0 0 1.6-19.9A14 14 0 0 0 19.2 24 8 8 0 0 0 20 40Z" />
              <g className="splash-arrow">
                <path d="M32 30v14" />
                <path d="m26 38.5 6 6 6-6" />
              </g>
            </svg>
          </div>
        </div>

        <div className="splash-rise mt-8" style={{ animationDelay: "320ms" }}>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.42em] text-mint/70">welcome to</p>
          <h1 className="mt-2 text-[clamp(1.9rem,6vw,3rem)] font-extrabold tracking-tight text-white">
            حمل <span className="text-gradient">معاء عبود</span>
          </h1>
        </div>

        <div className="splash-rise splash-bar mt-7 h-[3px] w-52 overflow-hidden rounded-full bg-white/10" style={{ animationDelay: "520ms" }}>
          <span className="block h-full w-full rounded-full bg-gradient-to-r from-mint via-iris to-coral" />
        </div>

        <p className="splash-rise mt-4 text-[0.72rem] text-mist/45" style={{ animationDelay: "640ms" }}>
          نُجهّز تجربة التحميل ثلاثية الأبعاد…
        </p>

        <button
          type="button"
          onClick={close}
          className="mt-8 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[0.68rem] font-semibold text-mist/60 transition hover:border-mint/40 hover:text-white"
        >
          تخطّي المقدمة
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ page transition --------------------------- */

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(1);
    const done = window.setTimeout(() => setProgress(0), 420);
    return () => window.clearTimeout(done);
  }, [pathname]);

  return (
    <>
      <div
        className="top-progress"
        style={{ transform: `scaleX(${progress})`, opacity: progress ? 1 : 0 }}
        aria-hidden="true"
      />
      <div key={pathname} className="page-enter">
        {children}
      </div>
    </>
  );
}

/* --------------------------------- reveal --------------------------------- */

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (document.documentElement.classList.contains("reduce-motion")) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------- tilt ---------------------------------- */

export function Tilt({
  children,
  className = "",
  intensity = 7,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        node.style.setProperty("--ry", `${px * intensity * 2}deg`);
        node.style.setProperty("--rx", `${-py * intensity * 2}deg`);
        frame = 0;
      });
    };
    const reset = () => {
      node.style.setProperty("--ry", "0deg");
      node.style.setProperty("--rx", "0deg");
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", reset);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", reset);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [intensity]);

  return (
    <div ref={ref} className={`tilt-card ${className}`}>
      {children}
    </div>
  );
}

/* --------------------------------- press 3D -------------------------------- */

export function PressRipple({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}
    >
      <span className="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(120% 120% at 50% 120%, rgba(255,255,255,0.22), transparent 60%)" }} />
    </span>
  );
}
