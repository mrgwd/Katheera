import Link from "next/link";

export default function NotFound() {
  return (
    <main className="layout space-y-4 py-32 text-center">
      <p className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
        404
      </p>
      <h1 className="text-foreground text-3xl font-bold">Page not found</h1>
      <p className="text-muted-foreground text-sm">
        The page you are looking for doesn&apos;t exist or was moved.
      </p>
      <Link href="/" className="text-primary font-medium underline">
        Back home
      </Link>
    </main>
  );
}
