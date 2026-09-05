// import { Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GITHUB_ISSUES_URL, GITHUB_REPO_URL } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="bg-muted/40 border-border mt-16 border-t md:mt-24">
      <div className="layout py-14 max-sm:px-2">
        {/* Top grid */}
        <div className="mb-12 grid grid-cols-2 flex-wrap gap-12 md:flex md:justify-between">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={16} height={16} />
              <p className="text-sm font-bold">Katheera</p>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed md:max-w-40">
              Transform your silent moments into spiritual rewards with
              hands-free zikr counting.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-foreground mb-4 text-sm font-semibold">
              Product
            </p>
            <ul className="">
              {[
                {
                  label: "Chrome Web Store",
                  href: "https://chrome.google.com/webstore",
                  external: true,
                },
                {
                  label: "How It Works",
                  href: "/#features",
                  external: false,
                },
                { label: "FAQ", href: "/#faq", external: false },
              ].map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <p className="text-foreground mb-4 text-sm font-semibold">
              Community
            </p>
            <ul className="">
              {[
                { label: "GitHub", href: GITHUB_REPO_URL, external: true },
                {
                  label: "Report an Issue",
                  href: GITHUB_ISSUES_URL,
                  external: true,
                },
                { label: "Contribute", href: "/contribute", external: false },
              ].map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-foreground mb-4 text-sm font-semibold">Legal</p>
            <ul className="">
              {[{ label: "Privacy Policy", href: "/privacy" }].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
