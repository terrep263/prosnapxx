"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <p className="text-6xl font-bold text-gray-200">500</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-950">Something went wrong</h1>
      <p className="mt-2 text-gray-500">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-md bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
      >
        Try again
      </button>
    </main>
  );
}
