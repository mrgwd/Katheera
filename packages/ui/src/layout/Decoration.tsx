import { cn } from "@workspace/lib/utils";

export default function Decoration({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-slow-spin absolute left-1/2 -z-10 aspect-square w-10/12 -translate-x-1/2 opacity-40",
        className,
      )}
    >
      <div className="absolute right-0 bottom-0 aspect-square w-2/3 rounded-full bg-green-400 blur-3xl"></div>
      <div className="absolute top-0 right-0 aspect-square w-2/3 rounded-full bg-violet-400 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 aspect-square w-2/3 rounded-full bg-purple-400 blur-3xl"></div>
      <div className="absolute top-0 left-0 aspect-square w-2/3 rounded-full bg-red-400 blur-3xl"></div>
    </div>
  );
}
