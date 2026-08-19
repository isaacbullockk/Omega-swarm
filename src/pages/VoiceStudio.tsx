import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Mic,
  Play,
  Pause,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Wand2,
  Volume2,
  Loader2,
  X,
  Check,
  Music,
  Type,
  Settings,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Copy,
  Download,
  Save,
  FileText,
  Headphones,
  Radio,
  Mic2,
} from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VoiceSample {
  id: string;
  name: string;
  text: string;
  audioUrl?: string;
  duration?: number;
  status: "recording" | "processing" | "ready" | "error";
  createdAt: string;
}

interface VoiceProject {
  id: string;
  name: string;
  description: string;
  samples: VoiceSample[];
  status: "draft" | "training" | "ready" | "error";
  createdAt: string;
  updatedAt: string;
}

interface VoiceSettings {
  stability: number;
  clarity: number;
  speed: number;
  pitch: number;
}

/* ------------------------------------------------------------------ */
/*  Sub-components (memoized)                                          */
/* ------------------------------------------------------------------ */

const VoiceCard = memo(function VoiceCard({
  sample,
  isPlaying,
  onPlay,
  onDelete,
  onMove,
}: {
  sample: VoiceSample;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  return (
    <div
      className="group relative rounded-xl p-4 transition-all"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ background: "var(--bg-elevated)" }}
        >
          {sample.status === "recording" ? (
            <Mic className="size-4 animate-pulse" style={{ color: "#EF4444" }} />
          ) : sample.status === "processing" ? (
            <Loader2 className="size-4 animate-spin" style={{ color: "var(--accent-primary)" }} />
          ) : (
            <Headphones className="size-4" style={{ color: "var(--accent-primary)" }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {sample.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {sample.text.slice(0, 60)}...
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPlay}
            disabled={sample.status !== "ready"}
            className="flex size-8 items-center justify-center rounded-lg transition-colors"
            style={{
              background: isPlaying ? "var(--accent-primary)" : "var(--bg-elevated)",
              color: isPlaying ? "#0C0A09" : "var(--text-muted)",
              cursor: sample.status === "ready" ? "pointer" : "not-allowed",
            }}
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button
            onClick={onDelete}
            className="flex size-8 items-center justify-center rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            style={{
              background: "var(--bg-elevated)",
              color: "#EF4444",
            }}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {sample.duration && (
        <div className="mt-2 flex items-center gap-2">
          <Volume2 className="size-3" style={{ color: "var(--text-muted)" }} />
          <div className="flex-1 h-1 rounded-full" style={{ background: "var(--bg-elevated)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: isPlaying ? "100%" : "0%",
                background: "var(--accent-primary)",
                transitionDuration: isPlaying ? `${sample.duration}s` : "0.3s",
              }}
            />
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {Math.floor(sample.duration / 60)}:{(sample.duration % 60).toString().padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function VoiceStudio() {
  const [projects, setProjects] = useState<VoiceProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordingText, setRecordingText] = useState("");
  const [recordingName, setRecordingName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    clarity: 0.7,
    speed: 1.0,
    pitch: 0.0,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  const escHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const { data: voiceProjects, isLoading } = trpc.voice.listProjects.useQuery();
  const createProject = trpc.voice.createProject.useMutation({
    onSuccess: () => {
      toast.success("Voice project created successfully");
      setShowNewProject(false);
      setNewProjectName("");
      setNewProjectDescription("");
    },
  });
  const deleteProject = trpc.voice.deleteProject.useMutation({
    onSuccess: () => {
      toast.success("Voice project deleted");
      setShowConfirm(false);
      setItemToDelete(null);
    },
  });

  /* ---- Memoized selected project ---- */
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) ?? null;
  }, [projects, selectedProjectId]);

  /* ---- Memoized sorted projects ---- */
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects]);

  /* ---- CRITICAL FIX: Stable keyboard handlers with refs ---- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedProjectId) {
        setItemToDelete(selectedProjectId);
        setShowConfirm(true);
      }
    };
    deleteHandlerRef.current = handler;
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [selectedProjectId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNewProject(false);
        setShowRecordModal(false);
        setShowSettings(false);
        setShowConfirm(false);
      }
    };
    escHandlerRef.current = handler;
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  /* ---- Cleanup timeouts on unmount ---- */
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
    };
  }, []);

  const handleCreateProject = useCallback(() => {
    if (!newProjectName.trim()) return;
    createProject.mutate({
      name: newProjectName.trim(),
      description: newProjectDescription.trim(),
    });
  }, [newProjectName, newProjectDescription, createProject]);

  const handleDeleteProject = useCallback(() => {
    if (!itemToDelete) return;
    deleteProject.mutate({ id: itemToDelete });
  }, [itemToDelete, deleteProject]);

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  }, []);

  const handleStopRecording = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);

    if (!selectedProjectId || !recordingText.trim() || !recordingName.trim()) return;

    const newSample: VoiceSample = {
      id: Date.now().toString(),
      name: recordingName.trim(),
      text: recordingText.trim(),
      duration: recordingTime,
      status: "processing",
      createdAt: new Date().toISOString(),
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProjectId
          ? { ...p, samples: [...p.samples, newSample], updatedAt: new Date().toISOString() }
          : p
      )
    );

    setTimeout(() => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProjectId
            ? {
                ...p,
                samples: p.samples.map((s) =>
                  s.id === newSample.id ? { ...s, status: "ready" as const } : s
                ),
              }
            : p
        )
      );
      toast.success("Voice sample processed successfully");
    }, 3000);

    setShowRecordModal(false);
    setRecordingText("");
    setRecordingName("");
    setRecordingTime(0);
  }, [selectedProjectId, recordingText, recordingName, recordingTime]);

  const handlePlaySample = useCallback((sampleId: string, duration?: number) => {
    if (playingSampleId === sampleId) {
      setPlayingSampleId(null);
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
    } else {
      setPlayingSampleId(sampleId);
      if (duration) {
        playbackTimeoutRef.current = setTimeout(() => {
          setPlayingSampleId(null);
        }, duration * 1000);
      }
    }
  }, [playingSampleId]);

  const handleDeleteSample = useCallback((sampleId: string) => {
    if (!selectedProjectId) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProjectId
          ? { ...p, samples: p.samples.filter((s) => s.id !== sampleId), updatedAt: new Date().toISOString() }
          : p
      )
    );
    toast.success("Voice sample deleted");
  }, [selectedProjectId]);

  const handleMoveSample = useCallback((sampleId: string, direction: "up" | "down") => {
    if (!selectedProjectId) return;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== selectedProjectId) return p;
        const idx = p.samples.findIndex((s) => s.id === sampleId);
        if (idx === -1) return p;
        const newIdx = direction === "up" ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= p.samples.length) return p;
        const newSamples = [...p.samples];
        [newSamples[idx], newSamples[newIdx]] = [newSamples[newIdx], newSamples[idx]];
        return { ...p, samples: newSamples, updatedAt: new Date().toISOString() };
      })
    );
  }, [selectedProjectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
          <div className="h-64 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Voice Studio
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Record, train, and manage AI voice models
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Settings className="size-4" />
              Settings
            </button>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:brightness-110"
              style={{
                background: "var(--gradient-gold)",
                color: "#0C0A09",
              }}
            >
              <Plus className="size-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up stagger-1">
          {sortedProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className="text-left rounded-xl p-5 transition-all"
              style={{
                background: selectedProjectId === project.id ? "var(--accent-primary)15" : "var(--bg-card)",
                border: `1px solid ${selectedProjectId === project.id ? "var(--accent-primary)40" : "var(--border-subtle)"}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-10 items-center justify-center rounded-lg"
                    style={{ background: "var(--accent-primary)20" }}
                  >
                    <Mic className="size-5" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {project.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {project.samples.length} samples
                    </p>
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase"
                  style={{
                    background:
                      project.status === "ready"
                        ? "#22C55E22"
                        : project.status === "training"
                        ? "#F59E0B22"
                        : "var(--bg-elevated)",
                    color:
                      project.status === "ready"
                        ? "#22C55E"
                        : project.status === "training"
                        ? "#F59E0B"
                        : "var(--text-muted)",
                  }}
                >
                  {project.status}
                </span>
              </div>
              <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                {project.description}
              </p>
            </button>
          ))}
          {sortedProjects.length === 0 && (
            <div
              className="col-span-full rounded-2xl p-12 text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <Mic className="size-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No voice projects yet
              </p>
            </div>
          )}
        </div>

        {/* Selected Project */}
        {selectedProject && (
          <div className="space-y-4 animate-fade-up stagger-2">
            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    {selectedProject.name}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {selectedProject.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRecordModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:brightness-110"
                    style={{
                      background: "var(--gradient-gold)",
                      color: "#0C0A09",
                    }}
                  >
                    <Mic className="size-4" />
                    Record
                  </button>
                  <button
                    onClick={() => {
                      setItemToDelete(selectedProject.id);
                      setShowConfirm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: "#EF444420",
                      color: "#EF4444",
                      border: "1px solid #EF444440",
                    }}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Samples */}
              <div className="space-y-3">
                {selectedProject.samples.map((sample) => (
                  <VoiceCard
                    key={sample.id}
                    sample={sample}
                    isPlaying={playingSampleId === sample.id}
                    onPlay={() => handlePlaySample(sample.id, sample.duration)}
                    onDelete={() => handleDeleteSample(sample.id)}
                    onMove={(direction) => handleMoveSample(sample.id, direction)}
                  />
                ))}
                {selectedProject.samples.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                    No voice samples yet. Click Record to add your first sample.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-up"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                New Voice Project
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Voice Clone"
                    className="w-full mt-1 rounded-xl px-4 py-3 text-sm"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                    Description
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Describe your voice project..."
                    rows={3}
                    className="w-full mt-1 rounded-xl px-4 py-3 text-sm resize-none"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setShowNewProject(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || createProject.isPending}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:brightness-110"
                    style={{
                      background: "var(--gradient-gold)",
                      color: "#0C0A09",
                      cursor: newProjectName.trim() && !createProject.isPending ? "pointer" : "not-allowed",
                      opacity: newProjectName.trim() && !createProject.isPending ? 1 : 0.5,
                    }}
                  >
                    {createProject.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Create Project"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Record Modal */}
        {showRecordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-up"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="w-full max-w-lg rounded-2xl p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Record Voice Sample
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                    Sample Name
                  </label>
                  <input
                    type="text"
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="Introduction"
                    className="w-full mt-1 rounded-xl px-4 py-3 text-sm"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                    Text to Record
                  </label>
                  <textarea
                    value={recordingText}
                    onChange={(e) => setRecordingText(e.target.value)}
                    placeholder="Enter the text you want to record..."
                    rows={4}
                    className="w-full mt-1 rounded-xl px-4 py-3 text-sm resize-none"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div className="flex items-center justify-center gap-4 py-4">
                  <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: isRecording ? "#EF4444" : "var(--gradient-gold)",
                      color: "#0C0A09",
                    }}
                  >
                    {isRecording ? (
                      <>
                        <Pause className="size-4" />
                        Stop Recording ({Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")})
                      </>
                    ) : (
                      <>
                        <Mic className="size-4" />
                        Start Recording
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setShowRecordModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-up"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Voice Settings
              </h2>
              <div className="space-y-6">
                {[
                  { key: "stability" as const, label: "Stability", min: 0, max: 1, step: 0.01 },
                  { key: "clarity" as const, label: "Clarity", min: 0, max: 1, step: 0.01 },
                  { key: "speed" as const, label: "Speed", min: 0.5, max: 2, step: 0.1 },
                  { key: "pitch" as const, label: "Pitch", min: -1, max: 1, step: 0.1 },
                ].map((setting) => (
                  <div key={setting.key}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {setting.label}
                      </label>
                      <span className="text-sm font-mono" style={{ color: "var(--accent-primary)" }}>
                        {voiceSettings[setting.key].toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={setting.min}
                      max={setting.max}
                      step={setting.step}
                      value={voiceSettings[setting.key]}
                      onChange={(e) =>
                        setVoiceSettings((prev) => ({
                          ...prev,
                          [setting.key]: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                ))}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      toast.success("Voice settings saved");
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:brightness-110"
                    style={{
                      background: "var(--gradient-gold)",
                      color: "#0C0A09",
                    }}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-up"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Delete Project?
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                This will permanently delete the voice project and all its samples. This action cannot be undone.
              </p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-muted)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  disabled={deleteProject.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: "#EF4444",
                    color: "#fff",
                    cursor: deleteProject.isPending ? "not-allowed" : "pointer",
                    opacity: deleteProject.isPending ? 0.5 : 1,
                  }}
                >
                  {deleteProject.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
