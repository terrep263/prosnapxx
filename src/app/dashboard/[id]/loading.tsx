export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        <div className="h-[480px] animate-pulse rounded-lg bg-gray-200" />
        <div className="h-[480px] animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}
