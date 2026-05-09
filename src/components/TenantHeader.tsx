import Image from "next/image";
import Link from "next/link";
import type { WlTenant } from "@/lib/types";
import { LogoutButton } from "@/components/LogoutButton";

export function TenantHeader({
  tenant,
  href = "/",
  showNav = false
}: {
  tenant: WlTenant;
  href?: string;
  showNav?: boolean;
}) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={href} className="flex shrink-0 items-center gap-3">
          {tenant.logo_url ? (
            <Image src={tenant.logo_url} alt={tenant.name} width={70} height={70} className="h-[70px] w-[70px] shrink-0 rounded object-contain" />
          ) : (
            <span className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded bg-brand-primary text-lg font-bold text-white">
              {tenant.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="truncate text-lg font-semibold text-gray-950">{tenant.name}</span>
        </Link>

        {showNav ? (
          <nav className="flex items-center gap-1">
            <Link href="/tenant" className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-950">
              Dashboard
            </Link>
            <Link href="/tenant/settings" className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-950">
              Settings
            </Link>
            <LogoutButton />
          </nav>
        ) : null}
      </div>
    </header>
  );
}
