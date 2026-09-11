"use client";
import { cn } from "@workspace/lib/utils";
import { useLocale, useTranslations } from "use-intl";
import { localeDir } from "@workspace/i18n/routing";
import { Button } from "../components/button";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { Info, Settings, X } from "../index";
import { Slider } from "../components/slider";
import { SETTINGS_RANGES } from "@workspace/lib/settings";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { Switch } from "../components/switch";
import { useTheme } from "next-themes";
import { Label } from "../components/label";

export default function SettingsPanel({
  localeSwitcher,
}: {
  /** Host-provided locale picker row (extension only). Hidden when absent. */
  localeSwitcher?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("app.settings");
  const handleToggle = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      // Portaled popups (select, tooltip) live outside the panel element —
      // interacting with them must not collapse the settings.
      if (
        el?.closest?.(
          '[data-slot="select-content"], [data-slot="tooltip-content"]',
        )
      ) {
        return;
      }
      if (!panelRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const id = setTimeout(
      () => document.addEventListener("pointerdown", handler),
      50,
    );
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handler);
    };
  }, [isOpen]);
  return (
    <div
      ref={panelRef}
      className={cn(
        "settings-panel-button bg-background absolute top-2 left-1/2 z-50 flex aspect-square h-9.5 -translate-x-1/2 flex-col items-center overflow-hidden rounded-xl border text-xs opacity-0 shadow-xs transition-all duration-400 group-hover:opacity-100",
        isOpen
          ? "top-0 h-54 w-full rounded-4xl pt-2 opacity-100! md:h-70"
          : "w-10",
      )}
    >
      <Button
        variant="ghost"
        onClick={handleToggle}
        aria-label={t("toggle")}
        className="hover:bg-background rounded-xl"
      >
        {isOpen ? <X /> : <Settings />}
      </Button>
      <SettingsContent
        isOpen={isOpen}
        localeSwitcher={localeSwitcher}
      />
    </div>
  );
}

function formatMinRms(value: number): string {
  if (value === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const coeff = value / Math.pow(10, exp);
  const coeffStr = Number.isInteger(coeff)
    ? coeff.toString()
    : coeff.toFixed(1);
  const supMap: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "-": "⁻",
  };
  const expStr = String(exp)
    .split("")
    .map((c) => supMap[c] ?? c)
    .join("");
  return coeffStr === "1" ? `10${expStr}` : `${coeffStr}×10${expStr}`;
}

const SettingsContent = ({
  isOpen,
  localeSwitcher,
}: {
  isOpen: boolean;
  localeSwitcher?: React.ReactNode;
}) => {
  const { settings, updateSetting } = useSettings();
  const t = useTranslations("app.settings");
  // Panel direction follows the locale (the global DirectionProvider in
  // each host handles the Base-UI direction context; the dir attribute
  // here drives CSS logical props and rtl: variants).
  const dir = localeDir(useLocale());

  const confRange = SETTINGS_RANGES["confidenceThreshold"];
  const targetRmsRange = SETTINGS_RANGES["targetRms"];
  const minRmsRange = SETTINGS_RANGES["minRms"];

  const confidenceThreshold = settings["confidenceThreshold"] as number;
  const targetRms = settings["targetRms"] as number;
  const minRms = settings["minRms"] as number;

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      dir={dir}
      className={cn(
        "h-54 w-full space-y-4 overflow-x-hidden overflow-y-auto p-2 transition-opacity duration-300 sm:h-61 sm:w-75 sm:p-4 sm:text-sm",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0!",
      )}
    >
      {localeSwitcher && (
        <div className="flex items-center justify-between gap-1.5">
          <Label className="max-sm:text-xs!">{t("language")}</Label>
          {localeSwitcher}
        </div>
      )}
      <div className="flex justify-between">
        <Label htmlFor="dark-mode" className="max-sm:text-xs!">
          {t("darkMode")}
        </Label>
        {mounted && (
          <Switch
            id="dark-mode"
            checked={isDarkMode}
            onCheckedChange={(checked: boolean) =>
              setTheme(checked ? "dark" : "light")
            }
          />
        )}
      </div>

      <div className="border-t" />

      <div className="space-y-4 pb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-1.5">
            <p className="font-medium">
              <span className="blobk">{t("confidence")} </span>
              <span className="text-muted-foreground ms-1 font-mono">
                {confidenceThreshold.toFixed(2)}
              </span>
            </p>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Info className="text-muted-foreground h-3.5 w-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="top" className="max-w-[14rem] leading-snug">
                {t("confidenceTip")}
              </TooltipContent>
            </Tooltip>
          </div>
          <Slider
            min={confRange.min}
            max={confRange.max}
            step={confRange.step}
            value={[confidenceThreshold]}
            onValueChange={(v: any) => {
              const val = Array.isArray(v) ? v[0] : v;
              if (val !== undefined) {
                updateSetting("confidenceThreshold", val);
              }
            }}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-1.5">
            <p className="font-medium">
              {t("target")}{" "}
              <span className="text-muted-foreground ms-1 font-mono">
                {targetRms.toFixed(2)}
              </span>
            </p>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Info className="text-muted-foreground h-3.5 w-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="top" className="max-w-[14rem] leading-snug">
                {t("targetTip")}
              </TooltipContent>
            </Tooltip>
          </div>
          <Slider
            min={targetRmsRange.min}
            max={targetRmsRange.max}
            step={targetRmsRange.step}
            value={[targetRms]}
            onValueChange={(v: any) => {
              const val = Array.isArray(v) ? v[0] : v;
              if (val !== undefined) {
                updateSetting("targetRms", val);
              }
            }}
          />
        </div>

        {/* Min RMS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-1.5">
            <p className="font-medium">
              {t("silence")}{" "}
              <span className="text-muted-foreground ms-1 font-mono">
                {formatMinRms(minRms)}
              </span>
            </p>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Info className="text-muted-foreground h-3.5 w-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="top" className="max-w-[14rem] leading-snug">
                {t("silenceTip")}
              </TooltipContent>
            </Tooltip>
          </div>
          <Slider
            min={minRmsRange.min}
            max={minRmsRange.max}
            step={minRmsRange.step}
            value={[minRms]}
            onValueChange={(v: any) => {
              const val = Array.isArray(v) ? v[0] : v;
              if (val !== undefined) {
                updateSetting("minRms", val);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
