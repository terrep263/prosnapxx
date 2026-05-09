export default function GalleryLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-md bg-gray-200" />
          ))}
        </div>
      </section>
    </div>
  );
}
