import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#whats-new", label: "What's new" },
      { href: "/#demo", label: "Demo" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#store", label: "Products" },
      { href: "/store", label: "Store" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/#testimonials", label: "Testimonials" },
      { href: "/#faq", label: "FAQ" },
      { href: "/#cta", label: "Get started" },
      { href: "/affiliates", label: "Affiliates" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/demo", label: "NFC demo" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border-light/50 py-12 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Row 1: Brand + link columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-sm font-bold text-foreground">
              RingTap
            </Link>
            <p className="mt-2 text-xs text-muted">
              Your digital business card. One tap. ringtap.me
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-light">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-light hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Row 2: Copyright + legal links */}
        <div className="mt-10 pt-8 border-t border-border-light/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>© {new Date().getFullYear()} RingTap. Your digital business card.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1" aria-label="Footer legal">
            <Link href="/#faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Use
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
