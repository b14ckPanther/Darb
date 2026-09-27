"use client";

import { useEffect, useRef } from "react";

import type { ThresholdScene as Scene } from "./engine";

const compactQuery = "(max-width: 47.99rem), (max-width: 63.99rem) and (orientation: portrait)";
const motionQuery = "(prefers-reduced-motion: reduce)";

/** Hardware-accelerated WebGL only; software rasterizers keep the poster. */
function supportsWebGL(): boolean {
  try {
    const probe = document.createElement("canvas");
    const options = { failIfMajorPerformanceCaveat: true };
    const context = (probe.getContext("webgl2", options) ?? probe.getContext("webgl", options)) as
      WebGLRenderingContext | WebGL2RenderingContext | null;
    if (!context) return false;
    const debug = context.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "";
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|software/i.test(renderer);
  } catch {
    return false;
  }
}

/**
 * The live scene adds pointer parallax and a true camera move; on touch devices the poster's
 * compositor-only scroll dolly carries the same idea without a WebGL context, so they keep it.
 */
function prefersLightweightMedia(): boolean {
  const hints = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (hints.connection?.saveData === true) return true;
  if (typeof hints.deviceMemory === "number" && hints.deviceMemory < 4) return true;
  return !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function whenIdle(callback: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(callback, { timeout: 1600 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(callback, 320);
  return () => clearTimeout(handle);
}

/**
 * Progressive enhancement for the threshold poster. The poster is the complete design; the live
 * scene only replaces it when WebGL, motion preferences, and data preferences allow.
 */
export function ThresholdScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    const section = canvas?.closest<HTMLElement>("[data-threshold]");
    if (!canvas || !stage || !section) return;

    const reducedMotion = window.matchMedia(motionQuery);
    if (reducedMotion.matches || prefersLightweightMedia() || !supportsWebGL()) return;

    let disposed = false;
    let scene: Scene | null = null;
    let frame = 0;
    let visible = false;
    let lastProgress = -1;
    const cleanups: Array<() => void> = [];

    function markReady(ready: boolean) {
      if (ready) section!.dataset.scene = "live";
      else delete section!.dataset.scene;
    }

    function readProgress() {
      frame = 0;
      if (!scene || !visible) return;
      const rect = section!.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      if (Math.abs(progress - lastProgress) > 0.0005) {
        lastProgress = progress;
        scene.setProgress(progress);
      }
      frame = requestAnimationFrame(readProgress);
    }

    const cancelIdle = whenIdle(async () => {
      try {
        const { createThresholdScene } = await import("./engine");
        if (disposed) return;

        scene = createThresholdScene({
          canvas,
          compact: window.matchMedia(compactQuery).matches,
          direction: document.documentElement.dir === "rtl" ? "rtl" : "ltr",
        });

        const onPointer = (event: PointerEvent) => {
          const bounds = section.getBoundingClientRect();
          const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
          const y = ((event.clientY - bounds.top) / window.innerHeight) * 2 - 1;
          scene?.setPointer(x, -y);
        };

        const onLost = (event: Event) => {
          event.preventDefault();
          markReady(false);
        };
        const onRestored = () => {
          scene?.renderOnce();
          markReady(true);
        };
        canvas.addEventListener("webglcontextlost", onLost);
        canvas.addEventListener("webglcontextrestored", onRestored);
        cleanups.push(() => {
          canvas.removeEventListener("webglcontextlost", onLost);
          canvas.removeEventListener("webglcontextrestored", onRestored);
        });

        const bounds = stage.getBoundingClientRect();
        await scene.prepare(bounds.width, bounds.height);
        if (disposed) return;

        const resize = new ResizeObserver(([entry]) => {
          if (!entry || !scene) return;
          scene.resize(entry.contentRect.width, entry.contentRect.height);
        });
        resize.observe(stage);
        cleanups.push(() => resize.disconnect());

        const visibility = new IntersectionObserver(([entry]) => {
          visible = Boolean(entry?.isIntersecting);
          if (visible && !frame) frame = requestAnimationFrame(readProgress);
        });
        visibility.observe(section);
        cleanups.push(() => visibility.disconnect());

        section.addEventListener("pointermove", onPointer, { passive: true });
        cleanups.push(() => section.removeEventListener("pointermove", onPointer));

        requestAnimationFrame(() => {
          if (!disposed) markReady(true);
        });
      } catch {
        markReady(false);
      }
    });

    const onMotionChange = () => {
      if (reducedMotion.matches) markReady(false);
    };
    reducedMotion.addEventListener("change", onMotionChange);

    return () => {
      disposed = true;
      cancelIdle();
      if (frame) cancelAnimationFrame(frame);
      reducedMotion.removeEventListener("change", onMotionChange);
      cleanups.forEach((cleanup) => cleanup());
      scene?.dispose();
      markReady(false);
    };
  }, []);

  return <canvas ref={canvasRef} className="threshold__canvas" aria-hidden="true" />;
}
