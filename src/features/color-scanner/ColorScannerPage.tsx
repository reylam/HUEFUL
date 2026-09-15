import { useId } from "react";
import { useColorSample } from "./hooks/useColorSample";
import { ColorResultCard } from "./components/ColorResultCard";

/*
  PROTOTYPE: the color is chosen with a native color input so the whole
  name-a-color flow is demoable without camera plumbing. Production would feed
  a live camera-frame sample into useColorSample; the result UI stays the same.
*/
export function ColorScannerPage() {
  const inputId = useId();
  const { hex, setHex, color } = useColorSample();

  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-muted">
        Pick or point at a color to get its name in plain language.
      </p>

      <div className="flex items-center gap-3">
        <label
          htmlFor={inputId}
          className="flex min-h-11 flex-1 items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4"
        >
          <input
            id={inputId}
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          />
          <span className="font-medium">Sample color</span>
        </label>
      </div>

      {color ? (
        <ColorResultCard color={color} />
      ) : (
        <p role="alert" className="text-status-danger">
          That doesn&apos;t look like a valid color. Try again.
        </p>
      )}
    </div>
  );
}
