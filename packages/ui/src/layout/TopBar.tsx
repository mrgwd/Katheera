import { TooltipProvider } from "../components/tooltip";
import SettingsPanel from "./SettingsPanel";

export function TopBar() {
  return (
    <div>
      <TooltipProvider>
        <SettingsPanel />
      </TooltipProvider>
    </div>
  );
}
