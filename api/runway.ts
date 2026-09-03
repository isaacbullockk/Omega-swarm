/**
 * Omega Swarm v5.1 — Runway Video Generation
 *
 * Real text-to-video / image-to-video via the Runway API.
 * Single Bearer key (RUNWAY_API_KEY), async task + polling pattern:
 *   POST /v1/text_to_video  -> { id }
 *   GET  /v1/tasks/{id}     -> status PENDING|RUNNING|SUCCEEDED|FAILED, output urls
 *
 * Default model gen4.5 ($0.12/s, 2-10s). Hosted alternates behind the same
 * key: veo3.1_fast (audio), gemini_omni_flash (audio, 10 credits/s).
 */

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
// api.dev.runwayml.com is Runway's documented production API base (docs.dev.runwayml.com)
const RUNWAY_BASE = process.env.RUNWAY_API_BASE ?? "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = process.env.RUNWAY_VERSION ?? "2024-11-06";
const FETCH_TIMEOUT_MS = Number(process.env.RUNWAY_FETCH_TIMEOUT_MS ?? 30000);

/** Model IDs are config, not scattered through code — Runway deprecates fast. */
export const RUNWAY_MODELS = {
  QUALITY: "gen4.5", // best quality, $0.12/s, 2-10s
  AUDIO: "veo3.1_fast", // native audio, hosted Veo
} as const;

export type RunwayTaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "THROTTLED" | "CANCELLED";

export interface RunwayTask {
  id: string;
  status: RunwayTaskStatus;
  output?: string[];
  failure?: string;
  failureCode?: string;
}

export function runwayConfigured(): boolean {
  return !!RUNWAY_API_KEY;
}

function runwayHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${RUNWAY_API_KEY}`,
    "X-Runway-Version": RUNWAY_VERSION,
    "Content-Type": "application/json",
  };
}

/** Map our aspect ratios to Runway pixel ratios (gen4.5 supported set). */
export function toRunwayRatio(aspectRatio: string): "1280:720" | "720:1280" | "960:960" | "1104:832" | "832:1104" {
  switch (aspectRatio) {
    case "9:16":
      return "720:1280";
    case "3:4":
      return "832:1104";
    case "1:1":
      return "960:960";
    case "4:3":
      return "1104:832";
    case "16:9":
    default:
      return "1280:720";
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Start a video generation task. Returns the task id.
 * If startImageUrl is a public URL, uses image_to_video (first frame);
 * otherwise text_to_video.
 */
export async function startVideoTask(params: {
  prompt: string;
  aspectRatio: string;
  duration: number;
  startImageUrl?: string;
  model?: string;
}): Promise<string> {
  if (!RUNWAY_API_KEY) throw new Error("RUNWAY_API_KEY not configured");

  const model = params.model ?? RUNWAY_MODELS.QUALITY;
  // gen4.5 supports 2-10s; clamp defensively
  const duration = Math.max(2, Math.min(10, Math.round(params.duration)));
  const ratio = toRunwayRatio(params.aspectRatio);

  // Runway accepts BOTH https URLs and data URIs (data:image/png;base64,...)
  // for promptImage — so user-uploaded library assets (stored as data URLs)
  // work as first frames too.
  const isImageToVideo = !!params.startImageUrl;
  const endpoint = isImageToVideo ? `${RUNWAY_BASE}/image_to_video` : `${RUNWAY_BASE}/text_to_video`;

  const body: Record<string, unknown> = {
    model,
    promptText: params.prompt.slice(0, 1000),
    duration,
  };
  if (isImageToVideo) {
    body.promptImage = params.startImageUrl;
    // image-to-video follows the input image's aspect — ratio only for text-to-video
  } else {
    body.ratio = ratio;
  }

  const res = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: runwayHeaders(),
    body: JSON.stringify(body),
  }, FETCH_TIMEOUT_MS);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Runway start failed ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  if (!data.id || typeof data.id !== "string") {
    throw new Error("Runway returned no task id");
  }
  return data.id;
}

/** Poll a task. Never throws on task-level failure — returns status instead. */
export async function getVideoTask(taskId: string): Promise<RunwayTask> {
  if (!RUNWAY_API_KEY) throw new Error("RUNWAY_API_KEY not configured");

  const res = await fetchWithTimeout(`${RUNWAY_BASE}/tasks/${encodeURIComponent(taskId)}`, {
    headers: runwayHeaders(),
  }, FETCH_TIMEOUT_MS);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Runway poll failed ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }

  return {
    id: data.id,
    status: data.status ?? "PENDING",
    output: Array.isArray(data.output) ? data.output : undefined,
    failure: data.failure,
    failureCode: data.failureCode,
  };
}
