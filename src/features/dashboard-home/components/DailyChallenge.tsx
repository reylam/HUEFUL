import { useMemo, useState } from "react";
import { Check, RotateCcw, Sparkles, X } from "lucide-react";
import {
  colorHarmony,
  hslToRgb,
  nameColor,
  rgbToHex,
} from "@/shared/color-engine";
import type { RgbColor } from "@/shared/color-engine";
import { useProgress } from "@/stores/progress";
import { useAwardXp } from "@/shared/progress/useAwardXp";

/*
  Daily Challenge: a small, real game that teaches color relationships. Given a
  base color, pick the swatch that is its true opposite (complement) among
  distractors. It is deterministic per day (same puzzle for everyone that day,
  and stable across reloads) via a seeded generator, so "daily" means daily, not
  "random every render".

  Winning grants XP once per day through the shared progress store, so the
  reward is real and can't be farmed by replaying. Every option is labelled with
  its color name, so the choice never depends on seeing color, and the result is
  spelled out in words with an icon.
*/

/** Deterministic day key so the puzzle is stable for the whole calendar day. */
function dayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Small seeded RNG (mulberry32) so a day's puzzle is fixed but varied. */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashDay(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Option {
  rgb: RgbColor;
  hex: string;
  name: string;
  isAnswer: boolean;
}

interface Puzzle {
  baseHex: string;
  baseName: string;
  options: Option[];
}

function buildPuzzle(): Puzzle {
  const rand = seededRandom(hashDay(dayKey()));
  const baseHue = Math.floor(rand() * 360);
  const s = 70 + Math.floor(rand() * 20);
  const l = 48 + Math.floor(rand() * 12);
  const baseRgb = hslToRgb({ h: baseHue, s, l });

  // The true answer is the complement (opposite hue), from the engine.
  const [, complement] = colorHarmony(baseRgb, "complementary");

  // Distractors: other hues that are clearly not the opposite, kept apart from
  // each other and from the answer so the puzzle is fair.
  const distractorHues = [baseHue + 40, baseHue + 90, baseHue + 300];
  const distractors = distractorHues.map((h) =>
    hslToRgb({ h: ((h % 360) + 360) % 360, s, l }),
  );

  const answer: Option = {
    rgb: complement,
    hex: rgbToHex(complement),
    name: nameColor(complement).name,
    isAnswer: true,
  };
  const rest: Option[] = distractors.map((rgb) => ({
    rgb,
    hex: rgbToHex(rgb),
    name: nameColor(rgb).name,
    isAnswer: false,
  }));

  // Shuffle answer + distractors with the same seeded RNG for a stable order.
  const options = [answer, ...rest];
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    baseHex: rgbToHex(baseRgb),
    baseName: nameColor(baseRgb).name,
    options,
  };
}

export function DailyChallenge() {
  const puzzle = useMemo(buildPuzzle, []);
  const [picked, setPicked] = useState<string | null>(null);

  // "Won today" is real state from the store: the challenge counter only moves
  // on a genuine correct answer, and we gate the XP on the day so it pays once.
  const lastActiveDay = useProgress((s) => s.lastActiveDay);
  const challengeWins = useProgress((s) => s.challengeWins);
  const award = useAwardXp();

  const [rewarded, setRewarded] = useState(false);
  const correct = picked
    ? puzzle.options.find((o) => o.hex === picked)?.isAnswer
    : undefined;

  const choose = (hex: string) => {
    if (picked) return;
    setPicked(hex);
    const option = puzzle.options.find((o) => o.hex === hex);
    if (option?.isAnswer && !rewarded) {
      setRewarded(true);
      award(15, "Daily challenge");
    }
  };

  const tryAgain = () => setPicked(null);

  return (
    <section
      aria-labelledby="challenge-heading"
      className="flex flex-col gap-4 rounded-card border border-border bg-surface-raised p-5 shadow-card"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-accent">
          <Sparkles size={17} aria-hidden />
        </span>
        <h2 id="challenge-heading" className="text-lg font-semibold text-text">
          Daily challenge
        </h2>
      </div>

      <p className="text-sm text-text-muted">
        Which color is the opposite of{" "}
        <span className="font-semibold text-text">{puzzle.baseName}</span> on the
        color wheel?
      </p>

      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-14 w-14 shrink-0 rounded-2xl border border-border"
          style={{ backgroundColor: puzzle.baseHex }}
        />
        <span className="text-sm text-text-muted">
          Opposite colors sit across from each other and contrast strongly.
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-2">
        {puzzle.options.map((o) => {
          const isPicked = picked === o.hex;
          const reveal = picked !== null;
          const showRight = reveal && o.isAnswer;
          const showWrong = reveal && isPicked && !o.isAnswer;
          return (
            <li key={o.hex}>
              <button
                type="button"
                onClick={() => choose(o.hex)}
                disabled={reveal}
                aria-label={
                  reveal
                    ? `${o.name}${o.isAnswer ? ", correct answer" : isPicked ? ", your pick, not the opposite" : ""}`
                    : `Pick ${o.name}`
                }
                className={[
                  "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors disabled:cursor-default",
                  showRight
                    ? "border-status-unripe-ink ring-1 ring-status-unripe-ink"
                    : showWrong
                      ? "border-status-danger-ink ring-1 ring-status-danger-ink"
                      : "border-border hover:bg-surface-sunken",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className="h-10 w-10 shrink-0 rounded-xl border border-border"
                  style={{ backgroundColor: o.hex }}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">
                  {o.name}
                </span>
                {showRight && (
                  <Check size={18} aria-hidden className="shrink-0 text-status-unripe-ink" />
                )}
                {showWrong && (
                  <X size={18} aria-hidden className="shrink-0 text-status-danger-ink" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {picked !== null && (
        <div aria-live="polite" className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-text">
            {correct
              ? "Correct. That is the true opposite."
              : "Not quite. The highlighted swatch is the opposite."}
          </p>
          {!correct && (
            <button
              type="button"
              onClick={tryAgain}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-2xl border border-border px-3 text-sm font-medium text-text hover:bg-surface-sunken"
            >
              <RotateCcw size={15} aria-hidden />
              Try again
            </button>
          )}
        </div>
      )}

      {lastActiveDay === dayKey() && challengeWins > 0 && rewarded && (
        <p className="text-xs text-text-muted">
          Come back tomorrow for a new challenge.
        </p>
      )}
    </section>
  );
}
