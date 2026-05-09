export default function TenantLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-4 sm:px-6">
          <div className="h-11 w-11 animate-pulse rounded bg-gray-200" />
          <div className="ml-3 h-5 w-40 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="mt-8 h-64 animate-pulse rounded-lg bg-gray-200" />
      </section>
    </div>
  );
}
