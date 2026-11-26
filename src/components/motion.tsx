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

const SPLASH_MS = 3000;
const SPLASH_FADE_MS = 500;

/** Full-screen image splash: shown once per session for 3 s, fades in and out. */
export function SplashGate() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SPLASH_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) {
      setPhase("gone");
      return;
    }
    document.documentElement.classList.add("splash-active");
    const out = window.setTimeout(() => setPhase("out"), SPLASH_MS - SPLASH_FADE_MS);
    const end = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(SPLASH_KEY, "1");
      } catch {}
      setPhase("gone");
      document.documentElement.classList.remove("splash-active");
    }, SPLASH_MS);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(end);
      document.documentElement.classList.remove("splash-active");
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      id="abd-splash"
      aria-hidden="true"
      className={`abd-splash${phase === "out" ? " abd-splash-out" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="abd-splash-blur" src="/splash.png" alt="" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="abd-splash-img" src="/splash.png" alt="" decoding="async" fetchPriority="high" />
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
