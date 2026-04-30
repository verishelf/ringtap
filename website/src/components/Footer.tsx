import { BookOpen, Info, Scale, ShoppingBag } from "lucide-react";
import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    icon: ShoppingBag,
    iconColor: "text-orange-500",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#whats-new", label: "What's new" },
      { href: "/#demo", label: "Demo" },
      { href: "/pro", label: "RingTap Pro" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#store", label: "Products" },
      { href: "/store", label: "Store" },
    ],
  },
  {
    title: "Company",
    icon: Info,
    iconColor: "text-blue-500",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/#testimonials", label: "Testimonials" },
      { href: "/#faq", label: "FAQ" },
      { href: "/#cta", label: "Get started" },
      { href: "/affiliates", label: "Affiliates" },
    ],
  },
  {
    title: "Legal",
    icon: Scale,
    iconColor: "text-amber-500",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
    ],
  },
  {
    title: "Resources",
    icon: BookOpen,
    iconColor: "text-violet-500",
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
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
              <img src="/icon.png" alt="" className="h-6 w-6" aria-hidden />
              RingTap
            </Link>
            <p className="mt-2 text-xs text-muted">
              Your digital business card. One tap. ringtap.me
            </p>
            <a
              href="https://apps.apple.com/us/app/ringtap-me/id6758565822"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block transition-opacity hover:opacity-90"
              aria-label="Download on the App Store"
            >
              <img
                src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=1277769600"
                alt="Download on the App Store"
                className="h-10 w-auto"
              />
            </a>
          </div>
          {FOOTER_COLUMNS.map((col) => {
            const Icon = col.icon;
            return (
            <div key={col.title} className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-light flex items-center gap-2">
                <Icon className={`h-3.5 w-3.5 ${col.iconColor}`} />
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
          );
          })}
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
