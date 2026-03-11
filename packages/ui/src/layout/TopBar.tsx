import { ModeToggle } from "./ModeToggle";

export function TopBar() {
  return (
    <div className="relative">
      <div className="absolute top-0 z-50 flex w-full -translate-y-2 justify-center rounded-full pt-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
        <ModeToggle />
      </div>
    </div>
  );
}
