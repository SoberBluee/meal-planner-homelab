"use client";

import type { ReactNode } from "react";

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </main>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "sm";
}) {
  const base =
    "inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  const sizes = {
    default: "rounded-lg px-4 py-2.5 text-sm",
    sm: "rounded-md px-3 py-1.5 text-sm",
  };

  const styles = {
    primary: "bg-accent text-white hover:bg-accent-hover",
    secondary:
      "border border-border bg-surface text-foreground hover:border-foreground/20 hover:bg-background",
    ghost: "text-muted hover:text-foreground",
    danger: "text-red-700 hover:bg-red-50",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

export function TextInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/15 ${className}`}
      {...props}
    />
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-sm font-medium text-muted">{children}</h2>
  );
}

export function Divider() {
  return <hr className="border-border" />;
}

export function ListShell({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {children}
    </ul>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-surface px-5 py-8 text-center text-sm leading-relaxed text-muted">
      {children}
    </p>
  );
}
