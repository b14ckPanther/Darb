export default function RestaurantLoading() {
  return (
    <main className="loading-shell" aria-busy="true" aria-label="Loading restaurant menu">
      <div className="loading-header" />
      <div className="loading-hero" />
      <div className="loading-content">
        <div className="loading-title" />
        <div className="loading-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="loading-card" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
