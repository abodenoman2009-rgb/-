"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
};

const COLORS = ["53,230,194", "139,124,255", "255,122,156", "127,243,220"];

export function AuroraBackground({ density = 44 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let particles: Particle[] = [];
    const pointer = { x: -999, y: -999 };

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = width < 640 ? Math.round(density * 0.55) : density;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.7,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      }));
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${particle.color},0.65)`;
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i]!;
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(120,200,230,${(1 - distance / 130) * 0.14})`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const particle of particles) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 150 && distance > 0.5) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(53,230,194,${(1 - distance / 150) * 0.3})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }

      frame = window.requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    const onPointerLeave = () => {
      pointer.x = -999;
      pointer.y = -999;
    };
    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
      } else if (!reduced) {
        frame = window.requestAnimationFrame(render);
      }
    };

    build();
    if (reduced) {
      ctx.clearRect(0, 0, width, height);
      for (const particle of particles) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${particle.color},0.5)`;
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      frame = window.requestAnimationFrame(render);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);
    }

    window.addEventListener("resize", build);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return (
    <>
      <div className="grid-overlay" aria-hidden="true" />
      <div
        className="aurora animate-drift"
        aria-hidden="true"
        style={{
          top: "-14rem",
          insetInlineEnd: "-8rem",
          width: "34rem",
          height: "34rem",
          background: "radial-gradient(circle, rgba(53,230,194,0.34), transparent 68%)",
        }}
      />
      <div
        className="aurora"
        aria-hidden="true"
        style={{
          top: "16rem",
          insetInlineStart: "-12rem",
          width: "38rem",
          height: "38rem",
          background: "radial-gradient(circle, rgba(139,124,255,0.28), transparent 70%)",
          animation: "drift 24s ease-in-out infinite reverse",
        }}
      />
      <div
        className="aurora"
        aria-hidden="true"
        style={{
          bottom: "-16rem",
          insetInlineStart: "30%",
          width: "30rem",
          height: "30rem",
          background: "radial-gradient(circle, rgba(255,122,156,0.2), transparent 70%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: -10 }}
        aria-hidden="true"
      />
    </>
  );
}
