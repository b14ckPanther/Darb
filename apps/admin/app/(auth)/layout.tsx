import type { ReactNode } from "react";

/**
 * Arrival handoff from darb.co.il. A cross-origin navigation cannot share a view transition, so
 * the public site hands over only a visual cue: when the visitor comes from Main (production or
 * local development on port 3000) and allows motion, the page opens out of the corridor light.
 * The script runs before first paint, reads only the referrer origin, and never blocks content.
 */
const arrivalScript = `(function(){try{var r=document.referrer;if(!r||matchMedia("(prefers-reduced-motion: reduce)").matches)return;var u=new URL(r),h=u.hostname;if(h==="darb.co.il"||h==="www.darb.co.il"||((h==="localhost"||h==="127.0.0.1")&&u.port==="3000")){document.documentElement.dataset.arrival="darb";}}catch(e){}})();`;

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <script id="darb-arrival" dangerouslySetInnerHTML={{ __html: arrivalScript }} />
      {children}
    </>
  );
}
