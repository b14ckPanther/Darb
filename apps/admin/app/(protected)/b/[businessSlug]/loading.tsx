export default function BusinessLoading() {
  return (
    <div className="content-loading" role="status" aria-live="polite">
      <span className="content-loading__line content-loading__line--short" />
      <span className="content-loading__line content-loading__line--title" />
      <span className="content-loading__line" />
      <span className="visually-hidden">Loading business workspace…</span>
    </div>
  );
}
