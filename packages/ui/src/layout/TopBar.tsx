import type { ReactNode } from "react";
import { TooltipProvider } from "../components/tooltip";
import SettingsPanel from "./SettingsPanel";

export function TopBar({
  localeSwitcher,
}: {
  /** Host-provided locale picker (extension only — web locale comes from the URL). */
  localeSwitcher?: ReactNode;
}) {
  return (
    <div>
      <TooltipProvider>
        <SettingsPanel localeSwitcher={localeSwitcher} />
      </TooltipProvider>
    </div>
  );
}
