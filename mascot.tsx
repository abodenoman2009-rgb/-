"use client";

import { useEffect, useRef } from "react";

type Variant = "hello" | "present" | "login" | "compact";

const GRADIENTS: Record<string, { shell: string; shellEnd: string; body: string; bodyEnd: string }> = {
  hello: {
    shell: "#eaf7ff",
    shellEnd: "#9fc6e8",
    body: "#3ef2ff",
    bodyEnd: "#8b7cff",
  },
  present: {
    shell: "#e8fbff",
    shellEnd: "#9ad8e8",
    body: "#5ef0d6",
    bodyEnd: "#7c9dff",
  },
  login: {
    shell: "#e6eeff",
    shellEnd: "#9aa9e8",
    body: "#8b7cff",
    bodyEnd: "#3ef2ff",
  },
  compact: {
    shell: "#e8fbff",
    shellEnd: "#9fc6e8",
    body: "#3ef2ff",
    bodyEnd: "#8b7cff",
  },
};

/**
 * «عبود» — the 3D-ish guide character. Rendered as an SVG rig with layered
 * highlights and CSS-animated arms, head and visor so it costs almost nothing
 * compared with a WebGL scene, while still reacting to the pointer in 3D.
 */
export function Mascot({
  variant = "hello",
  className = "",
  speech,
  interactive = true,
  hideOnMobile = false,
}: {
  variant?: Variant;
  className?: string;
  speech?: string;
  interactive?: boolean;
  hideOnMobile?: boolean;
}) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const colors = GRADIENTS[variant] ?? GRADIENTS.hello!;
  const waving = variant === "hello" || variant === "login";

  useEffect(() => {
    const node = sceneRef.current;
    if (!node || !interactive) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (document.documentElement.classList.contains("reduce-motion")) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        node.style.transform = `perspective(900px) rotateY(${px * 16}deg) rotateX(${-py * 12}deg)`;
        frame = 0;
      });
    };
    const reset = () => {
      node.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    };
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", reset);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", reset);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [interactive]);

  return (
    <div className={`mascot-scene relative ${hideOnMobile ? "hidden sm:block" : ""} ${className}`}>
      {speech ? (
        <div className="absolute -top-2 inset-inline-start-1/2 z-20 -translate-x-1/2 rtl:translate-x-1/2 whitespace-nowrap">
          <div className="relative rounded-2xl border border-mint/30 bg-[#061420]/90 px-3 py-1.5 text-[0.7rem] font-bold text-mint shadow-[0_14px_30px_-16px_rgba(62,242,255,0.8)] backdrop-blur">
            {speech}
            <span className="absolute -bottom-1 inset-inline-start-6 h-2 w-2 rotate-45 border-b border-e border-mint/30 bg-[#061420]" />
          </div>
        </div>
      ) : null}

      <div className="mascot-glow absolute inset-[-18%] rounded-full" aria-hidden="true" />

      <div ref={sceneRef} className="scene-layer relative transition-transform duration-300 ease-out">
        <svg
          viewBox="0 0 220 250"
          className="mascot h-auto w-full drop-shadow-[0_28px_40px_rgba(3,10,25,0.65)]"
          role="img"
          aria-label="عبود — شخصية الموقع ثلاثية الأبعاد"
        >
          <defs>
            <linearGradient id={`shell-${variant}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={colors.shell} />
              <stop offset="100%" stopColor={colors.shellEnd} />
            </linearGradient>
            <linearGradient id={`body-${variant}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={colors.body} />
              <stop offset="100%" stopColor={colors.bodyEnd} />
            </linearGradient>
            <linearGradient id={`visor-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1a2b" />
              <stop offset="100%" stopColor="#020913" />
            </linearGradient>
            <radialGradient id={`eye-${variant}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#8ffcff" />
              <stop offset="100%" stopColor="#25d3f5" />
            </radialGradient>
          </defs>

          {/* shadow pedestal */}
          <ellipse cx="110" cy="236" rx="58" ry="10" fill="rgba(62,242,255,0.16)" className="mascot-halo" />

          {/* antenna */}
          <g className="mascot-head">
            <line x1="110" y1="26" x2="110" y2="42" stroke={colors.shellEnd} strokeWidth="4" strokeLinecap="round" />
            <circle cx="110" cy="22" r="6" fill="#3ef2ff">
              <animate attributeName="opacity" values="1;0.35;1" dur="2.6s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* head */}
          <g className="mascot-head">
            <rect x="50" y="38" width="120" height="96" rx="34" fill={`url(#shell-${variant})`} />
            <rect x="50" y="38" width="120" height="96" rx="34" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
            <rect x="63" y="52" width="94" height="60" rx="24" fill={`url(#visor-${variant})`} />
            <rect className="mascot-visor" x="66" y="55" width="88" height="20" rx="12" fill="rgba(150,240,255,0.16)" />
            <g className="mascot-eyes">
              <ellipse cx="90" cy="82" rx="9" ry="10" fill={`url(#eye-${variant})`} />
              <ellipse cx="130" cy="82" rx="9" ry="10" fill={`url(#eye-${variant})`} />
              <circle cx="93" cy="78" r="3" fill="#ffffff" opacity="0.9" />
              <circle cx="133" cy="78" r="3" fill="#ffffff" opacity="0.9" />
            </g>
            <path d="M100 100q10 7 20 0" stroke="rgba(143,252,255,0.85)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <circle cx="78" cy="100" r="3.4" fill="rgba(255,122,156,0.45)" />
            <circle cx="142" cy="100" r="3.4" fill="rgba(255,122,156,0.45)" />
          </g>

          {/* left arm */}
          <g className={waving ? "mascot-arm--left" : ""} style={{ transformOrigin: "72px 132px" }}>
            <rect x="34" y="124" width="22" height="58" rx="11" fill={`url(#body-${variant})`} opacity="0.95" />
            <circle cx="45" cy="186" r="13" fill={`url(#shell-${variant})`} stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" />
            <circle cx="45" cy="186" r="5" fill="rgba(62,242,255,0.7)" />
          </g>

          {/* right arm */}
          <g className={waving ? "mascot-arm--right" : ""} style={{ transformOrigin: "148px 132px" }}>
            <rect x="164" y="124" width="22" height="58" rx="11" fill={`url(#body-${variant})`} opacity="0.95" />
            <circle cx="175" cy="186" r="13" fill={`url(#shell-${variant})`} stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" />
            <circle cx="175" cy="186" r="5" fill="rgba(139,124,255,0.75)" />
          </g>

          {/* torso */}
          <g>
            <rect x="58" y="138" width="104" height="82" rx="30" fill={`url(#body-${variant})`} />
            <rect x="58" y="138" width="104" height="82" rx="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" />
            <rect x="76" y="156" width="68" height="48" rx="18" fill="rgba(4,14,24,0.55)" stroke="rgba(255,255,255,0.22)" />
            <g stroke="#eaffff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M110 164v16" />
              <path d="m103 174 7 7 7-7" />
              <path d="M100 187h20" />
            </g>
            <circle cx="66" cy="148" r="4" fill="rgba(255,255,255,0.65)" />
            <circle cx="154" cy="148" r="4" fill="rgba(255,255,255,0.65)" />
          </g>

          {/* hovering accent cubes */}
          <g className="floaty-fast" style={{ transformOrigin: "center" }}>
            <rect x="18" y="70" width="14" height="14" rx="4" fill="rgba(62,242,255,0.7)" transform="rotate(-18 25 77)" />
            <rect x="188" y="96" width="11" height="11" rx="3" fill="rgba(255,122,156,0.7)" transform="rotate(22 193 101)" />
          </g>
          <g className="floaty-slow">
            <circle cx="196" cy="58" r="4" fill="rgba(139,124,255,0.8)" />
            <circle cx="26" cy="120" r="3" fill="rgba(62,242,255,0.8)" />
          </g>
        </svg>
      </div>
    </div>
  );
}
