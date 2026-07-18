import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Mic,
  Volume2,
  Zap,
  Heart,
  Briefcase,
  Smile,
  Plus,
  X,
  Check,
  RefreshCw,
  Share2,
  Mail,
  FileText,
  TrendingUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VoicePreset {
  id: string;
  name: string;
  description: string;
  sampleText: string;
  icon: typeof Zap;
  gradient: string;
}

interface SliderControl {
  id: string;
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const VOICE_PRESETS: VoicePreset[] = [
  {
    id: "bold",
    name: "Bold & Confident",
    description: "Strong, assertive, commanding",
    sampleText: "We do not follow trends. We set them. Our latest collection is not just fashion, it is a statement. Own your style. Own the room.",
    icon: Zap,
    gradient: "from-[#F59E0B] to-[#F97316]",
  },
  {
    id: "warm",
    name: "Warm & Friendly",
    description: "Approachable, genuine, inviting",
    sampleText: "Hey there! We are so excited to share our new collection with you. Every piece was crafted with love and care, and we cannot wait for you to try them on.",
    icon: Heart,
    gradient: "from-[#EC4899] to-[#F59E0B]",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Polished, authoritative, clear",
    sampleText: "We are pleased to announce the launch of our latest product line. Engineered with precision and designed for excellence, these offerings represent our commitment to quality.",
    icon: Briefcase,
    gradient: "from-[#3B82F6] to-[#06B6D4]",
  },
  {
    id: "playful",
    name: "Playful",
    description: "Fun, energetic, creative",
    sampleText: "OMG have you SEEN the new drop? It is giving EVERYTHING. Your wardrobe called and said it needs an upgrade ASAP. Let us make it happen!",
    icon: Smile,
    gradient: "from-[#A855F7] to-[#EC4899]",
  },
];

const DEFAULT_SLIDERS: SliderControl[] = [
  { id: "formality", label: "Formality", leftLabel: "Casual", rightLabel: "Formal", value: 65 },
  { id: "enthusiasm", label: "Enthusiasm", leftLabel: "Calm", rightLabel: "Energetic", value: 55 },
  { id: "technical", label: "Technical", leftLabel: "Accessible", rightLabel: "Technical", value: 40 },
  { id: "humor", label: "Humor", leftLabel: "Serious", rightLabel: "Humorous", value: 30 },
];

const WORDS_TO_USE = [
  "innovative", "crafted", "exclusive", "premium", "authentic", "curated", "bespoke", "elevated",
];

const WORDS_TO_AVOID = [
  "cheap", "basic", "generic", "bargain", "mass-produced", "ordinary",
];

const WRITING_SAMPLES = [
  {
    id: "ws1",
    title: "Social Media Post",
    context: "Instagram / TikTok",
    text: "Summer is here and so are we! Our new collection just dropped and it is everything you have been waiting for. Tap the link in bio to shop now. Your summer wardrobe upgrade starts here. #SummerVibes #NewCollection",
  },
  {
    id: "ws2",
    title: "Email Subject Line",
    context: "Marketing Email",
    text: "Your summer wardrobe is missing this one thing",
  },
  {
    id: "ws3",
    title: "Ad Headline",
    context: "Google / Facebook Ad",
    text: "Crafted for You: Premium Pieces That Define Your Style",
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ToneSlider({
  slider,
  onChange,
  index,
}: {
  slider: SliderControl;
  onChange: (id: string, value: number) => void;
  index: number;
}) {
  return (
    <div
      className="animate-stagger-in stagger-dynamic space-y-2"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {slider.leftLabel}
        </span>
        <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
          {slider.value}
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {slider.rightLabel}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ background: "var(--border-subtle)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
          style={{
            width: `${slider.value}%`,
            background: "var(--gradient-gold)",
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={slider.value}
          onChange={(e) => onChange(slider.id, Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div
          className="absolute top-1/2 size-5 -translate-y-1/2 rounded-full border-2 shadow-md transition-all duration-200 hover:scale-125"
          style={{
            left: `calc(${slider.value}% - 10px)`,
            background: "var(--accent-primary)",
            borderColor: "#0C0A09",
            boxShadow: "0 0 8px rgba(245,158,11,0.4)",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function BrandVoice() {
  const [selectedVoice, setSelectedVoice] = useState("bold");
  const [sliders, setSliders] = useState<SliderControl[]>(DEFAULT_SLIDERS);
  const [wordsToUse, setWordsToUse] = useState<string[]>(WORDS_TO_USE);
  const [wordsToAvoid, setWordsToAvoid] = useState<string[]>(WORDS_TO_AVOID);
  const [newUseWord, setNewUseWord] = useState("");
  const [newAvoidWord, setNewAvoidWord] = useState("");
  const [expandedSample, setExpandedSample] = useState<string | null>(null);

  const handleSliderChange = useCallback((id: string, value: number) => {
    setSliders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value } : s))
    );
  }, []);

  const addWord = useCallback(
    (type: "use" | "avoid") => {
      if (type === "use" && newUseWord.trim() && !wordsToUse.includes(newUseWord.trim())) {
        setWordsToUse((p) => [...p, newUseWord.trim()]);
        setNewUseWord("");
      }
      if (type === "avoid" && newAvoidWord.trim() && !wordsToAvoid.includes(newAvoidWord.trim())) {
        setWordsToAvoid((p) => [...p, newAvoidWord.trim()]);
        setNewAvoidWord("");
      }
    },
    [newUseWord, newAvoidWord, wordsToUse, wordsToAvoid]
  );

  const removeWord = useCallback((type: "use" | "avoid", word: string) => {
    if (type === "use") setWordsToUse((p) => p.filter((w) => w !== word));
    else setWordsToAvoid((p) => p.filter((w) => w !== word));
  }, []);

  // Tone summary based on sliders
  const getToneSummary = () => {
    const formality = sliders.find((s) => s.id === "formality")?.value ?? 50;
    const enthusiasm = sliders.find((s) => s.id === "enthusiasm")?.value ?? 50;
    const humor = sliders.find((s) => s.id === "humor")?.value ?? 50;

    if (formality > 70 && enthusiasm < 50) return "Your brand voice is authoritative and measured — like a trusted industry expert.";
    if (formality < 40 && enthusiasm > 70 && humor > 50) return "Your brand voice is energetic, fun, and approachable — like a charismatic friend.";
    if (formality < 40 && enthusiasm > 60) return "Your brand voice is warm, approachable, and slightly playful — like a knowledgeable friend.";
    if (formality > 60) return "Your brand voice is professional and polished — like a seasoned consultant.";
    return "Your brand voice is balanced and versatile — adaptable to any situation.";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ── */}
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Mic className="size-6" style={{ color: "var(--accent-primary)" }} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Brand Voice Studio
            </h1>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Define how your Swarm communicates with the world
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
          style={{
            borderColor: "var(--accent-primary)",
            background: "rgba(245,158,11,0.08)",
          }}
        >
          <Volume2 className="size-4" style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
            Active: {VOICE_PRESETS.find((v) => v.id === selectedVoice)?.name}
          </span>
        </div>
      </div>

      <div className="h-px" style={{ background: "var(--border-subtle)" }} />

      {/* ── Voice Selector ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Voice Preset
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VOICE_PRESETS.map((voice, i) => {
            const Icon = voice.icon;
            const active = selectedVoice === voice.id;
            return (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={cn(
                  "animate-stagger-in stagger-dynamic group relative rounded-2xl border p-5 text-left transition-all duration-300 card-lift",
                  active && "ring-1"
                )}
                style={{
                  animationDelay: `${i * 0.08}s`,
                  background: "var(--gradient-card)",
                  borderColor: active ? "var(--accent-primary)" : "var(--border-subtle)",
                  boxShadow: active ? "0 0 20px rgba(245,158,11,0.15)" : undefined,
                }}
              >
                <div
                  className={cn(
                    "mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br",
                    voice.gradient
                  )}
                >
                  <Icon className="size-5 text-white" />
                </div>
                <h3 className="mb-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {voice.name}
                </h3>
                <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  {voice.description}
                </p>
                <p className="line-clamp-2 text-xs italic leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  &ldquo;{voice.sampleText.substring(0, 80)}...&rdquo;
                </p>
                {active && (
                  <div
                    className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    <Check className="size-3.5 text-black" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Two Column: Tone + Preview ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Tone Controls */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tone Sliders */}
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "var(--gradient-card)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Tone Dimensions
              </h3>
              <button
                onClick={() => setSliders(DEFAULT_SLIDERS)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                style={{ color: "var(--text-muted)" }}
              >
                <RefreshCw className="size-3" />
                Reset
              </button>
            </div>
            <div className="space-y-6">
              {sliders.map((slider, i) => (
                <ToneSlider
                  key={slider.id}
                  slider={slider}
                  onChange={handleSliderChange}
                  index={i}
                />
              ))}
            </div>
            <div
              className="mt-6 rounded-xl border p-4"
              style={{
                background: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <p className="text-sm italic" style={{ color: "var(--text-secondary)" }}>
                {getToneSummary()}
              </p>
            </div>
          </div>

          {/* Writing Samples */}
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "var(--gradient-card)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <h3 className="mb-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Writing Samples
            </h3>
            <div className="space-y-3">
              {WRITING_SAMPLES.map((sample, i) => (
                <div
                  key={sample.id}
                  className="animate-stagger-in stagger-dynamic rounded-xl border transition-all duration-200"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    borderColor: "var(--border-subtle)",
                    background: "var(--bg-input)",
                  }}
                >
                  <button
                    onClick={() =>
                      setExpandedSample(expandedSample === sample.id ? null : sample.id)
                    }
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {sample.id === "ws1" && <Share2 className="size-4" style={{ color: "#EC4899" }} />}
                      {sample.id === "ws2" && <Mail className="size-4" style={{ color: "#F59E0B" }} />}
                      {sample.id === "ws3" && <FileText className="size-4" style={{ color: "#3B82F6" }} />}
                      <div>
                        <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {sample.title}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {sample.context}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-xs transition-transform duration-200",
                        expandedSample === sample.id && "rotate-90"
                      )}
                      style={{ color: "var(--text-muted)" }}
                    >
                      <TrendingUp className="size-4" />
                    </span>
                  </button>
                  {expandedSample === sample.id && (
                    <div
                      className="border-t px-4 py-3"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {sample.text}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vocabulary Controls */}
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "var(--gradient-card)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <h3 className="mb-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Vocabulary Preferences
            </h3>

            {/* Words to Use */}
            <div className="mb-5 space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Words to use frequently
              </label>
              <div className="flex flex-wrap gap-2">
                {wordsToUse.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(132,204,22,0.15)",
                      color: "#84CC16",
                    }}
                  >
                    {word}
                    <button
                      onClick={() => removeWord("use", word)}
                      className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/10"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newUseWord}
                  onChange={(e) => setNewUseWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWord("use")}
                  placeholder="Add a word..."
                  className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition-all focus:border-[var(--accent-primary)]"
                  style={{
                    background: "var(--bg-input)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  onClick={() => addWord("use")}
                  className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-[rgba(132,204,22,0.2)]"
                  style={{ background: "rgba(132,204,22,0.15)" }}
                >
                  <Plus className="size-4" style={{ color: "#84CC16" }} />
                </button>
              </div>
            </div>

            {/* Words to Avoid */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Words to avoid
              </label>
              <div className="flex flex-wrap gap-2">
                {wordsToAvoid.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.15)",
                      color: "#EF4444",
                    }}
                  >
                    {word}
                    <button
                      onClick={() => removeWord("avoid", word)}
                      className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/10"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAvoidWord}
                  onChange={(e) => setNewAvoidWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWord("avoid")}
                  placeholder="Add a word to avoid..."
                  className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition-all focus:border-[var(--accent-primary)]"
                  style={{
                    background: "var(--bg-input)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  onClick={() => addWord("avoid")}
                  className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-[rgba(239,68,68,0.2)]"
                  style={{ background: "rgba(239,68,68,0.15)" }}
                >
                  <Plus className="size-4" style={{ color: "#EF4444" }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-2">
          <div
            className="sticky top-6 space-y-4 rounded-2xl border p-6"
            style={{
              background: "var(--gradient-card)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Live Preview
              </h3>
              <button
                onClick={() => setSliders([...sliders])}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                style={{ color: "var(--text-muted)" }}
              >
                <RefreshCw className="size-4" />
              </button>
            </div>

            {/* Preview Card */}
            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="size-8 rounded-full"
                  style={{ background: "var(--gradient-gold)" }}
                />
                <div>
                  <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    Your Brand
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Just now
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {VOICE_PRESETS.find((v) => v.id === selectedVoice)?.sampleText}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>Like 234</span>
                <span>Comment 18</span>
                <span>Share 42</span>
              </div>
            </div>

            {/* Voice Consistency Score */}
            <div
              className="rounded-xl border p-4 text-center"
              style={{
                background: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="relative mx-auto mb-2 flex size-32 items-center justify-center">
                <svg className="absolute inset-0 size-32 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    strokeWidth="10"
                    style={{ stroke: "var(--border-subtle)" }}
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50 * 0.87} ${2 * Math.PI * 50 * 0.13}`}
                    className="animate-[scaleFade_1.5s_ease-out_forwards]"
                    style={{
                      stroke: "var(--accent-primary)",
                      filter: "drop-shadow(0 0 4px rgba(245,158,11,0.4))",
                    }}
                  />
                </svg>
                <div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    87%
                  </div>
                </div>
              </div>
              <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                Voice Consistency Score
              </p>
              <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                How consistent your voice is across all agents
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
