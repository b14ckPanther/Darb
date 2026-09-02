import Link from "next/link";

export default function MainNotFound() {
  return (
    <main id="main-content" className="foundation">
      <section className="foundation__content" aria-labelledby="not-found-title">
        <p className="foundation__brand">Darb</p>
        <h1 id="not-found-title">Page not found</h1>
        <p className="foundation__description">The requested Darb page is not available.</p>
        <Link className="foundation__action" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
