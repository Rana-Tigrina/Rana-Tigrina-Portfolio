// The well watches back. Optional, and only after the visitor says yes.
// Uses the camera to notice two things: blinks, and whether the eyes are lowered.
// Everything runs in the browser (MediaPipe face landmarks). No image ever leaves the device.
import { well, emit } from "./state";

const WASM = "/mediapipe"; // copied from node_modules by the postinstall script, so it always matches the package
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Returns a function that turns the camera off again.
export async function watch(): Promise<() => void> {
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  await video.play();

  const landmarker = await FaceLandmarker.createFromOptions(await FilesetResolver.forVisionTasks(WASM), {
    baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
    runningMode: "VIDEO",
    outputFaceBlendshapes: true,
  });

  // Calibration: everyone's resting "eyes lowered" score is different (glasses, camera angle),
  // so the first two seconds, while the visitor is still looking at the button, set the baseline.
  let rest = 0;
  let samples = 0;
  let eyesShut = false;
  let running = true;

  const tick = () => {
    if (!running) return;
    const shapes = landmarker.detectForVideo(video, performance.now()).faceBlendshapes?.[0]?.categories;
    if (shapes) {
      const score = (name: string) => shapes.find((s) => s.categoryName === name)?.score ?? 0;
      const shut = (score("eyeBlinkLeft") + score("eyeBlinkRight")) / 2 > 0.5;
      if (shut && !eyesShut) emit("blink");
      eyesShut = shut;

      const down = (score("eyeLookDownLeft") + score("eyeLookDownRight")) / 2;
      if (samples < 30) rest += (down - rest) / ++samples;
      else well.gazeDown = shut ? 0 : Math.max(0, Math.min(1, (down - rest) / 0.35));
    } else {
      well.gazeDown = 0; // no face in frame
    }
    setTimeout(tick, 66); // 15 times a second is plenty and keeps laptops cool
  };
  tick();

  return () => {
    running = false;
    well.gazeDown = 0;
    stream.getTracks().forEach((track) => track.stop());
    landmarker.close();
  };
}
