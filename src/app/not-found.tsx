import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <p className="text-6xl font-bold text-gray-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-950">Page not found</h1>
      <p className="mt-2 text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
      <Link href="/" className="mt-8 inline-flex items-center rounded-md bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
        Go home
      </Link>
    </main>
  );
}
