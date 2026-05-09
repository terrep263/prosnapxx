import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TenantProvider } from "@/lib/tenant";
import { getTenant } from "@/lib/server-tenant";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await getTenant();
    return {
      title: tenant.name,
      icons: tenant.logo_url ? { icon: tenant.logo_url } : undefined
    };
  } catch {
    return { title: "Photo Gallery" };
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let tenant = null;
  try {
    tenant = await getTenant();
  } catch {
    tenant = null;
  }

  return (
    <html
      lang="en"
      className={inter.variable}
      style={
        {
          "--color-primary": tenant?.primary_color ?? "#530792",
          "--color-secondary": tenant?.secondary_color ?? "#ec4899"
        } as React.CSSProperties
      }
    >
      <body>
        <TenantProvider tenant={tenant}>
          <ToastProvider>{children}</ToastProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
