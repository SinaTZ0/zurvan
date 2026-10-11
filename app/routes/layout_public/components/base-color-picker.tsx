import { PaletteIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";

/*===== Constants =====*/
/** localStorage key. root.tsx's inline script reads the same one to paint the colour before hydration. */
export const BASE_COLOR_STORAGE_KEY = "zurvan-base-color";
const DEFAULT_BASE_COLOR = "#08100d";
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

/*===== Helpers =====*/
/** Points the page at a colour. app.css derives every dark surface (page, header, cards, wells) from `--base`. */
function applyBaseColor(hex: string | null) {
  const root = document.documentElement;
  if (hex) {
    root.dataset.baseColor = "";
    root.style.setProperty("--base", hex);
    localStorage.setItem(BASE_COLOR_STORAGE_KEY, hex);
  } else {
    delete root.dataset.baseColor;
    root.style.removeProperty("--base");
    localStorage.removeItem(BASE_COLOR_STORAGE_KEY);
  }
}

/*===== Base Color Picker =====*/
/**
 * A design aid: lets the owner try any hex as the site's black and see it on the real pages. It only changes this
 * browser (localStorage); nothing is saved to the site. Once a colour is picked, the green depth in the stock palette
 * is turned off so the judgement is of the colour alone.
 */
export function BaseColorPicker() {
  const [color, setColor] = useState(DEFAULT_BASE_COLOR);
  const [draft, setDraft] = useState(DEFAULT_BASE_COLOR);
  const [customized, setCustomized] = useState(false);

  // Synced when the popover opens rather than on mount: the server render can't know the browser's saved choice,
  // and opening is the only moment the values are shown.
  const syncFromStorage = (open: boolean) => {
    if (!open) return;
    const saved = localStorage.getItem(BASE_COLOR_STORAGE_KEY);
    const valid = saved !== null && HEX_PATTERN.test(saved);
    setColor(valid ? saved : DEFAULT_BASE_COLOR);
    setDraft(valid ? saved : DEFAULT_BASE_COLOR);
    setCustomized(valid);
  };

  const choose = (hex: string) => {
    setColor(hex);
    setDraft(hex);
    setCustomized(true);
    applyBaseColor(hex);
  };

  const reset = () => {
    setColor(DEFAULT_BASE_COLOR);
    setDraft(DEFAULT_BASE_COLOR);
    setCustomized(false);
    applyBaseColor(null);
  };

  /** Accepts `#abc`, `abc`, `#aabbcc` and `aabbcc`; ignores anything else until it is a full colour. */
  const onDraftChange = (value: string) => {
    setDraft(value);
    let hex = value.trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(hex)) hex = [...hex].map((c) => c + c).join("");
    if (HEX_PATTERN.test(`#${hex}`)) choose(`#${hex.toLowerCase()}`);
  };

  return (
    <Popover onOpenChange={syncFromStorage}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label="تغییر رنگ مشکی سایت" />}>
        <PaletteIcon strokeWidth={1.7} />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 gap-3 p-3">
        <p className="font-bold">رنگ مشکی سایت</p>

        <div className="flex items-center gap-2">
          {/*------ Native picker ------*/}
          <input
            type="color"
            value={color}
            onChange={(event) => choose(event.target.value)}
            aria-label="انتخاب رنگ"
            className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
          />
          {/*------ Hex field ------*/}
          <Input
            dir="ltr"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="#0a0a0b"
            aria-label="کد هگز رنگ"
            spellCheck={false}
            className="font-mono"
          />
        </div>

        <Button variant="outline" size="sm" onClick={reset} disabled={!customized}>
          بازگشت به رنگ اصلی
        </Button>
      </PopoverContent>
    </Popover>
  );
}
