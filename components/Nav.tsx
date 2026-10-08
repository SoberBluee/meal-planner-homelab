"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/shop/new", label: "Shop" },
  { href: "/meals", label: "Meals" },
  { href: "/essentials", label: "Essentials" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/shop-layout", label: "Shop layout" },
  { href: "/people", label: "People" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background">
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-3 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/shop/new"
          className="font-serif text-xl font-medium tracking-tight"
        >
          Meal Planner
        </Link>
        <nav className="flex max-w-full items-center gap-1 overflow-x-auto pb-1">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
