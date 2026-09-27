"use client";

import { useEffect } from "react";

import { darbApplications } from "@darb/config/platform";

const pathHosts = new Set<string>([
  darbApplications.admin.productionHost,
  darbApplications.rest.productionHost,
]);

/**
 * When a visitor leaves Main for another Darb application, light floods out through a doorway
 * from the link they chose while the browser performs an ordinary cross-origin navigation. The
 * destination picks the same light up on arrival. Nothing is delayed or intercepted.
 */
export function RouteExit() {
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let safety = 0;

    function clear() {
      delete root.dataset.routeLeaving;
      window.clearTimeout(safety);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || reducedMotion.matches) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self")) return;

      let destination: URL;
      try {
        destination = new URL(link.href);
      } catch {
        return;
      }
      if (!pathHosts.has(destination.hostname)) return;

      const bounds = link.getBoundingClientRect();
      root.style.setProperty("--exit-x", `${bounds.left + bounds.width / 2}px`);
      root.style.setProperty("--exit-y", `${bounds.top + bounds.height / 2}px`);
      root.dataset.routeLeaving = destination.hostname.split(".")[0] ?? "path";
      window.clearTimeout(safety);
      safety = window.setTimeout(clear, 6000);
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) clear();
    };

    document.addEventListener("click", onClick);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("pageshow", onPageShow);
      clear();
    };
  }, []);

  return <div className="route-exit" aria-hidden="true" />;
}
