import { darbPlatform } from "@darb/config/platform";

export default function Loading() {
  return (
    <main id="main-content" className="loading-screen" aria-live="polite" aria-busy="true">
      <span className="loading-mark" aria-hidden="true" />
      <p>Loading {darbPlatform.name}…</p>
    </main>
  );
}
