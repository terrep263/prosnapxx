import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  href?: string;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export function TenantButton({ children, variant = "primary", href, className = "", ...props }: Props) {
  const base =
    "focus-ring inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-brand-primary text-white hover:opacity-90"
      : "border border-gray-300 bg-white text-gray-950 hover:border-brand-primary";
  const classes = `${base} ${styles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
