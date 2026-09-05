import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation primitives — use these instead of next/link and
// next/navigation in all localised UI so the locale prefix is preserved.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
