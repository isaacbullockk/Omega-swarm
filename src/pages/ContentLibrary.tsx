import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast as sonnerToast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Video, ImageIcon, Plus, X, Sparkles, Camera, Loader2,
  Calendar, Eye, Heart, Trash2, ExternalLink, Check,
  AlertCircle, CheckCircle2, Zap, Copy, Clock, Film,
  ArrowUpRight, Layers, RefreshCw, Download, Play,
  AtSign, Info, UploadCloud, FileImage, Link2, Music,
  Volume2, CheckSquare, Square, ChevronLeft, ChevronRight,
  Hash, GripVertical, Lightbulb
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

/* ── Download helper ── */
async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("Network error");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: open in new tab
    window.open(url, "_blank");
  }
}

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

interface UploadedAsset {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "reference";
  dataUrl?: string;
  url?: string;
  description?: string;
  tags: string[];
}

const TABS = [
  { key: "all", label: "All Content", icon: Layers },
  { key: "social", label: "Social Posts", icon: Camera },
  { key: "video", label: "Videos", icon: Video },
  { key: "asset", label: "My Assets", icon: ImageIcon },
] as const;

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Camera }> = {
  social: { label: "Social Post", color: "#EC4899", icon: Camera },
  video: { label: "Video", color: "#A855F7", icon: Video },
  ad: { label: "Ad Copy", color: "#F59E0B", icon: Sparkles },
  blog: { label: "Blog", color: "#3B82F6", icon: Copy },
  image: { label: "Image Asset", color: "#22C55E", icon: FileImage },
  audio: { label: "Audio Asset", color: "#F97316", icon: Volume2 },
  reference: { label: "Reference", color: "#64748B", icon: Link2 },
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStatus, setVideoStatus] = useState<"loading" | "ready" | "error">("loading");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h3 className="font-bold text-sm truncate pr-4">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all"><X className="size-4" style={{ color: "var(--text-muted)" }} /></button>
        </div>
        <div className="relative aspect-[9/16] max-h-[70vh] bg-black flex items-center justify-center">
          {videoStatus === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <Loader2 className="size-8 animate-spin mb-3" style={{ color: "#A855F7" }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading video...</p>
            </div>
          )}
          {videoStatus === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
              <Film className="size-10 mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Video not ready yet</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>AI-generated videos may take 30-60 seconds to render on first load. The URL is valid — try downloading or refreshing.</p>
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="mt-4 px-4 py-2 rounded-xl text-xs font-bold" style={{ background: "#A855F7", color: "#fff" }}>
                Open Video Directly
              </a>
            </div>
          )}
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full"
            style={{ maxHeight: "70vh", opacity: videoStatus === "ready" ? 1 : 0 }}
            onLoadedData={() => setVideoStatus("ready")}
            onError={() => setVideoStatus("error")}
          />
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
function ContentCard({ item, onView, onDelete, index }: {
  item: ContentItem; onView: (item: ContentItem) => void; onDelete: (item: ContentItem) => void; index: number;
}) {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.social;
  const Icon = config.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        animationDelay: `${index * 80}ms`,
        animation: "fadeUp 0.6s ease-out forwards",
        opacity: 0,
      }}
    >
      <div className="relative aspect-square overflow-hidden bg-black/40">
        {item.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-elevated)" }}>
            {item.thumbnailUrl ? (
              <SmartImage src={item.thumbnailUrl} alt={item.title} className="absolute inset-0" />
            ) : (
              <Video className="size-12 opacity-20" style={{ color: config.color }} />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <button onClick={() => onView(item)} className="flex items-center justify-center size-14 rounded-full transition-all hover:scale-110" style={{ background: `${config.color}dd`, backdropFilter: "blur(4px)" }}>
                <Play className="size-6 fill-current text-white ml-1" />
              </button>
            </div>
          </div>
        ) : item.imageUrl ? (
          <SmartImage src={item.imageUrl} alt={item.title} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-elevated)" }}>
            <Icon className="size-12 opacity-20" style={{ color: config.color }} />
          </div>
        )}
        {/* Status badge */}
        {(item.status || item.instagramPostId) && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: item.instagramPostId ? "rgba(6,182,212,0.2)" : "rgba(132,204,22,0.2)",
              color: item.instagramPostId ? "#06B6D4" : "#84CC16",
              backdropFilter: "blur(8px)",
            }}>
            {item.instagramPostId ? (
              <><Check className="size-3" />Posted</>
            ) : (
              <><Clock className="size-3" />{item.status}</>
            )}
          </div>
        )}
        {/* Hover overlay with actions */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"} flex items-center justify-center gap-2`}
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <button onClick={() => onView(item)} className="p-3 rounded-xl transition-all hover:scale-110" style={{ background: `${config.color}dd` }}>
            {item.type === "video" ? <Play className="size-5 text-white" /> : <Eye className="size-5 text-white" />}
          </button>
          {(item.imageUrl || item.videoUrl) && (
            <button
              onClick={() => {
                const url = item.imageUrl || item.videoUrl!;
                const ext = item.type === "video" ? "mp4" : "jpg";
                downloadFile(url, `${item.title.slice(0, 30).replace(/[^a-z0-9]/gi, "_")}.${ext}`);
              }}
              className="p-3 rounded-xl transition-all hover:scale-110"
              style={{ background: "rgba(34,197,94,0.8)" }}
            >
              <Download className="size-5 text-white" />
            </button>
          )}
          <button onClick={() => onDelete(item)} className="p-3 rounded-xl transition-all hover:scale-110" style={{ background: "rgba(239,68,68,0.8)" }}>
            <Trash2 className="size-5 text-white" />
          </button>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="size-3" style={{ color: config.color }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color }}>{config.label}</span>
        </div>
        <h3 className="text-sm font-semibold leading-tight line-clamp-2" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
        <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
          <div className="flex items-center gap-1">
            <Calendar className="size-3" />
            {new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </div>
          {(item.likes || item.comments) && (
            <div className="flex items-center gap-2">
              {item.likes !== undefined && (
                <span className="flex items-center gap-0.5">
                  <Heart className="size-3" />{item.likes}
                </span>
              )}
              {item.comments !== undefined && (
                <span className="flex items-center gap-0.5">
                  <AtSign className="size-3" />{item.comments}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Asset Card (for My Assets tab) ── */
function AssetCard({ asset, onSelect, selected }: {
  asset: UploadedAsset; onSelect: (id: string) => void; selected: boolean;
}) {
  const typeConfig: Record<string, { icon: typeof FileImage; color: string }> = {
    image: { icon: FileImage, color: "#22C55E" },
    video: { icon: Film, color: "#A855F7" },
    audio: { icon: Volume2, color: "#F97316" },
    reference: { icon: Link2, color: "#64748B" },
  };
  const tc = typeConfig[asset.type] || typeConfig.reference;
  const Icon = tc.icon;

  return (
    <div
      onClick={() => onSelect(asset.id)}
      className="group relative rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
      style={{
        background: "var(--bg-card)",
        border: selected ? `2px solid ${tc.color}` : "1px solid var(--border-subtle)",
      }}
    >
      {/* Select indicator */}
      <div className="absolute top-2 left-2 z-10">
        {selected ? (
          <div className="size-5 rounded-md flex items-center justify-center" style={{ background: tc.color }}>
            <Check className="size-3 text-white" />
          </div>
        ) : (
          <div className="size-5 rounded-md border-2" style={{ borderColor: "var(--border-subtle)", background: "rgba(0,0,0,0.3)" }} />
        )}
      </div>

      <div className="aspect-square overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
        {asset.type === "image" && asset.dataUrl ? (
          <img src={asset.dataUrl} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Icon className="size-10" style={{ color: tc.color, opacity: 0.4 }} />
            <span className="text-[10px] uppercase font-bold" style={{ color: tc.color }}>{asset.type}</span>
          </div>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{asset.name}</p>
        {asset.description && (
          <p className="text-[10px] line-clamp-2" style={{ color: "var(--text-muted)" }}>{asset.description}</p>
        )}
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Create Modal ── */
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [mode, setMode] = useState<"post" | "video" | "asset">("post");
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState<"image" | "video" | "audio" | "reference">("image");
  const [assetUrl, setAssetUrl] = useState("");
  const [assetDesc, setAssetDesc] = useState("");
  const [assetTags, setAssetTags] = useState("");
  const [imageProvider, setImageProvider] = useState<"pollinations" | "openai">("pollinations");
  const [videoProvider, setVideoProvider] = useState<"pollinations" | "kling">("pollinations");
  const [brandVoice, setBrandVoice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ContentItem | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined);
  const [activeAssetTab, setActiveAssetTab] = useState<"upload" | "select">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const createPost = trpc.post.create.useMutation({
    onSuccess: (data) => {
      setPreview(data);
      setPreviewImageUrl(data.imageUrl ?? undefined);
      utils.post.list.invalidate();
      utils.analytics.invalidate();
      sonnerToast.success("Content created!");
      onCreated();
    },
    onError: (err) => sonnerToast.error(err.message),
  });
  const createVideo = trpc.video.create.useMutation({
    onSuccess: (data) => {
      setPreview(data as unknown as ContentItem);
      utils.video.list.invalidate();
      sonnerToast.success("Video queued!");
      onCreated();
    },
    onError: (err) => sonnerToast.error(err.message),
  });
  const uploadAsset = trpc.asset.upload.useMutation({
    onSuccess: () => {
      utils.asset.list.invalidate();
      sonnerToast.success("Asset uploaded!");
      setAssetName(""); setAssetUrl(""); setAssetDesc(""); setAssetTags("");
      setActiveAssetTab("select");
    },
    onError: (err) => sonnerToast.error(err.message),
  });
  const { data: userAssets } = trpc.asset.list.useQuery();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      uploadAsset.mutate({
        name: file.name,
        type: assetType,
        dataUrl,
        description: assetDesc || undefined,
        tags: assetTags.split(",").map((t) => t.trim()).filter(Boolean),
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleAsset = (id: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedAssets = (userAssets ?? [])
      .filter((a) => selectedAssetIds.has(a.id))
      .map((a) => ({ name: a.name, url: a.url, dataUrl: a.dataUrl, description: a.description }));

    try {
      if (mode === "post") {
        await createPost.mutateAsync({
          topic: topic || "New social post",
          brandVoice: brandVoice || undefined,
          imageProvider,
          referenceAssets: selectedAssets,
        });
      } else if (mode === "video") {
        await createVideo.mutateAsync({
          prompt: prompt || "Creative video content",
          provider: videoProvider,
          duration: 5,
          aspectRatio: "9:16",
          referenceAssets: selectedAssets,
        });
      } else if (mode === "asset") {
        if (fileInputRef.current?.files?.[0]) {
          const file = fileInputRef.current.files[0];
          const reader = new FileReader();
          reader.onload = () => {
            uploadAsset.mutate({
              name: assetName || file.name,
              type: assetType,
              dataUrl: reader.result as string,
              url: assetUrl || undefined,
              description: assetDesc || undefined,
              tags: assetTags.split(",").map((t) => t.trim()).filter(Boolean),
            });
          };
          reader.readAsDataURL(file);
        } else if (assetUrl) {
          uploadAsset.mutate({
            name: assetName || "Reference",
            type: assetType,
            url: assetUrl,
            description: assetDesc || undefined,
            tags: assetTags.split(",").map((t) => t.trim()).filter(Boolean),
          });
        }
      }
    } catch (err: any) {
      sonnerToast.error(err?.message || "Failed to create content");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || (mode === "post" && !topic) || (mode === "video" && !prompt) || (mode === "asset" && !assetName && !assetUrl && !fileInputRef.current?.files?.[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", backdropFilter: "blur(12px)" }}>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Sparkles className="size-5" style={{ color: "#F59E0B" }} />
            {preview ? "Content Preview" : "Create New Content"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all"><X className="size-5" style={{ color: "var(--text-muted)" }} /></button>
        </div>

        {preview ? (
          <div className="p-5 space-y-4">
            {/* Preview image */}
            {previewImageUrl && (
              <div className="rounded-2xl overflow-hidden aspect-square">
                <SmartImage src={previewImageUrl} alt={preview.title} className="w-full h-full object-cover" />
              </div>
            )}
            {/* Preview video */}
            {preview.videoUrl && (
              <div className="rounded-2xl overflow-hidden aspect-[9/16] bg-black flex items-center justify-center">
                <video
                  src={preview.videoUrl}
                  controls
                  className="w-full h-full"
                  poster={preview.thumbnailUrl}
                />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>{preview.title}</h3>
              {preview.caption && (
                <div className="rounded-xl p-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: "var(--bg-elevated)" }}>
                  {preview.caption}
                </div>
              )}
              {(preview.imageUrl || preview.videoUrl) && (
                <button
                  onClick={() => {
                    const url = preview.imageUrl || preview.videoUrl!;
                    const ext = preview.type === "video" ? "mp4" : "jpg";
                    downloadFile(url, `${preview.title.slice(0, 30).replace(/[^a-z0-9]/gi, "_")}.${ext}`);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ background: "#22C55E", color: "#fff" }}
                >
                  <Download className="size-4" /> Download {preview.type === "video" ? "Video" : "Image"}
                </button>
              )}
              {preview.videoUrl && (
                <a href={preview.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#A855F7" }}>
                  <ExternalLink className="size-4" /> Open Video
                </a>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09" }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Mode Tabs */}
            <div className="flex gap-2">
              {([
                { key: "post", label: "Social Post", icon: Camera },
                { key: "video", label: "AI Video", icon: Video },
                { key: "asset", label: "Upload Asset", icon: UploadCloud },
              ] as const).map((m) => (
                <button key={m.key} type="button" onClick={() => setMode(m.key as any)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === m.key ? "ring-2" : ""}`}
                  style={{
                    background: mode === m.key ? "var(--bg-elevated)" : "transparent",
                    color: mode === m.key ? "var(--text-primary)" : "var(--text-muted)",
                    ringColor: mode === m.key ? "#F59E0B" : "transparent",
                  }}>
                  <m.icon className="size-4" />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Content Fields */}
            {mode === "post" && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Topic / Prompt</label>
                  <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Describe what you want to create... (e.g. 'New product launch for skincare brand')" rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none transition-all"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Brand Voice (Optional)</label>
                  <input value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} placeholder="e.g., playful, professional, edgy..." className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Image Provider</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setImageProvider("pollinations")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${imageProvider === "pollinations" ? "ring-1" : ""}`}
                      style={{ background: imageProvider === "pollinations" ? "var(--bg-elevated)" : "transparent", color: imageProvider === "pollinations" ? "var(--text-primary)" : "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                      Pollinations (Free)
                    </button>
                    <button type="button" onClick={() => setImageProvider("openai")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${imageProvider === "openai" ? "ring-1" : ""}`}
                      style={{ background: imageProvider === "openai" ? "var(--bg-elevated)" : "transparent", color: imageProvider === "openai" ? "var(--text-primary)" : "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                      OpenAI DALL-E (Fast)
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === "video" && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Video Prompt</label>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your video scene... (e.g. 'A serene mountain landscape at sunset with gentle clouds')" rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none transition-all"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Video Provider</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setVideoProvider("pollinations")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${videoProvider === "pollinations" ? "ring-1" : ""}`}
                      style={{ background: videoProvider === "pollinations" ? "var(--bg-elevated)" : "transparent", color: videoProvider === "pollinations" ? "var(--text-primary)" : "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                      Pollinations (Free)
                    </button>
                    <button type="button" onClick={() => setVideoProvider("kling")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${videoProvider === "kling" ? "ring-1" : ""}`}
                      style={{ background: videoProvider === "kling" ? "var(--bg-elevated)" : "transparent", color: videoProvider === "kling" ? "var(--text-primary)" : "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                      Kling AI (Premium)
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === "asset" && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Asset Type</label>
                  <div className="flex gap-2">
                    {(["image", "video", "audio", "reference"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setAssetType(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${assetType === t ? "ring-1" : ""}`}
                        style={{ background: assetType === t ? "var(--bg-elevated)" : "transparent", color: assetType === t ? "var(--text-primary)" : "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Asset Name</label>
                  <input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g., Product photo, Demo clip, Style reference" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Upload File or Enter URL</label>
                  <div className="space-y-3">
                    <input ref={fileInputRef} type="file" accept={assetType === "image" ? "image/*" : assetType === "video" ? "video/*" : assetType === "audio" ? "audio/*" : "*/*"}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-amber-500/15 file:text-amber-400 hover:file:bg-amber-500/25"
                      style={{ color: "var(--text-primary)" }} />
                    <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>— or —</p>
                    <input value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} placeholder={`https://example.com/${assetType}`} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Description (Optional)</label>
                  <textarea value={assetDesc} onChange={(e) => setAssetDesc(e.target.value)} placeholder="Describe what this asset shows, so AI can use it as reference" rows={2} className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Tags (comma-separated)</label>
                  <input value={assetTags} onChange={(e) => setAssetTags(e.target.value)} placeholder="product, style, background, portrait..." className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
                </div>
              </>
            )}

            {/* Reference Assets Section (for post & video) */}
            {(mode === "post" || mode === "video") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Reference Assets
                  </label>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {selectedAssetIds.size > 0 ? `${selectedAssetIds.size} selected` : "None selected"}
                  </span>
                </div>
                {!userAssets || userAssets.length === 0 ? (
                  <div className="p-4 rounded-xl text-center" style={{ background: "var(--bg-elevated)", border: "1px dashed var(--border-subtle)" }}>
                    <UploadCloud className="size-6 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>No assets yet. Switch to "Upload Asset" tab to add reference photos, style guides, or inspiration.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                      {userAssets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} selected={selectedAssetIds.has(asset.id)} onSelect={toggleAsset} />
                      ))}
                    </div>
                    {selectedAssetIds.size > 0 && (
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        AI will use selected assets as reference for style, content, and composition.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitDisabled}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: isSubmitDisabled ? "var(--bg-elevated)" : "linear-gradient(135deg, #F59E0B, #F97316)", color: isSubmitDisabled ? "var(--text-muted)" : "#0C0A09", opacity: isSubmitDisabled ? 0.5 : 1 }}
              >
                {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Creating...</> : <><Sparkles className="size-4" /> Create {mode === "post" ? "Post" : mode === "video" ? "Video" : "Asset"}</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN CONTENT LIBRARY PAGE
   ════════════════════════════════════════════════════════════ */
  type TabKey = "all" | "social" | "video" | "asset";

export default function ContentLibrary() {
  const [tab, setTab] = useState<TabKey>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [viewedItem, setViewedItem] = useState<ContentItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ContentItem | null>(null);
  const [videoItem, setVideoItem] = useState<ContentItem | null>(null);
  const [_, setTick] = useState(0);
  const { toasts, addToast, removeToast } = useToasts();

  const utils = trpc.useUtils();

  // Queries
  const { data: socialStatus } = trpc.social.status.useQuery({ platform: "instagram" }, { retry: false });
  const isInstagramConnected = (socialStatus?.connected ?? 0) > 0;

  const { data: posts, isLoading: postsLoading } = trpc.post.list.useQuery(undefined, { refetchOnMount: true, staleTime: 0 });
  const { data: videos, isLoading: videosLoading } = trpc.video.list.useQuery(undefined, { refetchOnMount: true, staleTime: 0 });
  const { data: assets, isLoading: assetsLoading } = trpc.asset.list.useQuery();
  const { data: brandVoice } = trpc.brandVoice.get.useQuery();

  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => { utils.post.list.invalidate(); utils.content.list.invalidate(); utils.analytics.invalidate(); addToast("Post deleted", "success"); setDeleteItem(null); },
    onError: (err) => { addToast(err.message, "error"); setDeleteItem(null); },
  });
  const deleteVideo = trpc.video.delete.useMutation({
    onSuccess: () => { utils.video.list.invalidate(); utils.content.list.invalidate(); utils.analytics.invalidate(); addToast("Video deleted", "success"); setDeleteItem(null); },
    onError: (err) => { addToast(err.message, "error"); setDeleteItem(null); },
  });
  const deleteAsset = trpc.asset.delete.useMutation({
    onSuccess: () => { utils.asset.list.invalidate(); addToast("Asset deleted", "success"); setDeleteItem(null); },
    onError: (err) => { addToast(err.message, "error"); setDeleteItem(null); },
  });

  // Force re-render every 10s for polling
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(i);
  }, []);

  const allContent = useMemo<ContentItem[]>(() => {
    const items: ContentItem[] = [];
    if (posts) {
      for (const p of posts) {
        items.push({
          id: p.id,
          title: `AI Post: ${p.title}`,
          caption: p.caption ?? undefined,
          type: "social",
          status: p.status as any,
          date: p.date,
          imageUrl: p.imageUrl ?? undefined,
          instagramPostId: p.instagramPostId ?? undefined,
          likes: p.likes ?? undefined,
          comments: p.comments ?? undefined,
          views: p.views ?? undefined,
        });
      }
    }
    if (videos) {
      for (const v of videos) {
        items.push({
          id: v.id,
          title: `AI Video: ${v.prompt ?? v.id}`,
          prompt: v.prompt ?? undefined,
          type: "video",
          status: v.status as any,
          date: v.date,
          videoUrl: v.videoUrl ?? undefined,
          thumbnailUrl: v.thumbnailUrl ?? undefined,
          duration: v.duration ?? undefined,
        });
      }
    }
    items.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return items;
  }, [posts, videos]);

  const filtered = useMemo(() => {
    return allContent.filter((item) => {
      if (tab === "social" && item.type !== "social") return false;
      if (tab === "video" && item.type !== "video") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return item.title.toLowerCase().includes(q) || (item.caption ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [allContent, tab, search]);

  const stats = useMemo(() => {
    const totalPosts = allContent.filter((c) => c.type === "social").length;
    const totalVideos = allContent.filter((c) => c.type === "video").length;
    const totalViews = allContent.reduce((sum, c) => sum + (c.views ?? 0), 0);
    const engagement = totalPosts > 0 ? Math.round(((allContent.reduce((sum, c) => sum + (c.likes ?? 0) + (c.comments ?? 0), 0)) / totalPosts) * 100) / 100 : 0;
    return { totalPosts, totalVideos, totalViews, engagement };
  }, [allContent]);

  const handleDelete = useCallback((item: ContentItem) => {
    if (item.type === "social") deletePost.mutate({ id: item.id });
    else if (item.type === "video") deleteVideo.mutate({ id: item.id });
  }, [deletePost, deleteVideo]);

  const handleView = useCallback((item: ContentItem) => {
    if (item.type === "video" && item.videoUrl) {
      setVideoItem(item);
    } else {
      setViewedItem(item);
    }
  }, []);

  const isLoading = postsLoading || videosLoading;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Content Studio
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Generate, manage, and publish AI-powered content
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Instagram Connection Status */}
            <div
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:scale-105"
              style={{
                background: isInstagramConnected ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                color: isInstagramConnected ? "#22C55E" : "#EF4444",
                border: `1px solid ${isInstagramConnected ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
              }}
              onClick={() => !isInstagramConnected && addToast("Go to Settings to connect your Instagram account", "info")}
              title={isInstagramConnected ? "Instagram connected — ready to post" : "Instagram not connected — posts will be saved for manual download"}
            >
              <div
                className="size-2 rounded-full"
                style={{
                  background: isInstagramConnected ? "#22C55E" : "#EF4444",
                  boxShadow: isInstagramConnected ? "0 0 6px #22C55E" : "0 0 6px #EF4444",
                }}
              />
              {isInstagramConnected ? "Instagram Connected" : "Not Connected"}
            </div>

            {brandVoice && (
              <div className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: "#F59E0B15", color: "#F59E0B" }}>
                <Zap className="size-3" />
                {brandVoice.name}
              </div>
            )}
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09" }}>
              <Plus className="size-4" /> Create Content
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Layers} label="Total Posts" value={stats.totalPosts} trend={stats.totalPosts > 0 ? "+12%" : undefined} color="#F59E0B" />
          <StatCard icon={Eye} label="Total Views" value={stats.totalViews} trend={stats.totalViews > 0 ? "+8%" : undefined} color="#06B6D4" />
          <StatCard icon={Heart} label="Engagement" value={stats.engagement} color="#EC4899" />
          <StatCard icon={Video} label="Videos" value={stats.totalVideos} trend={stats.totalVideos > 0 ? "+5%" : undefined} color="#A855F7" />
        </div>

        {/* ── Tabs + Search ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.key ? "shadow-sm" : ""}`}
                  style={{
                    background: tab === t.key ? "var(--accent-primary)" : "transparent",
                    color: tab === t.key ? "#fff" : "var(--text-muted)",
                  }}>
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content..." className="w-full sm:w-64 px-3 py-2 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
            <button onClick={() => { utils.post.list.invalidate(); utils.video.list.invalidate(); addToast("Refreshed", "info"); }} className="p-2 rounded-xl transition-all hover:bg-white/5" style={{ border: "1px solid var(--border-subtle)" }}>
              <RefreshCw className="size-4" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        </div>

        {/* ── Content Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <div className="aspect-square" style={{ background: "var(--bg-elevated)" }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-1/3 rounded" style={{ background: "var(--bg-elevated)" }} />
                  <div className="h-3 w-3/4 rounded" style={{ background: "var(--bg-elevated)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : tab === "asset" ? (
          /* ── My Assets Tab ── */
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>My Assets</h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Upload photos, videos, audio, and reference material for AI to use</p>
              </div>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09" }}>
                <UploadCloud className="size-3.5" /> Upload Asset
              </button>
            </div>

            {assetsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                    <div className="aspect-square" style={{ background: "var(--bg-elevated)" }} />
                    <div className="p-2 space-y-1">
                      <div className="h-2.5 w-2/3 rounded" style={{ background: "var(--bg-elevated)" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : !assets || assets.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: "var(--bg-card)", border: "1px dashed var(--border-subtle)" }}>
                <UploadCloud className="size-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>No assets yet</h3>
                <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
                  Upload photos, videos, style references, or inspiration for AI to use when generating your content. The more references, the better the output.
                </p>
                <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-xl text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09" }}>
                  <Plus className="size-4 inline mr-2" /> Upload First Asset
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {assets.map((asset) => (
                  <div key={asset.id} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                    <div className="aspect-square" style={{ background: "var(--bg-elevated)" }}>
                      {asset.type === "image" && asset.dataUrl ? (
                        <img src={asset.dataUrl} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          {asset.type === "video" && <Film className="size-8" style={{ color: "#A855F7", opacity: 0.4 }} />}
                          {asset.type === "audio" && <Volume2 className="size-8" style={{ color: "#F97316", opacity: 0.4 }} />}
                          {asset.type === "reference" && <Link2 className="size-8" style={{ color: "#64748B", opacity: 0.4 }} />}
                          <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>{asset.type}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 space-y-1">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{asset.name}</p>
                      {asset.description && <p className="text-[10px] line-clamp-2" style={{ color: "var(--text-muted)" }}>{asset.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded text-[8px]" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>#{tag}</span>
                          ))}
                        </div>
                        <button onClick={() => { setDeleteItem({ id: asset.id, title: asset.name, type: "asset", date: "" } as any); }} className="p-1 rounded hover:bg-red-500/10 transition-colors">
                          <Trash2 className="size-3" style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((item, i) => (
                <ContentCard key={item.id} item={item} index={i} onView={handleView} onDelete={(item) => setDeleteItem(item)} />
              ))}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="rounded-2xl p-12 text-center" style={{ background: "var(--bg-card)", border: "1px dashed var(--border-subtle)" }}>
                <Sparkles className="size-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  {tab === "all" ? "No content yet" : `No ${tab} content yet`}
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                  {tab === "all" ? "Create your first AI-powered post or video to get started" : `Switch to the "All" tab or create a new ${tab} item`}
                </p>
                <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09" }}>
                  <Sparkles className="size-4 inline mr-2" /> Create Your First Content
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => {}} />}

      {deleteItem && (
        <DeleteConfirmDialog
          open={!!deleteItem}
          itemTitle={deleteItem.title}
          isDeleting={deletePost.isPending || deleteVideo.isPending || deleteAsset.isPending}
          onConfirm={() => {
            if (deleteItem.type === "social") deletePost.mutate({ id: deleteItem.id });
            else if (deleteItem.type === "video") deleteVideo.mutate({ id: deleteItem.id });
            else if (deleteItem.type === "asset") deleteAsset.mutate({ id: deleteItem.id });
            else setDeleteItem(null);
          }}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      {viewedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{viewedItem.title}</h3>
              <button onClick={() => setViewedItem(null)} className="p-2 rounded-xl hover:bg-white/5 transition-all"><X className="size-4" style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <div className="p-4 space-y-4">
              {viewedItem.imageUrl && (
                <div className="rounded-2xl overflow-hidden aspect-square">
                  <SmartImage src={viewedItem.imageUrl} alt={viewedItem.title} className="w-full h-full object-cover" />
                </div>
              )}
              {(viewedItem.imageUrl || viewedItem.videoUrl) && (
                <button
                  onClick={() => {
                    const url = viewedItem.imageUrl || viewedItem.videoUrl!;
                    const ext = viewedItem.type === "video" ? "mp4" : "jpg";
                    downloadFile(url, `${viewedItem.title.slice(0, 30).replace(/[^a-z0-9]/gi, "_")}.${ext}`);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ background: "#22C55E", color: "#fff" }}
                >
                  <Download className="size-4" /> Download {viewedItem.type === "video" ? "Video" : "Image"}
                </button>
              )}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Caption</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{viewedItem.caption || "No caption available"}</p>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(viewedItem.date).toLocaleDateString()}</span>
                {viewedItem.likes !== undefined && <span className="flex items-center gap-1"><Heart className="size-3" />{viewedItem.likes}</span>}
                {viewedItem.comments !== undefined && <span className="flex items-center gap-1"><AtSign className="size-3" />{viewedItem.comments}</span>}
              </div>
              {viewedItem.instagramPostId && (
                <a href={`https://www.instagram.com/p/${viewedItem.instagramPostId}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #06B6D4, #8B5CF6)", color: "#fff" }}>
                  <ExternalLink className="size-4" /> View on Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {videoItem && videoItem.videoUrl && (
        <VideoPlayerModal videoUrl={videoItem.videoUrl} title={videoItem.title} onClose={() => setVideoItem(null)} />
      )}
    </div>
  );
}
