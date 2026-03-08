import { cn } from "@workspace/lib/utils";

const ZikrCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "bg-muted dark:bg-muted/50 text-foreground/80 flex items-center justify-between rounded-xl px-5 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

const ZikrCardHeader = ({ children }: { children: React.ReactNode }) => {
  return <h2 className="font-bold">{children}</h2>;
};
const ZikrCardCount = ({ children }: { children: React.ReactNode }) => {
  return <p className="font-bold">{children}</p>;
};

ZikrCard.Header = ZikrCardHeader;
ZikrCard.Count = ZikrCardCount;

export default ZikrCard;
