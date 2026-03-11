"use client";
import Link from "next/link";
import Logo from "./Logo";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/lib/utils";
import { Button, buttonVariants } from "@workspace/ui/components/button";
const links = [
  { href: "/", label: "Home" },
  { href: "/privacy", label: "Privacy" },
  // { href: "/contribute", label: "Contribute" },
];
export default function Header() {
  const pathname = usePathname();
  return (
    <header>
      <nav className="layout flex items-center justify-between py-4">
        <Logo />
        <ul className="flex gap-2 sm:gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "font-medium",
                  pathname === link.href ? "text-primary" : "text-neutral-400",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href=""
          className={cn("underline", buttonVariants({ variant: "link" }))}
        >
          Contact
        </Link>
      </nav>
    </header>
  );
}
