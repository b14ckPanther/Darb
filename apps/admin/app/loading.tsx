import { darbPlatform } from "@darb/config/platform";
import { DarbMark } from "@darb/ui";

export default function Loading() {
  return (
    <main id="main-content" className="loading-screen" aria-live="polite" aria-busy="true">
      <DarbMark className="loading-mark" size={44} aria-hidden="true" />
      <p>Loading {darbPlatform.name}…</p>
    </main>
  );
}
