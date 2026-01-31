"use client";

import Link from "next/link";
import { useState } from "react";

type HeaderVariant = "home" | "store";

const homeLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "/store", label: "Store" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#download", label: "Download", cta: true },
] as const;

const storeLinks = [
  { href: "/#features", label: "Features" },
  { href: "/store", label: "Store", active: true },
  { href: "/#download", label: "Download", cta: true },
] as const;

function NavLink({
  href,
  label,
  active,
  cta,
  onClick,
}: {
  href: string;
  label: string;
  active?: boolean;
  cta?: boolean;
  onClick?: () => void;
}) {
  const isHash = href.startsWith("#");
  const className = cta
    ? "rounded-full bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-background transition-colors"
    : active
      ? "text-sm font-medium text-accent"
      : "text-sm font-medium text-muted-light hover:text-foreground transition-colors";

  const content = <span>{label}</span>;

  if (isHash && href === "#download") {
    return (
      <a href={href} className={className} onClick={onClick}>
        {content}
      </a>
    );
  }
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} className={className} onClick={onClick}>
      {content}
    </a>
  );
}

export function Header({ variant = "home" }: { variant?: HeaderVariant }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = variant === "store" ? storeLinks : homeLinks;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-light/50 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground"
          onClick={() => setMenuOpen(false)}
        >
          RingTap
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <NavLink
              key={link.label}
              href={link.href}
              label={link.label}
              active={"active" in link && link.active}
              cta={"cta" in link && link.cta}
            />
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-surface-elevated transition-colors"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`md:hidden overflow-hidden border-t border-border-light/50 bg-background transition-[max-height,opacity] duration-200 ease-out ${
          menuOpen ? "max-h-[380px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-4 py-4 gap-0">
          {links.map((link) => (
            <div key={link.label} className="border-b border-border-light/30 last:border-0">
              <span className="block py-3">
                <NavLink
                  href={link.href}
                  label={link.label}
                  active={"active" in link && link.active}
                  cta={"cta" in link && link.cta}
                  onClick={() => setMenuOpen(false)}
                />
              </span>
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
