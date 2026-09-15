import { ComingSoon } from "@/shared/ui/ComingSoon";

export function OutfitMatchingPage() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-muted">
        Check whether two garments go together before you wear them.
      </p>
      <ComingSoon
        summary="Compares two clothing colors and says whether they match or clash, explained in plain words so you don't have to trust the color alone."
        next="Sample two garment colors with the color engine, then classify the pairing (neutral, complementary, clashing) with a text verdict and icon."
      />
    </div>
  );
}
