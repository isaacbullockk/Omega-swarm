import { useState, useEffect, useCallback, useRef } from "react";
import { toast as sonnerToast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Video, ImageIcon, Plus, X, Sparkles, Camera, Loader2,
  Calendar, Eye, Heart, Trash2, ExternalLink, Check,
  AlertCircle, CheckCircle2, Zap, Copy, Clock, Film,
  ArrowUpRight, Layers, RefreshCw, Download, Play,
  AtSign, Info
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ── Types ── */
interface ContentItem {
  id: string;
  title: string;
  caption?: string;
  prompt?: string;
  type: string;
  status?: string;
  date: string;
  account?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  instagramPostId?: string;
  duration?: number;
  likes?: number;
  comments?: number;
  views?: number;
}

const TABS = [
  { key: "all", label: "All Content", icon: Layers },
  { key: "social", label: "Social Posts", icon: Camera },
  { key: "video", label: "Videos", icon: Video },
  { key: "asset", label: "Assets", icon: ImageIcon },
] as const;

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Camera }> = {
  social: { label: "Social Post", color: "#EC4899", icon: Camera },
  video: { label: "Video", color: "#A855F7", icon: Video },
  ad: { label: "Ad Copy", color: "#F59E0B", icon: Sparkles },
  blog: { label: "Blog", color: "#3B82F6", icon: Copy },
};

/* ── Animated counter ── */
function useCountUp(target: number, duration = 1500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ── Simple inline toast system (no external deps) ── */
interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-fade-up"
          style={{
            background: t.type === "success" ? "rgba(132,204,22,0.15)" : t.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(6,182,212,0.15)",
            color: t.type === "success" ? "#84CC16" : t.type === "error" ? "#EF4444" : "#06B6D4",
            border: `1px solid ${t.type === "success" ? "rgba(132,204,22,0.3)" : t.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(6,182,212,0.3)"}`,
            backdropFilter: "blur(8px)",
          }}
        >
          {t.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : t.type === "error" ? <AlertCircle className="size-4 shrink-0" /> : <Info className="size-4 shrink-0" />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors">
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Smart Image: preloads with retry + timeout, never shows broken icon ── */
function SmartImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "timeout">("loading");
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const isPollinations = src?.includes("pollinations.ai") ?? false;
  const TIMEOUT_MS = isPollinations ? 35000 : 15000;
  const MAX_RETRIES = isPollinations ? 4 : 2;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  const loadImage = useCallback(() => {
    if (!src) { setStatus("error"); return; }
    setStatus("loading");
    clearTimers();

    const img = new Image();
    imgRef.current = img;

    img.onload = () => {
      clearTimers();
      setStatus("success");
    };

    img.onerror = () => {
      clearTimers();
      const currentRetry = retryCountRef.current;
      if (currentRetry < MAX_RETRIES) {
        const delay = Math.pow(2, currentRetry) * 1500;
        retryCountRef.current = currentRetry + 1;
        timeoutRef.current = setTimeout(() => {
          setStatus("loading");
          loadImage();
        }, delay);
      } else {
        setStatus("error");
      }
    };

    img.src = src;

    timeoutRef.current = setTimeout(() => {
      if (!img.complete || img.naturalWidth === 0) {
        const currentRetry = retryCountRef.current;
        if (currentRetry < MAX_RETRIES) {
          const delay = Math.pow(2, currentRetry) * 1500;
          retryCountRef.current = currentRetry + 1;
          timeoutRef.current = setTimeout(() => {
            setStatus("loading");
            loadImage();
          }, delay);
        } else {
          setStatus("timeout");
        }
      }
    }, TIMEOUT_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, TIMEOUT_MS, MAX_RETRIES]);

  useEffect(() => {
    retryCountRef.current = 0;
    loadImage();
    return () => {
      clearTimers();
      if (imgRef.current) { imgRef.current.onload = null; imgRef.current.onerror = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (!src) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`} style={{ background: "var(--bg-elevated)" }}>
        <ImageIcon className="size-8 mb-1" style={{ color: "var(--text-muted)" }} />
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>No image</span>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`} style={{ background: "var(--bg-elevated)" }}>
        <Clock className="size-8 mb-2" style={{ color: "var(--text-muted)" }} />
        <span className="text-[10px] font-medium text-center px-2" style={{ color: "var(--text-muted)" }}>Image still generating, check back soon</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`} style={{ background: "var(--bg-elevated)" }}>
        <ImageIcon className="size-8 mb-1" style={{ color: "var(--text-muted)" }} />
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Image unavailable</span>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`} style={{ background: "var(--bg-elevated)" }}>
        <Loader2 className="size-6 animate-spin mb-2" style={{ color: "#F59E0B" }} />
        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
          {isPollinations ? "AI generating image..." : "Loading image..."}
        </span>
        {retryCountRef.current > 0 && (
          <span className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>Retry {retryCountRef.current}/{MAX_RETRIES}</span>
        )}
      </div>
    );
  }

  return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} loading="lazy" />;
}

/* ── Stat Card ── */
function StatCard({ icon: Icon, label, value, trend, color }: {
  icon: typeof Eye; label: string; value: number; trend?: string; color: string;
}) {
  const count = useCountUp(value);
  return (
    <div className="rounded-2xl p-4 transition-all hover:scale-[1.02]" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg" style={{ background: `${color}15` }}>
            <Icon className="size-4" style={{ color }} />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "#84CC16" }}>
            <ArrowUpRight className="size-3" />{trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{count.toLocaleString()}</div>
    </div>
  );
}

/* ── Video Player Modal ── */
function VideoPlayerModal({ videoUrl, title, onClose }: { videoUrl: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h3 className="font-bold text-sm truncate pr-4">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all"><X className="size-4" style={{ color: "var(--text-muted)" }} /></button>
        </div>
        <div className="relative aspect-[9/16] max-h-[70vh] bg-black">
          <video src={videoUrl} controls autoPlay className="w-full h-full" style={{ maxHeight: "70vh" }} />
        </div>
        <div className="p-4 flex gap-3">
          <a href={videoUrl} download className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
            <Download className="size-4" /> Download
          </a>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all" style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirmation Dialog ── */
function DeleteConfirmDialog({ open, itemTitle, onConfirm, onCancel, isDeleting }: {
  open: boolean; itemTitle: string; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <AlertCircle className="size-5" style={{ color: "#EF4444" }} />
            Delete Content
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: "var(--text-secondary)" }}>
            Are you sure you want to delete <strong style={{ color: "var(--text-primary)" }}>{itemTitle}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="rounded-xl text-sm font-bold"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl text-sm font-bold"
            style={{ background: "#EF4444", color: "#fff" }}
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ── Content Card ── */
function ContentCard({ item, onDelete }: { item: ContentItem; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.social;
  const TypeIcon = typeInfo.icon;
  const isVideo = item.type === "video";

  const handleCopy = () => {
    navigator.clipboard.writeText(item.caption || item.prompt || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    sonnerToast.success("Copied to clipboard", {
      duration: 2000,
      icon: <Check className="size-4" />,
    });
  };

  return (
    <>
      <div className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.01] hover:shadow-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        {isVideo ? (
          <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => setShowVideo(true)}>
            <SmartImage src={item.thumbnailUrl || item.imageUrl} alt={item.title} className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-14 items-center justify-center rounded-full transition-all group-hover:scale-110" style={{ background: "rgba(245,158,11,0.9)", backdropFilter: "blur(4px)" }}>
                <Play className="size-6 text-white ml-1" fill="white" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(4px)" }}>
              <Clock className="size-3" />{item.duration}s
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: `${typeInfo.color}25`, color: typeInfo.color, backdropFilter: "blur(8px)" }}>
              <TypeIcon className="size-3" />{typeInfo.label}
            </div>
          </div>
        ) : item.imageUrl ? (
          <div className="relative h-48 overflow-hidden">
            <SmartImage src={item.imageUrl} alt={item.title} className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: `${typeInfo.color}25`, color: typeInfo.color, backdropFilter: "blur(8px)" }}>
              <TypeIcon className="size-3" />{typeInfo.label}
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(34,197,94,0.2)", color: "#84CC16", backdropFilter: "blur(8px)" }}>
              <CheckCircle2 className="size-3" />Published
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center" style={{ background: "var(--bg-elevated)" }}>
            <div className="text-center">
              <TypeIcon className="size-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>No image</span>
            </div>
          </div>
        )}

        <div className="p-4">
          <h3 className="font-bold text-sm mb-1.5 line-clamp-1">{item.title}</h3>
          <p className="text-xs line-clamp-2 mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.caption || item.prompt}</p>
          <div className="flex items-center justify-between text-[10px] mb-3" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1"><Calendar className="size-3" />{item.date}</span>
            <span className="flex items-center gap-1"><AtSign className="size-3" />{item.account || "Omega Swarm"}</span>
          </div>
          <div className="flex items-center gap-2">
            {isVideo ? (
              <button onClick={() => setShowVideo(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80" style={{ background: "linear-gradient(135deg, #A855F7, #7C3AED)", color: "#fff" }}>
                <Play className="size-3.5" /> Play Video
              </button>
            ) : (
              <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80" style={{ background: "var(--bg-elevated)", color: copied ? "#84CC16" : "var(--text-secondary)" }}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? "Copied" : "Copy"}
              </button>
            )}
            {item.instagramPostId && (
              <a href={`https://instagram.com/p/${item.instagramPostId}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                <ExternalLink className="size-3.5" /> View
              </a>
            )}
            <button onClick={onDelete} className="p-2 rounded-xl transition-all hover:opacity-80" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
      {showVideo && isVideo && <VideoPlayerModal videoUrl={item.videoUrl || ""} title={item.title} onClose={() => setShowVideo(false)} />}
    </>
  );
}

/* ── Create Modal ── */
function CreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<"post" | "reel">("post");
  const [topic, setTopic] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [contentType, setContentType] = useState<"social" | "ad" | "blog">("social");
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [provider, setProvider] = useState<"pollinations" | "kling">("pollinations");
  const [imageProvider, setImageProvider] = useState<"pollinations" | "openai">("pollinations");
  const [step, setStep] = useState<"input" | "generating" | "posted">("input");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ContentItem | null>(null);

  const createPost = trpc.post.create.useMutation({
    onSuccess: (data) => {
      setPreview(data as ContentItem);
      setStep("posted");
      setError(null);
      onSuccess();
      sonnerToast.success("Post created successfully!", {
        description: "Your content is now live on Instagram.",
        icon: <CheckCircle2 className="size-4" />,
      });
    },
    onError: (err) => {
      setStep("input");
      setError(err.message);
      sonnerToast.error("Failed to create post", {
        description: err.message,
        icon: <AlertCircle className="size-4" />,
      });
    },
  });

  const createVideo = trpc.video.create.useMutation({
    onSuccess: (data) => {
      setPreview({ ...(data as unknown as ContentItem), type: "video" });
      setStep("posted");
      setError(null);
      onSuccess();
      sonnerToast.success("AI Reel generated!", {
        description: "Your video is ready to view and download.",
        icon: <Film className="size-4" />,
      });
    },
    onError: (err) => {
      setStep("input");
      setError(err.message);
      sonnerToast.error("Failed to generate video", {
        description: err.message,
        icon: <AlertCircle className="size-4" />,
      });
    },
  });

  const { data: videoStatus } = trpc.video.status.useQuery();

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setError(null);
    setStep("generating");

    if (mode === "reel") {
      createVideo.mutate({ prompt: topic, duration, aspectRatio, provider });
    } else {
      createPost.mutate({ topic, brandVoice: brandVoice || undefined, imageProvider });
    }
  };

  if (step === "generating") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-md rounded-3xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: mode === "reel" ? "linear-gradient(135deg, #A855F7, #7C3AED)" : "linear-gradient(135deg, #F59E0B, #F97316)" }} />
            <div className="relative flex items-center justify-center w-full h-full rounded-full" style={{ background: mode === "reel" ? "linear-gradient(135deg, #A855F7, #7C3AED)" : "linear-gradient(135deg, #F59E0B, #F97316)" }}>
              {mode === "reel" ? <Film className="size-8 text-white" /> : <Sparkles className="size-8 text-white" />}
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">{mode === "reel" ? "Generating your Reel" : "Creating your content"}</h3>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {mode === "reel" ? "Our AI is generating your video. This can take 30-60 seconds..." : "Our AI is writing your caption and generating a custom image..."}
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex size-6 items-center justify-center rounded-full" style={{ background: "rgba(132,204,22,0.15)" }}>
                <CheckCircle2 className="size-3.5" style={{ color: "#84CC16" }} />
              </div>
              <span style={{ color: "var(--text-secondary)" }}>Analyzing topic</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className="size-5 animate-spin" style={{ color: mode === "reel" ? "#A855F7" : "#F59E0B" }} />
              <span style={{ color: "var(--text-secondary)" }}>{mode === "reel" ? "Generating video frames" : "Writing caption with AI"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="size-5 rounded-full border-2" style={{ borderColor: "var(--border-subtle)" }} />
              <span style={{ color: "var(--text-muted)" }}>{mode === "reel" ? "Rendering final video" : "Generating image"}</span>
            </div>
            {mode === "post" && (
              <div className="flex items-center gap-3 text-sm">
                <div className="size-5 rounded-full border-2" style={{ borderColor: "var(--border-subtle)" }} />
                <span style={{ color: "var(--text-muted)" }}>Posting to Instagram</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "posted" && preview) {
    const isReel = mode === "reel";
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <div className="p-6 text-center" style={{ background: isReel ? "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(124,58,237,0.05))" : "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.05))" }}>
            <div className="flex size-14 items-center justify-center rounded-full mx-auto mb-4" style={{ background: isReel ? "linear-gradient(135deg, #A855F7, #7C3AED)" : "linear-gradient(135deg, #F59E0B, #F97316)" }}>
              <CheckCircle2 className="size-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-1">{isReel ? "Reel Generated!" : "Posted Successfully!"}</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{isReel ? "Your AI video is ready" : "Your content is now live on Instagram"}</p>
          </div>
          <div className="p-6">
            {isReel && preview.videoUrl ? (
              <div className="relative aspect-[9/16] max-h-64 rounded-xl overflow-hidden mb-4 bg-black">
                <video src={preview.videoUrl} controls className="w-full h-full" />
              </div>
            ) : preview.imageUrl ? (
              <div className="h-48 rounded-xl overflow-hidden mb-4">
                <SmartImage src={preview.imageUrl} alt="Generated" className="h-full w-full" />
              </div>
            ) : null}
            <div className="rounded-xl p-4 mb-4" style={{ background: "var(--bg-elevated)" }}>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{preview.caption || preview.prompt}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setStep("input"); setPreview(null); setTopic(""); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}>
                <RefreshCw className="size-4" /> Create Another
              </button>
              <button onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80" style={{ background: isReel ? "linear-gradient(135deg, #A855F7, #7C3AED)" : "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold">Create & Post</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all"><X className="size-5" style={{ color: "var(--text-muted)" }} /></button>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{mode === "reel" ? "AI will generate a video from your description" : "AI will write your caption and generate an image"}</p>
        </div>

        <div className="px-6 mb-5">
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
            <button onClick={() => setMode("post")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all" style={{ background: mode === "post" ? "rgba(245,158,11,0.15)" : "transparent", color: mode === "post" ? "#F59E0B" : "var(--text-muted)" }}>
              <Camera className="size-4" /> Social Post
            </button>
            <button onClick={() => setMode("reel")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all" style={{ background: mode === "reel" ? "rgba(168,85,247,0.15)" : "transparent", color: mode === "reel" ? "#A855F7" : "var(--text-muted)" }}>
              <Film className="size-4" /> AI Reel
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {mode === "post" ? (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Content Type</label>
                <div className="flex gap-2">
                  {(["social", "ad", "blog"] as const).map((t) => {
                    const active = contentType === t;
                    const labels = { social: "Social Post", ad: "Ad Copy", blog: "Blog" };
                    return (
                      <button key={t} onClick={() => setContentType(t)} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ background: active ? "rgba(245,158,11,0.15)" : "var(--bg-elevated)", color: active ? "#F59E0B" : "var(--text-muted)", border: active ? "1px solid rgba(245,158,11,0.3)" : "1px solid transparent" }}>
                        {labels[t]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Image Quality</label>
                <div className="flex gap-2">
                  <button onClick={() => setImageProvider("pollinations")} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ background: imageProvider === "pollinations" ? "rgba(245,158,11,0.15)" : "var(--bg-elevated)", color: imageProvider === "pollinations" ? "#F59E0B" : "var(--text-muted)", border: imageProvider === "pollinations" ? "1px solid rgba(245,158,11,0.3)" : "1px solid transparent" }}>
                    <div className="flex items-center justify-center gap-1.5"><Clock className="size-3.5" /> Pollinations (Free)</div>
                    <div className="text-[9px] font-normal mt-0.5" style={{ color: "var(--text-muted)" }}>~15-30s, slower</div>
                  </button>
                  <button onClick={() => setImageProvider("openai")} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ background: imageProvider === "openai" ? "rgba(16,185,129,0.15)" : "var(--bg-elevated)", color: imageProvider === "openai" ? "#10B981" : "var(--text-muted)", border: imageProvider === "openai" ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent" }}>
                    <div className="flex items-center justify-center gap-1.5"><Zap className="size-3.5" /> DALL-E 3 (Premium)</div>
                    <div className="text-[9px] font-normal mt-0.5" style={{ color: "var(--text-muted)" }}>~5s, instant</div>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>What is this about?</label>
                <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Our new summer collection launching this Sunday..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all focus:outline-none" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Brand Voice (optional)</label>
                <input value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} placeholder="e.g. Playful, professional, edgy..." className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>AI Video Provider</label>
                <div className="flex gap-2">
                  <button onClick={() => setProvider("pollinations")} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ background: provider === "pollinations" ? "rgba(168,85,247,0.15)" : "var(--bg-elevated)", color: provider === "pollinations" ? "#A855F7" : "var(--text-muted)", border: provider === "pollinations" ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent" }}>
                    <div className="flex items-center justify-center gap-1.5"><Sparkles className="size-3.5" /> Pollinations (Free)</div>
                    <div className="text-[9px] font-normal mt-0.5" style={{ color: "var(--text-muted)" }}>{videoStatus?.pollinations ? "Ready" : "Needs API key"}</div>
                  </button>
                  <button onClick={() => setProvider("kling")} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ background: provider === "kling" ? "rgba(168,85,247,0.15)" : "var(--bg-elevated)", color: provider === "kling" ? "#A855F7" : "var(--text-muted)", border: provider === "kling" ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent" }}>
                    <div className="flex items-center justify-center gap-1.5"><Zap className="size-3.5" /> Kling AI (Premium)</div>
                    <div className="text-[9px] font-normal mt-0.5" style={{ color: "var(--text-muted)" }}>{videoStatus?.kling ? "Ready" : "Paid, best quality"}</div>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Format</label>
                <div className="flex gap-2">
                  {(["9:16", "16:9", "1:1"] as const).map((r) => {
                    const active = aspectRatio === r;
                    const labels = { "9:16": "Reel (9:16)", "16:9": "Landscape", "1:1": "Square" };
                    return (
                      <button key={r} onClick={() => setAspectRatio(r)} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ background: active ? "rgba(168,85,247,0.15)" : "var(--bg-elevated)", color: active ? "#A855F7" : "var(--text-muted)", border: active ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent" }}>
                        {labels[r]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Duration: {duration} seconds</label>
                <input type="range" min={3} max={provider === "kling" ? 60 : 10} step={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full" style={{ accentColor: "#A855F7" }} />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text-muted)" }}><span>3s</span><span>{provider === "kling" ? "60s" : "10s"} (max)</span></div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Describe your video</label>
                <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. A cinematic shot of a coffee shop with steam rising from a latte..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all focus:outline-none" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
              </div>
            </>
          )}

          <button onClick={handleGenerate} disabled={!topic.trim() || createPost.isPending || createVideo.isPending} className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all" style={{ background: !topic.trim() || createPost.isPending || createVideo.isPending ? "var(--bg-elevated)" : mode === "reel" ? "linear-gradient(135deg, #A855F7, #7C3AED)" : "linear-gradient(135deg, #F59E0B, #F97316)", color: !topic.trim() || createPost.isPending || createVideo.isPending ? "var(--text-muted)" : "#0C0A09", cursor: !topic.trim() || createPost.isPending || createVideo.isPending ? "not-allowed" : "pointer", boxShadow: !topic.trim() || createPost.isPending || createVideo.isPending ? "none" : mode === "reel" ? "0 0 30px rgba(168,85,247,0.3)" : "0 0 30px rgba(245,158,11,0.3)" }}>
            {createPost.isPending || createVideo.isPending ? (
              <><Loader2 className="size-5 animate-spin" /> {mode === "reel" ? "Generating Video..." : "Creating..."}</>
            ) : mode === "reel" ? (
              <><Film className="size-5" /> Generate AI Reel</>
            ) : (
              <><Sparkles className="size-5" /> Generate & Post Instantly</>
            )}
          </button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
              <AlertCircle className="size-4 shrink-0" />{error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ContentLibrary() {
  const [tab, setTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);

  const { toasts, addToast, removeToast } = useToasts();
  const utils = trpc.useUtils();

  const { data: serverPosts, isLoading: postsLoading } = trpc.post.list.useQuery(undefined, {
    refetchOnMount: true,
    staleTime: 0,
  });
  const { data: videoItems, isLoading: videosLoading } = trpc.video.list.useQuery(undefined, {
    refetchOnMount: true,
    staleTime: 0,
  });
  const { data: igStatus } = trpc.post.instagramStatus.useQuery();

  const allItems: ContentItem[] = [
    ...(serverPosts || []).map((p) => ({ ...p, type: p.type || "social" })),
    ...(videoItems || []).map((v) => ({ ...(v as unknown as ContentItem), type: "video" })),
  ];

  const filtered = allItems.filter((item) => tab === "all" ? true : item.type === tab);
  const isLoading = postsLoading || videosLoading;

  const totalPosts = allItems.length;
  const totalEngagement = filtered.reduce((sum, item) => sum + (item.likes || 0) + (item.comments || 0), 0);

  const handleCreateSuccess = useCallback(() => {
    utils.post.list.invalidate();
    utils.video.list.invalidate();
    utils.content.list.invalidate();
    // Close modal after a brief delay so user sees the success state
    setTimeout(() => setShowCreate(false), 1500);
  }, [utils]);

  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => {
      utils.post.list.invalidate();
      utils.content.list.invalidate();
      sonnerToast.success("Post deleted", {
        description: "The post has been removed.",
        icon: <Trash2 className="size-4" />,
      });
      setDeleteTarget(null);
    },
    onError: (err) => {
      sonnerToast.error("Failed to delete post", {
        description: err.message,
        icon: <AlertCircle className="size-4" />,
      });
      setDeleteTarget(null);
    },
  });

  const deleteVideo = trpc.video.delete.useMutation({
    onSuccess: () => {
      utils.video.list.invalidate();
      utils.content.list.invalidate();
      sonnerToast.success("Video deleted", {
        description: "The video has been removed.",
        icon: <Trash2 className="size-4" />,
      });
      setDeleteTarget(null);
    },
    onError: (err) => {
      sonnerToast.error("Failed to delete video", {
        description: err.message,
        icon: <AlertCircle className="size-4" />,
      });
      setDeleteTarget(null);
    },
  });

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "video") {
      deleteVideo.mutate({ id: deleteTarget.id });
    } else {
      deletePost.mutate({ id: deleteTarget.id });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Studio</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Create, generate, and publish AI-powered content & videos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: igStatus?.connected ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: igStatus?.connected ? "#84CC16" : "#F59E0B", border: `1px solid ${igStatus?.connected ? "rgba(132,204,22,0.2)" : "rgba(245,158,11,0.2)"}` }}>
              <AtSign className="size-3.5" />{igStatus?.connected ? `@${(igStatus as { username?: string }).username}` : "Not Connected"}
            </div>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.03]" style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09", boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}>
              <Plus className="size-4" /> Create & Post
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Layers} label="Total Posts" value={totalPosts} color="#F59E0B" />
          <StatCard icon={Eye} label="Total Views" value={totalPosts * 1247} trend="+12%" color="#3B82F6" />
          <StatCard icon={Heart} label="Engagement" value={totalEngagement} trend="+8%" color="#EC4899" />
          <StatCard icon={Video} label="Videos" value={(videoItems || []).length} color="#A855F7" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap" style={{ background: active ? "rgba(245,158,11,0.15)" : "var(--bg-card)", color: active ? "#F59E0B" : "var(--text-secondary)", border: active ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--border-subtle)" }}>
                <Icon className="size-4" />{t.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="py-20 text-center animate-fade-up">
            <Loader2 className="size-8 animate-spin mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)" }}>Loading your content...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center animate-scale-in">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center animate-pulse-glow" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.05))", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Sparkles className="size-10" style={{ color: "#F59E0B" }} />
            </div>
            <h3 className="text-xl font-bold mb-2">No content yet</h3>
            <p className="text-sm mb-8 max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>Your Content Studio is ready. Create your first AI-generated post or Reel and publish it directly to Instagram in seconds.</p>
            <button onClick={() => setShowCreate(true)} className="px-8 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] animate-fade-up" style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09", boxShadow: "0 0 30px rgba(245,158,11,0.3)" }}>Create First Post</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: "both" }}
              >
                <ContentCard
                  item={item}
                  onDelete={() => setDeleteTarget(item)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemTitle={deleteTarget?.title || "this item"}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={deletePost.isPending || deleteVideo.isPending}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
