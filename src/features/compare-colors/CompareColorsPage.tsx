import { ComingSoon } from "@/shared/ui/ComingSoon";

export function CompareColorsPage() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-muted">
        Sample two colors to see if they match.
      </p>
      <ComingSoon
        summary="Compares two sampled colors and says 'same' or 'different' in plain language, explaining why."
        next="Add two-color sampling on top of the color engine and describe the difference in hue and brightness."
      />
    </div>
  );
}
