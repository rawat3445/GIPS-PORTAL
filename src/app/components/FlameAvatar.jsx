"use client";

import { useEffect, useRef, useState } from "react";
import ProfileAvatar from "./ProfileAvatar";

const CANVAS_SIZE = 420;
const CENTER = CANVAS_SIZE / 2;
const AVATAR_RADIUS = 118;
const SHELL_RATIO = 0.88;
const SHELL_RADIUS = (CANVAS_SIZE * SHELL_RATIO) / 2;
const RING_RADIUS = 198;
const FLAME_BASE_RADIUS = RING_RADIUS - 1;
const FLAME_SAFE_RADIUS = SHELL_RADIUS + 1;
const TAU = Math.PI * 2;

const DEFAULT_THEME = {
  shell: "from-amber-100 via-white to-orange-100",
  avatarClass:
    "border-amber-100 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 text-amber-700",
  edge: "rgba(253, 230, 138, 0.94)",
  halo: "rgba(180, 83, 9, 0.46)",
  flameOuter: "#b45309",
  flameInner: "#f59e0b",
  flameCore: "#fef3c7",
  flameStroke: "#78350f",
};

const FLAME_LAYERS = [
  {
    count: 48,
    hMin: 78,
    hMax: 98,
    wMin: 20,
    wMax: 34,
    speedMin: 0.35,
    speedMax: 0.75,
    wobbleMin: 0.012,
    wobbleMax: 0.028,
    driftRange: 0.008,
    jitter: 0.08,
  },
  {
    count: 48,
    hMin: 70,
    hMax: 90,
    wMin: 12,
    wMax: 22,
    speedMin: 0.45,
    speedMax: 0.9,
    wobbleMin: 0.02,
    wobbleMax: 0.05,
    driftRange: 0.01,
    jitter: 0.1,
  },
  {
    count: 48,
    hMin: 70,
    hMax: 200,
    wMin: 6,
    wMax: 12,
    speedMin: 0.55,
    speedMax: 1.1,
    wobbleMin: 0.03,
    wobbleMax: 0.07,
    driftRange: 0.012,
    jitter: 0.12,
  },
];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function hexToRgba(hex, alpha) {
  let value = String(hex || "").replace("#", "");

  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const parsed = Number.parseInt(value, 16);
  const red = (parsed >> 16) & 255;
  const green = (parsed >> 8) & 255;
  const blue = parsed & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

class Flame {
  constructor(layerConfig, index, total) {
    this.config = layerConfig;
    this.baseAngle = (index / total) * TAU;
    this.reset();
  }

  reset() {
    const config = this.config;

    this.angle = this.baseAngle + rand(-config.jitter, config.jitter);
    this.life = 0;
    this.maxLife = rand(36, 90);
    this.width = rand(config.wMin, config.wMax);
    this.height = rand(config.hMin, config.hMax);
    this.phase = rand(0, TAU);
    this.wobble = rand(config.wobbleMin, config.wobbleMax);
    this.drift = rand(-config.driftRange, config.driftRange);
  }

  update() {
    this.life += 1;
    this.angle += this.drift;

    if (this.life >= this.maxLife) {
      this.reset();
    }
  }

  draw(ctx, theme) {
    const progress = this.life / this.maxLife;
    const easeIn = progress < 0.15 ? progress / 0.15 : 1;
    const fadeOut = progress > 0.58 ? 1 - (progress - 0.58) / 0.42 : 1;
    const alpha = easeIn * fadeOut;
    const growth = progress < 0.2 ? progress / 0.2 : 1;

    if (alpha < 0.01) {
      return;
    }

    const radialX = Math.cos(this.angle);
    const radialY = Math.sin(this.angle);
    const baseX = CENTER + radialX * FLAME_BASE_RADIUS;
    const baseY = CENTER + radialY * FLAME_BASE_RADIUS;
    const inwardX = -radialX;
    const inwardY = -radialY;
    const perpX = -radialY;
    const perpY = radialX;

    const maxDepth = Math.max(8, FLAME_BASE_RADIUS - FLAME_SAFE_RADIUS);
    const tipDistance = Math.min(
      this.height * growth * (1 - progress * 0.22),
      maxDepth,
    );

    const swayOne = Math.sin(this.life * this.wobble + this.phase);
    const tipX =
      baseX +
      inwardX * tipDistance +
      swayOne * perpX * this.width * 0.26 * growth;
    const tipY =
      baseY +
      inwardY * tipDistance +
      swayOne * perpY * this.width * 0.26 * growth;

    const halfWidth = this.width * 0.5 * growth * (1 - progress * 0.28);
    const leftX = baseX + perpX * halfWidth;
    const leftY = baseY + perpY * halfWidth;
    const rightX = baseX - perpX * halfWidth;
    const rightY = baseY - perpY * halfWidth;

    const swayTwo = Math.sin(this.life * this.wobble * 1.35 + this.phase);
    const midX =
      baseX + inwardX * tipDistance * 0.42 + swayTwo * perpX * halfWidth * 0.8;
    const midY =
      baseY + inwardY * tipDistance * 0.42 + swayTwo * perpY * halfWidth * 0.8;

    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.quadraticCurveTo(
      midX + perpX * halfWidth * 0.5,
      midY + perpY * halfWidth * 0.5,
      tipX,
      tipY,
    );
    ctx.quadraticCurveTo(
      midX - perpX * halfWidth * 0.5,
      midY - perpY * halfWidth * 0.5,
      rightX,
      rightY,
    );
    ctx.closePath();

    const flameGradient = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
    flameGradient.addColorStop(0, hexToRgba(theme.flameOuter, alpha * 0.88));
    flameGradient.addColorStop(0.32, hexToRgba(theme.flameInner, alpha * 0.92));
    flameGradient.addColorStop(0.72, hexToRgba(theme.flameCore, alpha * 0.9));
    flameGradient.addColorStop(1, hexToRgba(theme.flameCore, 0));

    ctx.fillStyle = flameGradient;
    ctx.fill();

    if (halfWidth > 3) {
      const coreWidth = halfWidth * 0.34;
      const coreLeftX = baseX + perpX * coreWidth;
      const coreLeftY = baseY + perpY * coreWidth;
      const coreRightX = baseX - perpX * coreWidth;
      const coreRightY = baseY - perpY * coreWidth;
      const coreTipX = baseX + inwardX * tipDistance * 0.62;
      const coreTipY = baseY + inwardY * tipDistance * 0.62;

      ctx.beginPath();
      ctx.moveTo(coreLeftX, coreLeftY);
      ctx.quadraticCurveTo(midX, midY, coreTipX, coreTipY);
      ctx.quadraticCurveTo(midX, midY, coreRightX, coreRightY);
      ctx.closePath();

      const coreGradient = ctx.createLinearGradient(
        baseX,
        baseY,
        coreTipX,
        coreTipY,
      );
      coreGradient.addColorStop(0, `rgba(255,255,245,${alpha * 0.92})`);
      coreGradient.addColorStop(0.58, hexToRgba(theme.flameCore, alpha * 0.72));
      coreGradient.addColorStop(1, hexToRgba(theme.flameInner, 0));

      ctx.fillStyle = coreGradient;
      ctx.fill();
    }
  }
}

function drawAvatarBackdrop(ctx) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, AVATAR_RADIUS, 0, TAU);
  ctx.fillStyle = "rgba(8, 8, 8, 0.96)";
  ctx.fill();
  ctx.restore();
}

function drawOuterRing(ctx, theme, timeSeconds) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RING_RADIUS, 0, TAU);
  ctx.strokeStyle = hexToRgba(
    theme.flameOuter,
    0.16 + 0.05 * Math.sin(timeSeconds * 2.1),
  );
  ctx.lineWidth = 9;
  ctx.shadowColor = hexToRgba(theme.flameOuter, 0.28);
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RING_RADIUS, 0, TAU);
  ctx.strokeStyle = hexToRgba(
    theme.flameCore,
    0.88 + 0.08 * Math.sin(timeSeconds * 2.8),
  );
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

function drawAvatarRing(ctx, theme, timeSeconds) {
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, AVATAR_RADIUS + 5, 0, TAU);
  ctx.strokeStyle = hexToRgba(
    theme.flameCore,
    0.42 + 0.08 * Math.sin(timeSeconds * 2.5),
  );
  ctx.lineWidth = 2;
  ctx.stroke();
}

export default function FlameAvatar({
  src = "",
  name = "",
  theme = null,
  size = 168,
}) {
  const [readyThemeKey, setReadyThemeKey] = useState("");
  const canvasRef = useRef(null);
  const hasFlameTheme = Boolean(theme);
  const resolvedTheme = theme || DEFAULT_THEME;
  const shellSize = Math.round(size * SHELL_RATIO);
  const themeKey = hasFlameTheme
    ? [
        resolvedTheme.flameOuter,
        resolvedTheme.flameInner,
        resolvedTheme.flameCore,
        resolvedTheme.flameStroke,
      ].join("|")
    : "";
  const flameReady = hasFlameTheme && readyThemeKey === themeKey;

  useEffect(() => {
    if (!hasFlameTheme) {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * devicePixelRatio;
    canvas.height = CANVAS_SIZE * devicePixelRatio;

    const flames = [];
    FLAME_LAYERS.forEach((layerConfig) => {
      for (let index = 0; index < layerConfig.count; index += 1) {
        const flame = new Flame(layerConfig, index, layerConfig.count);
        flame.life = Math.floor(rand(0, flame.maxLife));
        flames.push(flame);
      }
    });

    let frameId = 0;
    let painted = false;
    let active = true;

    const render = () => {
      const timeSeconds = Date.now() / 1000;

      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      drawAvatarBackdrop(context);

      context.save();
      context.beginPath();
      context.arc(CENTER, CENTER, RING_RADIUS - 1.5, 0, TAU);
      context.clip();
      flames.forEach((flame) => {
        flame.update();
        flame.draw(context, resolvedTheme);
      });
      context.restore();

      drawOuterRing(context, resolvedTheme, timeSeconds);
      drawAvatarRing(context, resolvedTheme, timeSeconds);

      if (!painted && active) {
        painted = true;
        setReadyThemeKey(themeKey);
      }

      frameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
    };
  }, [
    hasFlameTheme,
    themeKey,
    resolvedTheme.flameOuter,
    resolvedTheme.flameInner,
    resolvedTheme.flameCore,
    resolvedTheme.flameStroke,
  ]);

  return (
    <div
      className="relative isolate flex-shrink-0"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {hasFlameTheme ? (
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className={`h-full w-full rounded-full transition-opacity duration-300 ${
            flameReady ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow:
            hasFlameTheme && flameReady
              ? `0 0 0 1.5px ${resolvedTheme.edge}, 0 24px 60px -28px ${resolvedTheme.halo}`
              : "0 0 0 1.5px rgba(255,255,255,0.82), 0 10px 30px -18px rgba(15,23,42,0.35)",
          transition: "box-shadow 220ms ease",
        }}
      />

      <div
        className={`absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br p-1 shadow-[0_18px_35px_-22px_rgba(15,23,42,0.45)] ${
          hasFlameTheme
            ? resolvedTheme.shell
            : "from-white via-slate-50 to-white"
        }`}
        style={{ width: `${shellSize}px`, height: `${shellSize}px` }}
      >
        <ProfileAvatar
          src={src}
          name={name}
          sizeClass="h-full w-full"
          textClassName="text-[28px]"
          className={`relative z-10 ${
            hasFlameTheme ? resolvedTheme.avatarClass : ""
          }`}
        />
      </div>
    </div>
  );
}
