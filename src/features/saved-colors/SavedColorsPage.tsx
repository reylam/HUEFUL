import { ComingSoon } from "@/shared/ui/ComingSoon";

export function SavedColorsPage() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-muted">
        A place for colors you've named, so you can recognize them again.
      </p>
      <ComingSoon
        summary="Saves colors you scan with their plain-language name, so you can look them up later. For example, the exact shade of a uniform or a medication."
        next="Persist saved colors (starting with local storage), list them with name + swatch + label, and allow removing an entry."
      />
    </div>
  );
}
