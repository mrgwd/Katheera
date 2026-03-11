import { cn } from "@workspace/lib/utils";

export default function ZikrInfoCard({
  children,
  className,
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn("bg-muted space-y-2 rounded-xl p-3", className)}
    >
      {children}
    </div>
  );
}

function ZikrInfoCardText({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="text-foreground/80 text-sm font-bold italic">
      {children}
    </blockquote>
  );
}

function ZikrInfoCardFooter({ children }: { children: React.ReactNode }) {
  return (
    <footer className="text-muted-foreground flex items-center justify-between text-xs">
      {children}
    </footer>
  );
}

ZikrInfoCard.Text = ZikrInfoCardText;
ZikrInfoCard.Footer = ZikrInfoCardFooter;
