import { cn } from "@workspace/lib/utils";
import { Button } from "../components/button";

const ZikrCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Button size="lg" variant="secondary" className={cn("w-full", className)}>
      {children}
    </Button>
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
