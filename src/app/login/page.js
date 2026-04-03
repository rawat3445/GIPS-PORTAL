"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

/* ─── Portal feature cards ─────────────────────────────────────────── */
const portalHighlights = [
  {
    title: "Student Access",
    text: "Attendance, updates, and academic records in one place.",
    icon: Users,
    accent: "#f59e0b",
  },
  {
    title: "Faculty Tools",
    text: "Mark attendance, review students, and manage course flow.",
    icon: BookOpen,
    accent: "#34d399",
  },
  {
    title: "Secure Admin Control",
    text: "Protected sign-in for operations, reports, and dashboards.",
    icon: ShieldCheck,
    accent: "#60a5fa",
  },
];

/* ─── Planet facts ─────────────────────────────────────────────────── */
const PLANETS = [
  {
    name: "Mercury",
    radius: 110,
    rings: 4,
    color: "#4a9eff",
    glowColor: "rgba(74,158,255,0.15)",
    fact: "Smallest planet · 88-day orbit",
    moons: 0,
    initialX: -190,
    initialY: -118,
    delay: 0,
    duration: 38,
    scale: 0.9,
    gridLines: 7,
    labels: ["Caloris Basin", "Mantle", "Iron Core"],
  },
  {
    name: "Saturn",
    radius: 170,
    rings: 7,
    color: "#3d8fe0",
    glowColor: "rgba(61,143,224,0.18)",
    fact: "Density less than water · 146 moons",
    moons: 6,
    initialX: 205,
    initialY: -138,
    delay: 4,
    duration: 52,
    scale: 1.15,
    gridLines: 9,
    labels: ["Ring System", "Atmosphere", "Rocky Core"],
    hasRingSystem: true,
  },
  {
    name: "Neptune",
    radius: 130,
    rings: 5,
    color: "#2563eb",
    glowColor: "rgba(37,99,235,0.15)",
    fact: "Strongest winds in solar system · −214°C",
    moons: 3,
    initialX: 148,
    initialY: 138,
    delay: 8,
    duration: 44,
    scale: 1.0,
    gridLines: 8,
    labels: ["Triton orbit", "Methane layer", "Ice mantle"],
  },
  {
    name: "Jupiter",
    radius: 200,
    rings: 8,
    color: "#1e40af",
    glowColor: "rgba(30,64,175,0.2)",
    fact: "Largest planet · 1321× Earth's volume",
    moons: 8,
    initialX: -228,
    initialY: 158,
    delay: 12,
    duration: 60,
    scale: 1.3,
    gridLines: 10,
    labels: ["Great Red Spot", "Cloud bands", "Metallic H₂"],
    hasBands: true,
  },
];

/* ─── Blueprint Planet Canvas ──────────────────────────────────────── */
function BlueprintPlanets() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    planets: [],
    raf: null,
    t: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.width;
    const H = () => canvas.height;

    const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
    const easeInOutCubic = (value) =>
      value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
    const TRAVEL_DURATION = 320;
    const HOLD_DURATION = 110;
    const FADE_DURATION = 105;
    const GAP_DURATION = 18;
    const PLANET_CYCLE =
      TRAVEL_DURATION + HOLD_DURATION + FADE_DURATION + GAP_DURATION;
    const pseudoRandom = (seed) => {
      const raw = Math.sin(seed * 12.9898) * 43758.5453;
      return raw - Math.floor(raw);
    };
    const lerp = (start, end, progress) => start + (end - start) * progress;
    const getSpawnPoint = (sequenceIndex, planet) => {
      const sideRoll = Math.floor(pseudoRandom(sequenceIndex + 0.37) * 4);
      const laneX = 0.16 + pseudoRandom(sequenceIndex + 1.73) * 0.68;
      const laneY = 0.16 + pseudoRandom(sequenceIndex + 2.41) * 0.68;
      const margin = planet.radius * 1.7 + 110;

      switch (sideRoll) {
        case 0:
          return { x: W() * laneX, y: -margin };
        case 1:
          return { x: W() + margin, y: H() * laneY };
        case 2:
          return { x: W() * laneX, y: H() + margin };
        default:
          return { x: -margin, y: H() * laneY };
      }
    };

    /* Build planet state */
    const planets = PLANETS.map((p, index) => ({
      ...p,
      cx: W() * 0.5,
      cy: H() * 0.5,
      phase: index * Math.PI * 0.72,
      introProgress: 0, // 0→1
      sequenceIndex: index,
    }));

    stateRef.current.planets = planets;

    const drawBlueprintPlanet = (planet, progress, opacityFactor = 1) => {
      if (progress <= 0) return;

      const {
        cx,
        cy,
        radius: R,
        color,
        glowColor,
        fact,
        name,
        gridLines,
        labels,
        hasRingSystem,
        hasBands,
        moons,
        scale: planetScale = 1,
      } = planet;
      const alpha = Math.min(progress * 2, 1) * opacityFactor;
      const scale =
        (0.24 + progress * 0.76) * (0.92 + (planetScale - 1) * 0.28);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      /* ── Glow halo ── */
      const grd = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 2.2);
      grd.addColorStop(0, glowColor.replace("0.15", String(0.22 * alpha)));
      grd.addColorStop(0.5, glowColor.replace("0.15", String(0.08 * alpha)));
      grd.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(0, 0, R * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      /* ── Blueprint circle grid lines (latitude/longitude) ── */
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.55;
      ctx.globalAlpha = alpha * 0.52;
      ctx.setLineDash([3, 5]);

      // Latitude lines
      for (let i = 1; i < gridLines; i++) {
        const lat = (i / gridLines) * Math.PI - Math.PI / 2;
        const ry = Math.sin(lat) * R;
        const rx = Math.cos(lat) * R;
        ctx.beginPath();
        ctx.ellipse(0, ry, rx, rx * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Longitude lines
      for (let i = 0; i < gridLines; i++) {
        const angle = (i / gridLines) * Math.PI;
        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          Math.abs(Math.cos(angle)) * R * 0.18 + 1,
          R,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }

      ctx.setLineDash([]);
      ctx.globalAlpha = alpha;

      /* ── Main circle ── */
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = alpha;
      ctx.stroke();

      /* ── Equator line ── */
      ctx.beginPath();
      ctx.ellipse(0, 0, R, R * 0.22, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = alpha * 0.82;
      ctx.stroke();

      /* ── Jupiter cloud bands ── */
      if (hasBands) {
        ctx.globalAlpha = alpha * 0.32;
        ctx.setLineDash([]);
        for (let b = -3; b <= 3; b++) {
          const by = (b / 4) * R * 0.85;
          const bw = Math.sqrt(Math.max(0, R * R - by * by));
          ctx.beginPath();
          ctx.ellipse(0, by, bw, bw * 0.12, 0, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
        ctx.globalAlpha = alpha;
      }

      /* ── Saturn ring system ── */
      if (hasRingSystem) {
        ctx.globalAlpha = alpha * 0.72;
        ctx.setLineDash([2, 4]);
        const ringWidths = [1.4, 1.6, 1.8, 2.0, 2.2, 2.5, 2.8];
        ringWidths.forEach((rw, i) => {
          const ro = R + 30 + i * 18;
          ctx.beginPath();
          ctx.ellipse(0, 0, ro, ro * 0.28, 0, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = rw * 0.5;
          ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.globalAlpha = alpha;
      }

      /* ── Moon orbits ── */
      if (moons > 0) {
        ctx.globalAlpha = alpha * 0.38;
        ctx.setLineDash([2, 6]);
        for (let m = 0; m < Math.min(moons, 4); m++) {
          const orbitR = R + 45 + m * 28;
          ctx.beginPath();
          ctx.arc(0, 0, orbitR, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.5;
          ctx.stroke();

          /* Moon dot */
          const moonAngle =
            stateRef.current.t * 0.008 * (1 + m * 0.3) + m * Math.PI * 0.7;
          ctx.globalAlpha = alpha * 0.72;
          ctx.beginPath();
          ctx.arc(
            Math.cos(moonAngle) * orbitR,
            Math.sin(moonAngle) * orbitR * 0.3,
            3 + m * 0.5,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = color;
          ctx.fill();
          ctx.globalAlpha = alpha * 0.38;
        }
        ctx.setLineDash([]);
      }

      /* ── Crosshair center marker ── */
      ctx.globalAlpha = alpha * 0.74;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(12, 0);
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 12);
      ctx.stroke();
      /* small circle at center */
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.stroke();

      /* ── Corner bracket decorations ── */
      ctx.globalAlpha = alpha * 0.62;
      ctx.lineWidth = 1;
      const bk = 14,
        gap = R + 18;
      const corners = [
        [-gap, -gap],
        [gap, -gap],
        [gap, gap],
        [-gap, gap],
      ];
      const dirs = [
        [1, 1],
        [-1, 1],
        [-1, -1],
        [1, -1],
      ];
      corners.forEach(([bx, by], i) => {
        const [dx, dy] = dirs[i];
        ctx.beginPath();
        ctx.moveTo(bx + dx * bk, by);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx, by + dy * bk);
        ctx.stroke();
      });

      /* ── Measurement tick lines ── */
      ctx.globalAlpha = alpha * 0.5;
      ctx.lineWidth = 0.6;
      for (let tick = 0; tick < 24; tick++) {
        const a = (tick / 24) * Math.PI * 2;
        const inner = tick % 6 === 0 ? R - 14 : tick % 3 === 0 ? R - 9 : R - 5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * (R + 2), Math.sin(a) * (R + 2));
        ctx.stroke();
      }

      /* ── Planet name label ── */
      ctx.globalAlpha = alpha * 0.8;
      ctx.font = "500 13px 'DM Sans', sans-serif";
      ctx.fillStyle = color;
      ctx.letterSpacing = "0.2em";
      ctx.fillText(name.toUpperCase(), -R * 0.45, R + 28);

      /* ── Fact ribbon ── */
      ctx.globalAlpha = alpha * 0.72;
      ctx.font = "400 10px 'DM Sans', sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(fact, -R * 0.9, R + 44);

      /* ── Leader lines with labels ── */
      if (labels && labels.length > 0 && progress > 0.6) {
        const labelAlpha = Math.min((progress - 0.6) / 0.4, 1);
        ctx.globalAlpha = alpha * labelAlpha * 0.82;
        labels.forEach((lbl, i) => {
          const ang = (-0.3 + i * 0.55) * Math.PI;
          const lx1 = Math.cos(ang) * (R * 0.6);
          const ly1 = Math.sin(ang) * (R * 0.6);
          const lx2 = Math.cos(ang) * (R + 36 + i * 8);
          const ly2 = Math.sin(ang) * (R + 36 + i * 8);
          const lx3 = lx2 + (Math.cos(ang) >= 0 ? 32 : -32);

          ctx.setLineDash([2, 4]);
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(lx1, ly1);
          ctx.lineTo(lx2, ly2);
          ctx.lineTo(lx3, ly2);
          ctx.stroke();
          ctx.setLineDash([]);

          /* dot at planet surface */
          ctx.beginPath();
          ctx.arc(lx1, ly1, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          ctx.font = "400 9px 'DM Sans', sans-serif";
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha * labelAlpha * 0.7;
          ctx.fillText(
            lbl,
            lx3 + (Math.cos(ang) >= 0 ? 4 : -(ctx.measureText(lbl).width + 4)),
            ly2 + 3.5,
          );
        });
      }

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, W(), H());

      /* Subtle blueprint grid on canvas */
      ctx.save();
      ctx.strokeStyle = "rgba(59,130,246,0.08)";
      ctx.lineWidth = 0.5;
      const gridSize = 52;
      for (let x = 0; x < W(); x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H());
        ctx.stroke();
      }
      for (let y = 0; y < H(); y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W(), y);
        ctx.stroke();
      }
      ctx.restore();

      const t = stateRef.current.t;
      stateRef.current.t++;
      const centerX = W() * 0.5;
      const centerY = H() * 0.5;
      const sequenceIndex = Math.floor(t / PLANET_CYCLE);
      const localFrame = t % PLANET_CYCLE;
      const activePlanet = planets[sequenceIndex % planets.length];
      const spawnPoint = getSpawnPoint(sequenceIndex, activePlanet);

      activePlanet.introProgress = 0;

      if (localFrame < TRAVEL_DURATION) {
        const moveProgress = easeInOutCubic(localFrame / TRAVEL_DURATION);
        const visualProgress = 0.38 + moveProgress * 0.62;
        const driftX =
          Math.sin(t * 0.012 + activePlanet.phase) *
          (8 + activePlanet.radius * 0.012);
        const driftY =
          Math.cos(t * 0.01 + activePlanet.phase * 1.2) *
          (6 + activePlanet.radius * 0.01);

        activePlanet.cx = lerp(spawnPoint.x, centerX, moveProgress) + driftX;
        activePlanet.cy = lerp(spawnPoint.y, centerY, moveProgress) + driftY;
        drawBlueprintPlanet(
          activePlanet,
          visualProgress,
          0.55 + moveProgress * 0.45,
        );
      } else if (localFrame < TRAVEL_DURATION + HOLD_DURATION) {
        activePlanet.cx =
          centerX + Math.sin(t * 0.007 + activePlanet.phase) * 4;
        activePlanet.cy =
          centerY + Math.cos(t * 0.006 + activePlanet.phase * 1.2) * 3;
        drawBlueprintPlanet(activePlanet, 1, 1);
      } else if (localFrame < TRAVEL_DURATION + HOLD_DURATION + FADE_DURATION) {
        const fadeFrame = localFrame - TRAVEL_DURATION - HOLD_DURATION;
        const fadeProgress = fadeFrame / FADE_DURATION;
        const opacityFactor = 1 - easeOutCubic(fadeProgress);

        activePlanet.cx =
          centerX + Math.sin(t * 0.007 + activePlanet.phase) * 4;
        activePlanet.cy =
          centerY + Math.cos(t * 0.006 + activePlanet.phase * 1.2) * 3;
        drawBlueprintPlanet(
          activePlanet,
          1 - fadeProgress * 0.08,
          opacityFactor,
        );
      }

      stateRef.current.raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity: 1 }}
    />
  );
}

/* ─── Typing effect hook ────────────────────────────────────────────── */
function useTypingEffect(words, typingSpeed = 80, pauseMs = 1800) {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIdx % words.length];
    let timeout;

    if (!deleting && charIdx <= current.length) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        setCharIdx((c) => c + 1);
      }, typingSpeed);
    } else if (!deleting && charIdx > current.length) {
      timeout = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && charIdx >= 0) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        setCharIdx((c) => c - 1);
      }, typingSpeed / 2);
    } else {
      timeout = setTimeout(() => {
        setDeleting(false);
        setWordIdx((w) => (w + 1) % words.length);
        setCharIdx(0);
        setDisplay("");
      }, 0);
    }
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, typingSpeed, pauseMs]);

  return display;
}

/* ─── Animated starfield canvas ────────────────────────────────────── */
function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const STAR_COUNT = 140;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.004 + 0.002,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.08,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.x += s.drift;
        if (s.x < 0) s.x = canvas.width;
        if (s.x > canvas.width) s.x = 0;
        const a = 0.15 + 0.6 * Math.abs(Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,220,130,${a})`;
        ctx.fill();
      });
      t++;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/* ─── Floating particles (right panel) ─────────────────────────────── */
function FloatingParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 38;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.5,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.45 + 0.15),
      alpha: Math.random() * 0.5 + 0.1,
      life: Math.random(),
      decay: Math.random() * 0.003 + 0.001,
      color: Math.random() > 0.5 ? "245,158,11" : "52,211,153",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0 || p.y < -10) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 5;
          p.life = 1;
          p.vx = (Math.random() - 0.5) * 0.35;
          p.vy = -(Math.random() * 0.45 + 0.15);
        }

        const a = p.alpha * Math.sin(p.life * Math.PI);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/* ─── Animated orb blobs ────────────────────────────────────────────── */
function OrbField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-32 top-1/4 h-[480px] w-[480px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.7) 0%, transparent 70%)",
          animation: "orbDrift1 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-24 bottom-1/4 h-[380px] w-[380px] rounded-full opacity-15"
        style={{
          background:
            "radial-gradient(circle, rgba(52,211,153,0.6) 0%, transparent 70%)",
          animation: "orbDrift2 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle, rgba(96,165,250,0.7) 0%, transparent 70%)",
          animation: "orbDrift3 15s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* ─── Animated counter ──────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = "", duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ─── Main Login Page ───────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [buildInfo, setBuildInfo] = useState({
    version: "24",
  });

  const typedWord = useTypingEffect(
    ["elevated.", "reimagined.", "simplified.", "empowered."],
    75,
    2000,
  );

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadBuildInfo() {
      try {
        const res = await fetch("/api/meta/version", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !isActive) return;

        setBuildInfo({
          version: String(data?.version || "1"),
        });
      } catch {}
    }

    loadBuildInfo();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      if (!data.redirectTo) {
        setError("Login succeeded, but redirect target is missing.");
        return;
      }

      router.replace(data.redirectTo);
    } catch (err) {
      console.error(err);
      setError("Something went wrong, try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmerText {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes formShimmer {
          0%   { left: -40%; }
          60%  { left: 140%; }
          100% { left: 140%; }
        }
        @keyframes btnShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes orbDrift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(40px,-60px) scale(1.08); }
        }
        @keyframes orbDrift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-50px,40px) scale(1.06); }
        }
        @keyframes orbDrift3 {
          0%,100% { transform: translateX(-50%) scale(1); }
          50%      { transform: translateX(-50%) translateY(30px) scale(1.05); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cursorBlink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes cardPulse {
          0%,100% { box-shadow: 0 40px 80px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(245,158,11,0); }
          50%      { box-shadow: 0 40px 80px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 28px 2px rgba(245,158,11,0.09); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.85); opacity: 0; }
          70%  { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes lineGrow {
          from { width: 0; opacity: 0; }
          to   { width: 48px; opacity: 1; }
        }
        @keyframes scanLine {
          0%   { top: 0%; opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }

        .cursor-blink::after {
          content: '|';
          display: inline-block;
          margin-left: 2px;
          color: #f59e0b;
          animation: cursorBlink 0.85s step-end infinite;
        }
        .card-glow {
          animation: cardPulse 3.5s ease-in-out infinite;
        }
        .badge-pop {
          animation: badgePop 0.55s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .float-logo {
          animation: floatY 4s ease-in-out infinite;
        }
        .feature-card {
          transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
        }
        .feature-card:hover {
          transform: translateX(6px);
          border-color: rgba(245,158,11,0.22) !important;
          background: rgba(255,255,255,0.06) !important;
        }
        .input-wrap {
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .input-wrap:focus-within {
          transform: scale(1.012);
        }
      `}</style>

      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #060912 0%, #0a1020 45%, #0d0c14 100%)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Deep grid texture */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative z-[2]">
          <OrbField />
        </div>

        {/* Main centered card */}
        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div
            className="relative grid w-full overflow-hidden lg:grid-cols-[1.1fr_0.9fr]"
            style={{
              borderRadius: "28px",
              border: "1px solid rgba(245,158,11,0.18)",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(24px)",
              boxShadow:
                "0 80px 160px -40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 1px 0 rgba(255,255,255,0.12) inset",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(28px)",
              transition:
                "opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 z-0">
              <BlueprintPlanets />
            </div>

            {/* ════════════ LEFT PANEL ════════════ */}
            <section
              className="relative z-10 overflow-hidden px-8 py-10 lg:px-12 lg:py-14"
              style={{
                background:
                  "linear-gradient(155deg, rgba(8,8,18,0.64) 0%, rgba(12,22,14,0.62) 55%, rgba(18,10,6,0.58) 100%)",
                borderRight: "1px solid rgba(245,158,11,0.1)",
              }}
            >
              <StarField />

              {/* Scan line effect */}
              <div
                className="pointer-events-none absolute inset-x-0 h-[1px]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)",
                  animation: "scanLine 8s linear infinite",
                }}
              />

              {/* Radial vignette */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 60% at 20% 30%, rgba(245,158,11,0.07) 0%, transparent 70%)",
                }}
              />

              {/* Decorative rotating arcs */}
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
                style={{
                  border: "1px solid rgba(245,158,11,0.12)",
                  animation: "spinSlow 30s linear infinite",
                }}
              />
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
                style={{
                  border: "1px solid rgba(245,158,11,0.08)",
                  animation: "spinSlow 20s linear infinite reverse",
                }}
              />
              <div
                className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full"
                style={{
                  border: "1px solid rgba(52,211,153,0.08)",
                  animation: "spinSlow 25s linear infinite",
                }}
              />

              <div className="relative">
                {/* Badge */}
                <div
                  className="badge-pop inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest"
                  style={{
                    borderRadius: "100px",
                    border: "1px solid rgba(245,158,11,0.3)",
                    background: "rgba(245,158,11,0.08)",
                    color: "#f59e0b",
                    animationDelay: "0.1s",
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                  GIPS Academic Portal
                </div>

                {/* Logo + Institute name */}
                <div
                  className="mt-8 flex items-center gap-5"
                  style={{ animation: "fadeSlideUp 0.7s ease 0.18s both" }}
                >
                  <div
                    className="float-logo relative flex h-[72px] w-[72px] shrink-0 items-center justify-center"
                    style={{
                      borderRadius: "22px",
                      background:
                        "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      boxShadow: "0 0 32px rgba(245,158,11,0.14)",
                    }}
                  >
                    <Image
                      src="/collage_logo.png"
                      alt="GIPS college logo"
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain"
                      style={{
                        filter: "drop-shadow(0 0 12px rgba(245,158,11,0.45))",
                      }}
                      priority
                    />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.3em]"
                      style={{ color: "rgba(245,158,11,0.75)" }}
                    >
                      Garhwal Institute of
                    </p>
                    <p
                      className="mt-1 font-semibold text-white"
                      style={{ fontSize: "1.05rem", letterSpacing: "0.02em" }}
                    >
                      Paramedical Sciences
                    </p>
                  </div>
                </div>

                {/* Animated divider line */}
                <div
                  className="mt-8 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(245,158,11,0.4), transparent)",
                    animation: "lineGrow 1s ease 0.5s both",
                  }}
                />

                {/* Headline with TYPING EFFECT */}
                <div
                  className="mt-8"
                  style={{ animation: "fadeSlideUp 0.7s ease 0.28s both" }}
                >
                  <h1
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "clamp(2.6rem, 4.5vw, 3.6rem)",
                      fontWeight: 600,
                      lineHeight: 1.08,
                      color: "#ffffff",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Your campus,
                    <br />
                    <span
                      className="cursor-blink"
                      style={{
                        background:
                          "linear-gradient(90deg, #f59e0b 0%, #fcd34d 50%, #f59e0b 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundSize: "200% auto",
                        animation: "shimmerText 4s linear infinite",
                        display: "inline-block",
                        minWidth: "2ch",
                      }}
                    >
                      {typedWord}
                    </span>
                  </h1>
                  <p
                    className="mt-5 max-w-sm text-sm leading-7"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    One welcoming portal for students, faculty, and admin — with
                    cleaner access to attendance, academic workflows, and daily
                    campus operations.
                  </p>
                </div>

                {/* Stats row (empty by default, preserved) */}
                <div
                  className="mt-8 flex gap-6"
                  style={{ animation: "fadeSlideUp 0.7s ease 0.36s both" }}
                >
                  {[].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div
                        className="text-xl font-bold"
                        style={{ color: "#f59e0b" }}
                      >
                        {mounted ? (
                          <AnimatedCounter
                            target={stat.value}
                            suffix={stat.suffix}
                            duration={1600}
                          />
                        ) : (
                          `0${stat.suffix}`
                        )}
                      </div>
                      <div
                        className="mt-0.5 text-[11px] uppercase tracking-wider"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature cards */}
                <div
                  className="mt-8 flex flex-col gap-3"
                  style={{ animation: "fadeSlideUp 0.7s ease 0.44s both" }}
                >
                  {portalHighlights.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="feature-card flex items-start gap-4 px-5 py-4"
                        style={{
                          borderRadius: "18px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          animation: "fadeSlideIn 0.6s ease both",
                          animationDelay: `${0.54 + i * 0.08}s`,
                        }}
                      >
                        <span
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center"
                          style={{
                            borderRadius: "12px",
                            background: `${item.accent}18`,
                            border: `1px solid ${item.accent}35`,
                            color: item.accent,
                          }}
                        >
                          <Icon style={{ width: 18, height: 18 }} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p
                            className="mt-0.5 text-xs leading-5"
                            style={{ color: "rgba(255,255,255,0.42)" }}
                          >
                            {item.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pill tags */}
                <div
                  className="mt-8 flex flex-wrap gap-2"
                  style={{ animation: "fadeSlideUp 0.7s ease 0.84s both" }}
                >
                  {[
                    "Secure login",
                    "Attendance ready",
                    "Role-based access",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium transition-all duration-200 hover:border-amber-500/30 hover:text-amber-400/70"
                      style={{
                        padding: "5px 14px",
                        borderRadius: "100px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.45)",
                        cursor: "default",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* ════════════ RIGHT PANEL ════════════ */}
            <section
              className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14"
              style={{
                background:
                  "linear-gradient(165deg, rgba(10,10,22,0.72) 0%, rgba(8,12,20,0.76) 100%)",
              }}
            >
              {/* Floating particles */}
              <FloatingParticles />

              {/* Radial top glow */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-48"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.1) 0%, transparent 70%)",
                }}
              />

              <div
                className="relative mx-auto w-full max-w-md"
                style={{ animation: "fadeSlideUp 0.8s ease 0.35s both" }}
              >
                {/* Header */}
                <div className="mb-9">
                  <div
                    className="badge-pop inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest"
                    style={{
                      borderRadius: "100px",
                      border: "1px solid rgba(52,211,153,0.25)",
                      background: "rgba(52,211,153,0.08)",
                      color: "#34d399",
                      animationDelay: "0.4s",
                    }}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Secure Sign In
                  </div>
                  <h2
                    className="mt-5"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                      fontWeight: 600,
                      color: "#ffffff",
                      lineHeight: 1.12,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Welcome back
                  </h2>
                  <p
                    className="mt-3 text-sm leading-6"
                    style={{ color: "rgba(255,255,255,0.38)" }}
                  >
                    Enter your credentials to access your student, faculty, or
                    admin workspace.
                  </p>
                </div>

                {/* Form glass card */}
                <div
                  className="card-glow relative p-6 sm:p-8"
                  style={{
                    borderRadius: "24px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {/* shimmer sweep */}
                  <div
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    style={{ borderRadius: "24px" }}
                  >
                    <div
                      className="absolute inset-y-0"
                      style={{
                        width: "40%",
                        left: "-40%",
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
                        animation: "formShimmer 7s ease-in-out infinite",
                      }}
                    />
                  </div>

                  <form onSubmit={handleSubmit} className="relative space-y-5">
                    {error && (
                      <div
                        className="rounded-2xl px-4 py-3 text-sm font-medium"
                        style={{
                          border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.1)",
                          color: "#fca5a5",
                          animation: "fadeSlideUp 0.3s ease both",
                        }}
                      >
                        {error}
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label
                        className="mb-2 block text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.38)" }}
                      >
                        Email Address or Enrollment No.
                      </label>
                      <div
                        className="input-wrap flex items-center gap-3 px-4 py-3.5"
                        style={{
                          borderRadius: "14px",
                          border:
                            focusedField === "email"
                              ? "1px solid rgba(245,158,11,0.55)"
                              : "1px solid rgba(255,255,255,0.1)",
                          background:
                            focusedField === "email"
                              ? "rgba(245,158,11,0.04)"
                              : "rgba(255,255,255,0.05)",
                          boxShadow:
                            focusedField === "email"
                              ? "0 0 0 3px rgba(245,158,11,0.08)"
                              : "none",
                        }}
                      >
                        <Mail
                          className="h-4 w-4 shrink-0"
                          style={{
                            color:
                              focusedField === "email"
                                ? "#f59e0b"
                                : "rgba(255,255,255,0.28)",
                            transition: "color 0.2s",
                          }}
                        />
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com or 6189001"
                          required
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          className="w-full bg-transparent text-sm placeholder:text-white/25 focus:outline-none"
                          style={{ color: "rgba(255,255,255,0.9)" }}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        className="mb-2 block text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.38)" }}
                      >
                        Password
                      </label>
                      <div
                        className="input-wrap flex items-center gap-3 px-4 py-3.5"
                        style={{
                          borderRadius: "14px",
                          border:
                            focusedField === "password"
                              ? "1px solid rgba(52,211,153,0.55)"
                              : "1px solid rgba(255,255,255,0.1)",
                          background:
                            focusedField === "password"
                              ? "rgba(52,211,153,0.04)"
                              : "rgba(255,255,255,0.05)",
                          boxShadow:
                            focusedField === "password"
                              ? "0 0 0 3px rgba(52,211,153,0.08)"
                              : "none",
                        }}
                      >
                        <Lock
                          className="h-4 w-4 shrink-0"
                          style={{
                            color:
                              focusedField === "password"
                                ? "#34d399"
                                : "rgba(255,255,255,0.28)",
                            transition: "color 0.2s",
                          }}
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          className="w-full bg-transparent text-sm placeholder:text-white/25 focus:outline-none"
                          style={{ color: "rgba(255,255,255,0.9)" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="shrink-0 transition-opacity hover:opacity-80"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="group relative w-full overflow-hidden py-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-18px_rgba(245,158,11,0.6)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        borderRadius: "14px",
                        background:
                          "linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)",
                        border: "1px solid rgba(245,158,11,0.35)",
                        boxShadow: "0 8px 24px -8px rgba(245,158,11,0.38)",
                        marginTop: "28px",
                      }}
                    >
                      <span
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.15) 50%, transparent 80%)",
                          animation: "btnShimmer 1.6s ease-in-out infinite",
                        }}
                      />
                      <span className="relative flex items-center justify-center gap-2">
                        {submitting ? (
                          <>
                            <svg
                              className="h-4 w-4 animate-spin"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                              />
                            </svg>
                            Signing In…
                          </>
                        ) : (
                          <>
                            Enter Portal
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                </div>

                {/* Bottom info strips */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Access",
                      value: "Every campus role",
                      accent: "#f59e0b",
                    },
                    {
                      label: "Experience",
                      value: "Premium dashboard flow",
                      accent: "#34d399",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-4 transition-all duration-200 hover:border-white/10"
                      style={{
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: item.accent, opacity: 0.8 }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="mt-1.5 text-xs font-medium leading-5"
                        style={{ color: "rgba(255,255,255,0.52)" }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
          <div
            className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full px-4 py-2 text-[11px] font-medium tracking-[0.16em] text-white/60"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(14px)",
            }}
          >
            <span className="uppercase text-amber-300/85">
              Version {buildInfo.version}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
