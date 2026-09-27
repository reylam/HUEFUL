import { useCallback } from "react";
import { toast } from "sonner";
import { useProgress } from "@/stores/progress";
import type { XpReason } from "@/stores/progress";

/*
  The one way features grant XP. It wraps the progress store's award so every
  caller also gets the same feedback: a small "+N XP" toast for the action, and
  a distinct celebration toast for any achievement that unlocked from it. The
  store decides what is real (counters, streak, unlock rules); this hook only
  reports it.

  Motion is left to the toaster and to CSS, which already honor reduced-motion,
  so there is nothing timing-based to disable here.
*/
export function useAwardXp() {
  const award = useProgress((s) => s.award);

  return useCallback(
    (amount: number, reason: XpReason) => {
      const unlocked = award(amount, reason);

      toast.success(`+${amount} XP`, {
        description: reason,
        duration: 2200,
      });

      // Celebrate each unlock on its own so two at once both get their moment.
      for (const achievement of unlocked) {
        toast(`Achievement unlocked: ${achievement.label}`, {
          description: achievement.hint,
          icon: "🏆",
          duration: 4000,
        });
      }

      return unlocked;
    },
    [award],
  );
}
