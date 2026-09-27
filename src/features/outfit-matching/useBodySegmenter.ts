import { useCallback, useRef, useState } from "react";
import type { BodyPix } from "@tensorflow-models/body-pix";
import { personBox, placeDetail } from "./garment-regions";
import type { PartMap } from "./garment-regions";

/*
  On-device body segmenter for HueDrobe. It loads TensorFlow.js and the BodyPix
  model lazily, on the first scan, so tfjs and the model ship in this route's
  chunk and never touch the main bundle. Everything runs in the browser: the
  photo never leaves the device.

  BodyPix labels every pixel of a person with a body part (torso, upper leg,
  arm, face...). garment-regions.ts turns that into the top and bottom regions
  the scan reads. We use MobileNetV1 at 0.75 width with 2-byte weights, about
  2.4 MB.

  A null result means the model couldn't load or run (offline, no WebGL). The
  caller falls back to the fixed spots and says so.
*/

type Status = "idle" | "loading-model" | "segmenting" | "ready" | "error";

/** Long edge the crop around the person is scaled to for the detail pass. */
const DETAIL_EDGE = 640;

/*
  Two passes. The first, on the whole photo, finds where the person is. Someone
  standing 2 to 3 steps back fills only part of the frame, and at that scale
  BodyPix's parts are blobs: a thigh only a few model cells wide spills onto
  the floor between the legs. So the second pass runs on a crop around the
  person, scaled up, which gives every part a tight outline, and its map is
  placed back at the photo's size.
*/
export async function segmentOutfit(
  model: BodyPix,
  canvas: HTMLCanvasElement,
): Promise<PartMap> {
  const whole = await model.segmentPersonParts(canvas, {
    internalResolution: "medium",
    segmentationThreshold: 0.7,
    maxDetections: 1,
  });
  const box = personBox(whole);
  if (!box) return whole;

  const scale = DETAIL_EDGE / Math.max(box.width, box.height);
  const crop = document.createElement("canvas");
  crop.width = Math.max(1, Math.round(box.width * scale));
  crop.height = Math.max(1, Math.round(box.height * scale));
  const ctx = crop.getContext("2d");
  if (!ctx) return whole;
  ctx.drawImage(
    canvas,
    box.x,
    box.y,
    box.width,
    box.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const detail = await model.segmentPersonParts(crop, {
    internalResolution: "full",
    segmentationThreshold: 0.7,
    maxDetections: 1,
  });
  return placeDetail(canvas, box, detail);
}

export function useBodySegmenter() {
  const [status, setStatus] = useState<Status>("idle");
  // The load in flight or done, shared so back-to-back scans load it once.
  const modelRef = useRef<Promise<BodyPix | null> | null>(null);

  const ensureModel = useCallback((): Promise<BodyPix | null> => {
    if (!modelRef.current) {
      setStatus("loading-model");
      modelRef.current = (async () => {
        try {
          // Lazy import so tfjs + the model stay in this route's chunk.
          const [tf, bodyPix] = await Promise.all([
            import("@tensorflow/tfjs"),
            import("@tensorflow-models/body-pix"),
          ]);
          await tf.ready();
          return await bodyPix.load({
            architecture: "MobileNetV1",
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2,
          });
        } catch {
          // Forget the failure so the next scan tries again, e.g. back online.
          modelRef.current = null;
          return null;
        }
      })();
    }
    return modelRef.current;
  }, []);

  /* Label each pixel of the photo with a body part, at the photo's size. */
  const segment = useCallback(
    async (canvas: HTMLCanvasElement): Promise<PartMap | null> => {
      const model = await ensureModel();
      if (!model) {
        setStatus("error");
        return null;
      }

      setStatus("segmenting");
      try {
        const parts = await segmentOutfit(model, canvas);
        setStatus("ready");
        return parts;
      } catch {
        setStatus("error");
        return null;
      }
    },
    [ensureModel],
  );

  return { segment, status };
}
