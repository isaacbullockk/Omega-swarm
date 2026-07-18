import { useEffect, useRef } from "react";

interface Orb {
  x: number;
  y: number;
  baseX: number;
  size: number;
  color: string;
  opacity: number;
  speed: number;
  amplitude: number;
  period: number;
  phase: number;
}

export default function SavannahBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let orbs: Orb[] = [];

    const WARM_COLORS = ["#F59E0B", "#F97316", "#EAB308"];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createOrbs() {
      orbs = [];
      const count = 45;
      const width = canvas?.width ?? window.innerWidth;
      const height = canvas?.height ?? window.innerHeight;

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        orbs.push({
          x,
          y,
          baseX: x,
          size: 6 + Math.random() * 18,
          color: WARM_COLORS[Math.floor(Math.random() * WARM_COLORS.length)],
          opacity: 0.06 + Math.random() * 0.09,
          speed: 0.15 + Math.random() * 0.45,
          amplitude: 30 + Math.random() * 30,
          period: 3000 + Math.random() * 3000,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function animate(timestamp: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const orb of orbs) {
        // Upward drift
        orb.y -= orb.speed;
        if (orb.y < -orb.size) {
          orb.y = canvas.height + orb.size;
          orb.baseX = Math.random() * canvas.width;
        }

        // Horizontal sine wave
        const sineOffset =
          Math.sin((timestamp / orb.period) * Math.PI * 2 + orb.phase) *
          orb.amplitude;
        orb.x = orb.baseX + sineOffset;

        // Draw orb
        ctx.save();
        ctx.globalAlpha = orb.opacity;
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    }

    resize();
    createOrbs();
    animationId = requestAnimationFrame(animate);

    window.addEventListener("resize", () => {
      resize();
      createOrbs();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        filter: "blur(50px)",
      }}
    />
  );
}
