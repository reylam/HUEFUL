import { ComingSoon } from "@/shared/ui/ComingSoon";

export function FoodRipenessPage() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-muted">
        Point at produce to read whether it&apos;s ripe.
      </p>
      <ComingSoon
        summary="Tells you if fruit or vegetables look ripe, unripe, or overripe, with an honest 'not sure' when the reading is unreliable."
        next="Wire a camera sample into the ripeness model and render the verdict with StatusBadge (color + icon + label)."
      />
    </div>
  );
}
