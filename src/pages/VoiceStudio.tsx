import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Volume2,
  Plus,
  Play,
  Pause,
  Trash2,
  Upload,
  Mic,
  X,
  ChevronDown,
  Download,
  Wand2,
  Music,
  Clock,
  FileAudio,
  Sparkles,
  Check,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Voice {
  id: string;
  name: string;
  quality: number;
  samples: number;
  duration: string;
  createdAt: string;
  isCloned: boolean;
}

interface Generation {
  id: string;
  name: string;
  voice: string;
  duration: string;
  date: string;
}

interface UploadedSample {
  id: string;
  name: string;
  size: string;
  duration: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const INITIAL_VOICES: Voice[] = [
  { id: "v1", name: "Isaac's Voice", quality: 98, samples: 3, duration: "2:30", createdAt: "2025-07-01", isCloned: true },
  { id: "v2", name: "Brand Narrator", quality: 95, samples: 2, duration: "1:45", createdAt: "2025-07-05", isCloned: true },
  { id: "v3", name: "Kyakuwa Vocal", quality: 92, samples: 4, duration: "3:15", createdAt: "2025-07-10", isCloned: true },
];

const INITIAL_GENERATIONS: Generation[] = [
  { id: "g1", name: "Summer Campaign Voiceover", voice: "Brand Narrator", duration: "0:45", date: "2025-07-15" },
  { id: "g2", name: "Product Launch Script", voice: "Isaac's Voice", duration: "1:20", date: "2025-07-14" },
  { id: "g3", name: "Social Media Hook", voice: "Kyakuwa Vocal", duration: "0:15", date: "2025-07-13" },
  { id: "g4", name: "Brand Manifesto Read", voice: "Brand Narrator", duration: "2:10", date: "2025-07-12" },
];

/* ------------------------------------------------------------------ */
/*  Waveform Component                                                  */
/* ------------------------------------------------------------------ */

function WaveformBars({ count = 24, active = true, seed = 1, color = "var(--accent-primary)" }: { count?: number; active?: boolean; seed?: number; color?: string }) {
  const bars = Array.from({ length: count }, (_, i) => {
    const height = 30 + Math.sin((i + seed) * 1.3) * 20 + Math.cos((i + seed) * 0.7) * 15 + Math.random() * 20;
    return Math.max(12, Math.min(88, height));
  });

  return (
    <div className="flex items-center gap-[2px] h-10 w-full">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-full"
          style={{
            height: active ? `${h}%` : "20%",
            background: color,
            opacity: active ? 0.7 + Math.sin((i + seed) * 0.5) * 0.3 : 0.3,
            animation: active ? `waveformPulse 1.2s ease-in-out ${i * 0.04}s infinite alternate` : "none",
            minWidth: 2,
            maxWidth: 6,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini Waveform (compact)                                            */
/* ------------------------------------------------------------------ */

function MiniWaveform({ seed = 1, active = false }: { seed?: number; active?: boolean }) {
  const bars = Array.from({ length: 20 }, (_, i) => {
    const h = 25 + Math.sin((i + seed) * 0.9) * 18 + Math.cos((i + seed) * 1.4) * 12;
    return Math.max(15, Math.min(85, h));
  });

  return (
    <div className="flex items-center gap-[1.5px] h-6 w-20">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${h}%`,
            background: "var(--accent-primary)",
            opacity: 0.5 + (active ? 0.3 : 0),
            animation: active ? `waveformPulse 0.8s ease-in-out ${i * 0.03}s infinite alternate` : "none",
            minWidth: 1.5,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Clone Voice Modal                                                   */
/* ------------------------------------------------------------------ */

function CloneVoiceModal({
  isOpen,
  onClose,
  onClone,
}: {
  isOpen: boolean;
  onClose: () => void;
  onClone: (voice: Voice) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [samples, setSamples] = useState<UploadedSample[]>([]);
  const [isCloning, setIsCloning] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (samples.length >= 3) return;
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("audio/"));
      files.slice(0, 3 - samples.length).forEach((file) => {
        const newSample: UploadedSample = {
          id: `s_${Date.now()}_${Math.random()}`,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
          duration: `${Math.floor(Math.random() * 3 + 1)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        };
        setSamples((prev) => [...prev, newSample]);
      });
    },
    [samples.length]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || samples.length >= 3) return;
      const files = Array.from(e.target.files).filter((f) => f.type.startsWith("audio/"));
      files.slice(0, 3 - samples.length).forEach((file) => {
        const newSample: UploadedSample = {
          id: `s_${Date.now()}_${Math.random()}`,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
          duration: `${Math.floor(Math.random() * 3 + 1)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        };
        setSamples((prev) => [...prev, newSample]);
      });
    },
    [samples.length]
  );

  const removeSample = (id: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClone = () => {
    if (!name.trim()) return;
    setIsCloning(true);
    setProgress(0);
  };

  useEffect(() => {
    if (!isCloning) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsCloning(false);
          const newVoice: Voice = {
            id: `v_${Date.now()}`,
            name: name.trim(),
            quality: 95 + Math.floor(Math.random() * 5),
            samples: samples.length || 1,
            duration: "0:00",
            createdAt: new Date().toISOString().split("T")[0],
            isCloned: true,
          };
          onClone(newVoice);
          setName("");
          setDescription("");
          setSamples([]);
          onClose();
          return 100;
        }
        return p + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [isCloning, name, samples, onClone, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-in Panel */}
      <div
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l shadow-2xl"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-subtle)",
          animation: "slideInRight 0.35s ease-out forwards",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Clone New Voice
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              Upload audio samples to create a voice clone
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 px-6 py-6">
          {/* Voice Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Voice Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Voice Clone"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-amber-500"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this voice..."
              rows={3}
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-amber-500"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Upload Area */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Audio Samples{" "}
              <span style={{ color: "var(--text-muted)" }}>({samples.length}/3)</span>
            </label>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all",
                samples.length >= 3 && "pointer-events-none opacity-40"
              )}
              style={{
                borderColor: samples.length > 0 ? "var(--accent-primary)" : "var(--border-subtle)",
                background: samples.length > 0 ? "rgba(245,158,11,0.04)" : "transparent",
              }}
            >
              <Upload className="mx-auto size-8" style={{ color: "var(--accent-primary)" }} />
              <p className="mt-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Drag & drop audio files
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                MP3 or WAV, 10s - 5min per sample
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Sample Slots */}
            {samples.length > 0 && (
              <div className="mt-3 space-y-2">
                {samples.map((sample) => (
                  <div
                    key={sample.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                    style={{
                      backgroundColor: "var(--bg-card-solid)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <Music className="size-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {sample.name}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {sample.size} &middot; {sample.duration}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSample(sample.id);
                      }}
                      className="rounded p-1 transition-colors hover:bg-white/5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress */}
          {isCloning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
                  Cloning voice...
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {progress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-input)" }}>
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${progress}%`,
                    background: "var(--gradient-gold)",
                    animation: "shimmer 1.5s linear infinite",
                    backgroundSize: "200% 100%",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            onClick={handleClone}
            disabled={!name.trim() || isCloning}
            className={cn(
              "w-full rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
              name.trim() && !isCloning
                ? "opacity-100 hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/20"
                : "cursor-not-allowed opacity-40"
            )}
            style={{
              background: name.trim() && !isCloning ? "var(--gradient-gold)" : "var(--border-subtle)",
              color: name.trim() && !isCloning ? "#0C0A09" : "var(--text-muted)",
            }}
          >
            {isCloning ? "Cloning..." : "Clone Voice"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Voice Card Component                                                */
/* ------------------------------------------------------------------ */

function VoiceCard({
  voice,
  onPlay,
  onDelete,
  isPlaying,
}: {
  voice: Voice;
  onPlay: () => void;
  onDelete: () => void;
  isPlaying: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const seed = voice.id.charCodeAt(2) || 1;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative overflow-hidden rounded-xl border transition-all duration-300"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: hovered ? "var(--border-glow)" : "var(--border-subtle)",
        boxShadow: hovered ? "0 8px 32px rgba(245,158,11,0.12), 0 0 0 1px rgba(245,158,11,0.15)" : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Waveform Area */}
      <div className="relative px-4 pt-4">
        <WaveformBars count={28} active={isPlaying} seed={seed} />
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={onPlay}
            className="flex size-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
            style={{ background: "var(--gradient-gold)", color: "#0C0A09" }}
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {voice.name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: `rgba(132, 204, 22, ${voice.quality >= 95 ? 0.15 : 0.1})`,
                  color: voice.quality >= 95 ? "#84CC16" : "var(--accent-primary)",
                }}
              >
                {voice.quality}% match
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {voice.samples} sample{voice.samples !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 opacity-0 transition-all duration-200 hover:bg-red-500/10 group-hover:opacity-100"
            style={{ color: "var(--text-muted)" }}
          >
            <Trash2 className="size-3.5 hover:text-red-400" />
          </button>
        </div>

        {/* Duration & Date */}
        <div className="mt-2 flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
            <Clock className="size-3" />
            {voice.duration}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {voice.createdAt}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Voice Card                                                      */
/* ------------------------------------------------------------------ */

function AddVoiceCard({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all duration-300"
      style={{
        borderColor: hovered ? "var(--accent-primary)" : "var(--border-subtle)",
        background: hovered ? "rgba(245,158,11,0.04)" : "transparent",
        minHeight: 180,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div
        className="flex size-12 items-center justify-center rounded-full transition-all duration-300"
        style={{
          background: hovered ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.08)",
        }}
      >
        <Mic className="size-6" style={{ color: "var(--accent-primary)" }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: hovered ? "var(--accent-primary)" : "var(--text-secondary)" }}>
          Add New Voice
        </p>
        <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
          Upload audio samples to clone
        </p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Voice Selector Dropdown                                             */
/* ------------------------------------------------------------------ */

function VoiceSelector({
  voices,
  selected,
  onSelect,
}: {
  voices: Voice[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedVoice = voices.find((v) => v.id === selected);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors"
        style={{
          backgroundColor: "var(--bg-input)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
        }}
      >
        {selectedVoice ? (
          <>
            <MiniWaveform seed={selectedVoice.id.charCodeAt(2)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{selectedVoice.name}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {selectedVoice.quality}% match &middot; {selectedVoice.samples} samples
              </p>
            </div>
          </>
        ) : (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Select a voice...
          </span>
        )}
        <ChevronDown
          className="size-4 shrink-0 transition-transform"
          style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border shadow-xl"
          style={{
            backgroundColor: "var(--bg-card-solid)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {voices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => {
                onSelect(voice.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
            >
              <MiniWaveform seed={voice.id.charCodeAt(2)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
                  {voice.name}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {voice.quality}% match &middot; {voice.samples} samples
                </p>
              </div>
              {selected === voice.id && <Check className="size-4 shrink-0" style={{ color: "var(--accent-primary)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Generate Tab                                                        */
/* ------------------------------------------------------------------ */

function GenerateTab({ voices }: { voices: Voice[] }) {
  const [script, setScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(voices[0]?.id || "");
  const [stability, setStability] = useState(50);
  const [clarity, setClarity] = useState(70);
  const [style, setStyle] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<Generation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>(INITIAL_GENERATIONS);

  const handleGenerate = () => {
    if (!script.trim() || !selectedVoice) return;
    setIsGenerating(true);
    setTimeout(() => {
      const voice = voices.find((v) => v.id === selectedVoice);
      const newGen: Generation = {
        id: `g_${Date.now()}`,
        name: script.slice(0, 40) + (script.length > 40 ? "..." : ""),
        voice: voice?.name || "Unknown",
        duration: `${Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        date: new Date().toISOString().split("T")[0],
      };
      setGenerated(newGen);
      setRecentGenerations((prev) => [newGen, ...prev]);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Input */}
        <div className="space-y-4">
          {/* Script Textarea */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Script
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your script here..."
              rows={6}
              className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-500"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Voice Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Voice
            </label>
            <VoiceSelector voices={voices} selected={selectedVoice} onSelect={setSelectedVoice} />
          </div>

          {/* Settings Sliders */}
          <div className="space-y-4 rounded-lg border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Voice Settings
            </h4>

            {/* Stability */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Stability
                </span>
                <span className="text-xs font-mono" style={{ color: "var(--accent-primary)" }}>
                  {stability}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={stability}
                onChange={(e) => setStability(Number(e.target.value))}
                className="w-full accent-amber-500"
                style={{ accentColor: "var(--accent-primary)" }}
              />
            </div>

            {/* Clarity + Similarity */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Clarity + Similarity
                </span>
                <span className="text-xs font-mono" style={{ color: "var(--accent-primary)" }}>
                  {clarity}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={clarity}
                onChange={(e) => setClarity(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "var(--accent-primary)" }}
              />
            </div>

            {/* Style */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Style
                </span>
                <span className="text-xs font-mono" style={{ color: "var(--accent-primary)" }}>
                  {style}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={style}
                onChange={(e) => setStyle(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "var(--accent-primary)" }}
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!script.trim() || isGenerating}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all duration-200",
              script.trim() && !isGenerating
                ? "opacity-100 hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/20"
                : "cursor-not-allowed opacity-40"
            )}
            style={{
              background: script.trim() && !isGenerating ? "var(--gradient-gold)" : "var(--border-subtle)",
              color: script.trim() && !isGenerating ? "#0C0A09" : "var(--text-muted)",
            }}
          >
            <Wand2 className="size-4" />
            {isGenerating ? "Generating..." : "Generate Audio"}
          </button>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          {/* Generated Audio Player */}
          {generated ? (
            <div
              className="rounded-xl border p-5"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Generated Audio
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                    style={{ background: "var(--gradient-gold)", color: "#0C0A09" }}
                  >
                    {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
                  </button>
                  <button
                    className="rounded-lg p-2 transition-colors hover:bg-white/5"
                    style={{ color: "var(--text-muted)" }}
                    title="Download MP3"
                  >
                    <Download className="size-4" />
                  </button>
                </div>
              </div>

              {/* Waveform */}
              <WaveformBars count={30} active={isPlaying} seed={generated.id.charCodeAt(2)} />

              {/* Info */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{generated.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <Volume2 className="size-3" />
                    {generated.voice}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {generated.duration}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center rounded-xl border p-8"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-card)",
                minHeight: 240,
              }}
            >
              <div
                className="flex size-14 items-center justify-center rounded-full"
                style={{ background: "rgba(245,158,11,0.08)" }}
              >
                <FileAudio className="size-7" style={{ color: "var(--accent-primary)", opacity: 0.5 }} />
              </div>
              <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                Your generated audio will appear here
              </p>
            </div>
          )}

          {/* Recent Generations */}
          {recentGenerations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Recent Generations
              </h4>
              {recentGenerations.slice(0, 5).map((gen) => (
                <div
                  key={gen.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                  style={{
                    borderColor: "var(--border-subtle)",
                    backgroundColor: "var(--bg-card)",
                  }}
                >
                  <MiniWaveform seed={gen.id.charCodeAt(2)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {gen.name}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {gen.voice} &middot; {gen.duration}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="rounded p-1.5 transition-colors hover:bg-white/5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Play className="size-3" />
                    </button>
                    <button
                      className="rounded p-1.5 transition-colors hover:bg-white/5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Download className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Library Tab                                                         */
/* ------------------------------------------------------------------ */

function LibraryTab({ voices }: { voices: Voice[] }) {
  const [generations, setGenerations] = useState<Generation[]>(INITIAL_GENERATIONS);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const togglePlay = (id: string) => {
    setPlayingId((prev) => (prev === id ? null : id));
  };

  const handleDelete = (id: string) => {
    setGenerations((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="space-y-3">
      {generations.map((gen) => (
        <div
          key={gen.id}
          className="group flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-200 hover:bg-white/[0.02]"
          style={{
            borderColor: "var(--border-subtle)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          {/* Waveform */}
          <MiniWaveform seed={gen.id.charCodeAt(2)} active={playingId === gen.id} />

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {gen.name}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {gen.voice}
              </span>
              <span style={{ color: "var(--border-subtle)" }}>&middot;</span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {gen.duration}
              </span>
              <span style={{ color: "var(--border-subtle)" }}>&middot;</span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {gen.date}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => togglePlay(gen.id)}
              className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
            >
              {playingId === gen.id ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </button>
            <button
              className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
              title="Download MP3"
            >
              <Download className="size-3.5" />
            </button>
            <button
              onClick={() => handleDelete(gen.id)}
              className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
              style={{ color: "var(--text-muted)" }}
            >
              <Trash2 className="size-3.5 hover:text-red-400" />
            </button>
          </div>
        </div>
      ))}

      {generations.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-16"
          style={{
            borderColor: "var(--border-subtle)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <Music className="size-10" style={{ color: "var(--text-muted)", opacity: 0.3 }} />
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            No audio files yet
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            Generate your first audio to see it here
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main VoiceStudio Page                                               */
/* ------------------------------------------------------------------ */

export default function VoiceStudio() {
  const [activeTab, setActiveTab] = useState<"voices" | "generate" | "library">("voices");
  const [voices, setVoices] = useState<Voice[]>(INITIAL_VOICES);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handlePlayVoice = (id: string) => {
    setPlayingVoiceId((prev) => (prev === id ? null : id));
  };

  const handleDeleteVoice = (id: string) => {
    setVoices((prev) => prev.filter((v) => v.id !== id));
  };

  const handleCloneVoice = (newVoice: Voice) => {
    setVoices((prev) => [...prev, newVoice]);
  };

  const tabs = [
    { key: "voices" as const, label: "My Voices" },
    { key: "generate" as const, label: "Generate" },
    { key: "library" as const, label: "Library" },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* ── CSS Keyframes ── */}
      <style>{`
        @keyframes waveformPulse {
          0% { transform: scaleY(0.4); opacity: 0.4; }
          100% { transform: scaleY(1); opacity: 0.9; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Voice Studio
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Clone voices and generate AI-powered speech
          </p>
        </div>
        <button
          onClick={() => setShowCloneModal(true)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/20"
          style={{
            background: "var(--gradient-gold)",
            color: "#0C0A09",
          }}
        >
          <Plus className="size-4" />
          Clone Voice
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "Voices Cloned", value: voices.length.toString(), icon: Volume2 },
          { label: "Audio Files", value: "48", icon: FileAudio },
          { label: "Generated", value: "2.3hrs", icon: Clock },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-4"
            style={{
              borderColor: "var(--border-subtle)",
              backgroundColor: "var(--bg-card)",
            }}
          >
            <div className="flex items-center gap-2">
              <stat.icon className="size-4" style={{ color: "var(--accent-primary)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </span>
            </div>
            <p className="mt-1.5 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tab Navigation ── */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
              activeTab === tab.key ? "shadow-sm" : ""
            )}
            style={{
              background: activeTab === tab.key ? "rgba(245,158,11,0.12)" : "transparent",
              color: activeTab === tab.key ? "var(--accent-primary)" : "var(--text-muted)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="pb-12">
        {activeTab === "voices" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {voices.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                onPlay={() => handlePlayVoice(voice.id)}
                onDelete={() => handleDeleteVoice(voice.id)}
                isPlaying={playingVoiceId === voice.id}
              />
            ))}
            <AddVoiceCard onClick={() => setShowCloneModal(true)} />
          </div>
        )}

        {activeTab === "generate" && <GenerateTab voices={voices} />}

        {activeTab === "library" && <LibraryTab voices={voices} />}
      </div>

      {/* ── Clone Voice Modal ── */}
      <CloneVoiceModal isOpen={showCloneModal} onClose={() => setShowCloneModal(false)} onClone={handleCloneVoice} />
    </div>
  );
}
