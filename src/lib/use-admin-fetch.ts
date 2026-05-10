"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAdminFetch() {
  const router = useRouter();

  const adminFetch = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    const res = await fetch(url, options);
    if (res.status === 401) {
      router.push("/admin/login");
    }
    return res;
  }, [router]);

  return adminFetch;
}
