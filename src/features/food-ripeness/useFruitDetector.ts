import { useCallback, useRef, useState } from "react";

/*
  On-device fruit detector for HueRipe. It loads TensorFlow.js and the COCO-SSD
  object-detection model lazily, only when the user runs their first detection,
  so the model and tfjs ship in this route's chunk and never touch the main
  bundle. Everything runs in the browser: the photo never leaves the device.

  Honest scope: COCO-SSD is a real single-shot detector, but its vocabulary only
  includes three fruits ("banana", "apple", "orange"). We use it to LOCATE the
  fruit in the frame and crop to it, which makes the color read far more
  reliable than sampling a fixed center box. For produce COCO does not know
  (tomato, mango, avocado, strawberry) detection simply returns null and the
  caller falls back to a center-region sample, stated plainly in the UI.
*/

/** COCO classes that are fruit, mapped to our fruit ids. */
const COCO_FRUIT: Record<string, string> = {
  banana: "banana",
  apple: "apple",
  orange: "orange",
};

export interface FruitBox {
  /** Our fruit id, from the COCO label. */
  fruitId: string;
  /** The detected COCO label, for honest display. */
  label: string;
  /** Bounding box in source-pixel coordinates: [x, y, width, height]. */
  bbox: [number, number, number, number];
  /** Model confidence, 0-1. */
  score: number;
}

type Status = "idle" | "loading-model" | "detecting" | "ready" | "error";

interface CocoPrediction {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}
interface CocoModel {
  detect: (
    input: HTMLCanvasElement | HTMLImageElement,
    maxBoxes?: number,
  ) => Promise<CocoPrediction[]>;
}

export function useFruitDetector() {
  const [status, setStatus] = useState<Status>("idle");
  const modelRef = useRef<CocoModel | null>(null);

  const ensureModel = useCallback(async (): Promise<CocoModel | null> => {
    if (modelRef.current) return modelRef.current;
    setStatus("loading-model");
    try {
      // Lazy import so tfjs + the model stay in this route's chunk.
      const [tf, cocoSsd] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/coco-ssd"),
      ]);
      await tf.ready();
      const model = (await cocoSsd.load({
        base: "lite_mobilenet_v2",
      })) as unknown as CocoModel;
      modelRef.current = model;
      return model;
    } catch {
      setStatus("error");
      return null;
    }
  }, []);

  /*
    Detect the most confident fruit in a canvas. Returns the best fruit box, or
    null when the model isn't sure or COCO doesn't know this produce. A null
    result is a normal, expected outcome, not an error: the caller falls back to
    a center sample.
  */
  const detect = useCallback(
    async (canvas: HTMLCanvasElement): Promise<FruitBox | null> => {
      const model = await ensureModel();
      if (!model) return null;

      setStatus("detecting");
      try {
        const predictions = await model.detect(canvas, 20);
        const fruits = predictions
          .filter((p) => p.class in COCO_FRUIT && p.score >= 0.5)
          .sort((a, b) => b.score - a.score);

        setStatus("ready");
        if (fruits.length === 0) return null;

        const best = fruits[0];
        return {
          fruitId: COCO_FRUIT[best.class],
          label: best.class,
          bbox: best.bbox,
          score: best.score,
        };
      } catch {
        setStatus("error");
        return null;
      }
    },
    [ensureModel],
  );

  return { detect, status };
}
