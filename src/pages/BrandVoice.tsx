import { useState, useCallback, useEffect } from "react";
import { Mic, Save, Sparkles, FileText, Check, Loader2, Trash2, Plus, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
// import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

/* ───────── Types ───────── */
interface TonePreset {
  id: string;
  label: string;
  description: string;
  isDefault?: boolean;
}

/* ───────── Tone Presets ───────── */
const TONE_PRESETS: TonePreset[] = [
  {
    id: "isaac",
    label: "Soulful, confident, community-driven",
    description: "Isaac's voice — Short punchy statements like conversation between friends. Storytelling and surprise. Keep things real, inclusive, and energized.",
    isDefault: true,
  },
  {
    id: "professional",
    label: "Professional & authoritative",
    description: "Clear, expert-driven communication. Data-backed statements with a commanding tone that earns trust and respect from industry peers.",
  },
  {
    id: "playful",
    label: "Playful & witty",
    description: "Clever wordplay and lighthearted humor. Pop culture references with a sharp comedic edge that makes audiences smile and share.",
  },
  {
    id: "bold",
    label: "Bold & provocative",
    description: "Strong opinions that challenge the status quo. Unapologetic statements designed to spark conversation and polarize engagement.",
  },
  {
    id: "warm",
    label: "Warm & educational",
    description: "Patient, nurturing guidance. Complex ideas simplified with empathy — like a wise mentor walking you through something new.",
  },
  {
    id: "minimal",
    label: "Minimal & poetic",
    description: "Stripped-down elegance. Fewer words, each one carefully chosen. Haiku-like precision that lets the silence speak.",
  },
  {
    id: "luxury",
    label: "Aspirational & luxury",
    description: "Effortless sophistication. Descriptive language that paints vivid scenes of the elevated life your audience desires.",
  },
  {
    id: "casual",
    label: "Casual & conversational",
    description: "Relaxed, everyday language. Like texting a friend — no jargon, no pretense, just genuine human connection through words.",
  },
  {
    id: "technical",
    label: "Data-driven & technical",
    description: "Metrics-first communication backed by research. Precise terminology for audiences who value evidence over emotion.",
  },
  {
    id: "empathetic",
    label: "Empathetic & supportive",
    description: "Deep understanding and encouragement. Validating your audience's struggles while gently guiding them toward solutions.",
  },
];

/* ───────── Component ───────── */
export default function BrandVoice() {
  /* ── State ── */
  const [selectedToneId, setSelectedToneId] = useState<string>("isaac");
  const [customDescription, setCustomDescription] = useState("");
  const [samples, setSamples] = useState<string[]>([""]);
  const [_activeTab, _setActiveTab] = useState("presets");
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ── tRPC ── */
  const utils = trpc.useUtils();
  const { data: savedVoice } = trpc.brandVoice.get.useQuery();

  const saveMutation = trpc.brandVoice.save.useMutation({
    onSuccess: () => {
      utils.brandVoice.get.invalidate();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  /* ── Sync with saved voice on load ── */
  useEffect(() => {
    if (savedVoice) {
      const matchedPreset = TONE_PRESETS.find((p) => p.label === savedVoice.tone);
      if (matchedPreset) {
        setSelectedToneId(matchedPreset.id);
      }
      setCustomDescription(savedVoice.description);
      setSamples(savedVoice.samples.length > 0 ? savedVoice.samples : [""]);
    }
  }, [savedVoice]);

  /* ── Get selected preset ── */
  const selectedPreset = TONE_PRESETS.find((p) => p.id === selectedToneId);

  /* ── Current description ── */
  const currentDescription = customDescription || selectedPreset?.description || "";

  /* ── Current tone label ── */
  const currentToneLabel = selectedPreset?.label || "Custom";

  /* ── Sample handlers ── */
  const updateSample = useCallback((index: number, value: string) => {
    setSamples((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const addSample = useCallback(() => {
    if (samples.length < 3) {
      setSamples((prev) => [...prev, ""]);
    }
  }, [samples.length]);

  const removeSample = useCallback((index: number) => {
    setSamples((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ── Save handler ── */
  const handleSave = useCallback(() => {
    const nonEmptySamples = samples.filter((s) => s.trim().length > 0);
    saveMutation.mutate({
      tone: currentToneLabel,
      description: currentDescription,
      samples: nonEmptySamples,
    });
  }, [currentToneLabel, currentDescription, samples, saveMutation]);

  /* ── Check if saveable ── */
  const canSave = currentDescription.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F6FC] p-6 font-[Inter]">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <Mic className="w-6 h-6 text-[#9333EA]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand Voice Studio</h1>
            <p className="text-[#8B949E] text-sm mt-0.5">
              Train Omega Swarm to write in your unique voice
            </p>
          </div>
        </div>

        {/* ═══ MAIN CONTENT GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ─── LEFT COLUMN: Tone Selection + Samples (3 cols) ─── */}
          <div className="lg:col-span-3 space-y-6">

            {/* TONE SELECTION CARD */}
            <Card className="rounded-2xl border-[#21262D] bg-[#0D1117] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-5 h-5 text-[#9333EA]" />
                <h2 className="text-lg font-semibold">Choose Your Tone</h2>
                <Badge
                  variant="outline"
                  className="ml-auto border-[#9333EA]/30 text-[#9333EA] bg-purple-500/10 text-xs"
                >
                  {TONE_PRESETS.length} presets
                </Badge>
              </div>

              {/* Tone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TONE_PRESETS.map((preset) => {
                  const isSelected = selectedToneId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedToneId(preset.id);
                        if (preset.description && !customDescription) {
                          setCustomDescription(preset.description);
                        }
                      }}
                      className={cn(
                        "relative text-left p-4 rounded-xl border transition-all duration-200",
                        isSelected
                          ? "bg-purple-500/10 border-[#9333EA] shadow-[0_0_16px_rgba(147,51,234,0.12)]"
                          : "bg-[#161B22] border-[#21262D] hover:border-[#30363D] hover:bg-[#1C2128]"
                      )}
                    >
                      {preset.isDefault && (
                        <Badge
                          className="absolute top-2 right-2 bg-purple-500/20 text-[#9333EA] border-0 text-[10px] px-1.5 py-0"
                        >
                          Default
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#9333EA] flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        {!isSelected && (
                          <div className="w-4 h-4 rounded-full border-2 border-[#30363D] shrink-0" />
                        )}
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-[#F0F6FC]" : "text-[#8B949E]"
                          )}
                        >
                          {preset.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* WRITING SAMPLES CARD */}
            <Card className="rounded-2xl border-[#21262D] bg-[#0D1117] p-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-[#9333EA]" />
                <h2 className="text-lg font-semibold">Writing Samples</h2>
              </div>
              <p className="text-[#8B949E] text-sm mb-5">
                Paste examples of your writing — social posts, emails, anything.
                <span className="block text-xs text-[#484F58] mt-1">
                  The more samples you provide, the better Omega Swarm learns your voice
                </span>
              </p>

              <div className="space-y-4">
                {samples.map((sample, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-[#8B949E]">
                        Sample {index + 1}
                      </span>
                      {samples.length > 1 && (
                        <button
                          onClick={() => removeSample(index)}
                          className="text-[#484F58] hover:text-red-400 transition-colors"
                          title="Remove sample"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <Textarea
                      placeholder={`Paste writing sample ${index + 1} here...`}
                      value={sample}
                      onChange={(e) => updateSample(index, e.target.value)}
                      className="bg-[#161B22] border-[#21262D] text-[#F0F6FC] placeholder:text-[#484F58] focus:border-[#9333EA] focus:ring-purple-500/20 min-h-[120px] resize-none"
                    />
                    {sample.length > 0 && (
                      <span className="text-[10px] text-[#484F58] mt-1 block text-right">
                        {sample.length} characters
                      </span>
                    )}
                  </div>
                ))}

                {samples.length < 3 && (
                  <Button
                    variant="outline"
                    onClick={addSample}
                    className="w-full border-dashed border-[#30363D] text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#9333EA]/50 hover:bg-purple-500/5 bg-transparent"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sample ({3 - samples.length} remaining)
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* ─── RIGHT COLUMN: Preview + Saved Voice (2 cols) ─── */}
          <div className="lg:col-span-2 space-y-6">

            {/* SELECTED TONE PREVIEW */}
            <Card className="rounded-2xl border-[#21262D] bg-[#0D1117] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Quote className="w-5 h-5 text-[#9333EA]" />
                <h2 className="text-lg font-semibold">Voice Preview</h2>
              </div>

              <div className="rounded-xl bg-purple-500/5 border border-purple-500/15 p-4 space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8B949E] font-semibold">
                    Selected Tone
                  </span>
                  <p className="text-[#F0F6FC] font-medium text-sm mt-1">
                    {currentToneLabel}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8B949E] font-semibold">
                    Description
                  </span>
                  <p className="text-[#8B949E] text-sm mt-1 leading-relaxed">
                    {currentDescription}
                  </p>
                </div>

                {samples.filter((s) => s.trim()).length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8B949E] font-semibold">
                      Writing Samples
                    </span>
                    <Badge
                      variant="outline"
                      className="mt-1 border-[#9333EA]/30 text-[#9333EA] bg-purple-500/10"
                    >
                      {samples.filter((s) => s.trim()).length} provided
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* CUSTOM DESCRIPTION */}
            <Card className="rounded-2xl border-[#21262D] bg-[#0D1117] p-6">
              <h2 className="text-sm font-semibold text-[#8B949E] mb-3">
                Customize Description
              </h2>
              <Textarea
                placeholder="Describe your brand voice in your own words, or edit the preset above..."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="bg-[#161B22] border-[#21262D] text-[#F0F6FC] placeholder:text-[#484F58] focus:border-[#9333EA] focus:ring-purple-500/20 min-h-[140px] resize-none"
              />
              <p className="text-xs text-[#484F58] mt-2">
                Override the preset with your own description, or keep it as-is.
              </p>
            </Card>

            {/* CURRENT SAVED VOICE */}
            {savedVoice && (
              <Card className="rounded-2xl border-[#21262D] bg-[#0D1117] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  <h2 className="text-sm font-semibold text-[#22C55E]">Currently Saved</h2>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8B949E]">Tone</span>
                    <span className="text-[#F0F6FC] font-medium">{savedVoice.tone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B949E]">Samples</span>
                    <span className="text-[#F0F6FC]">{savedVoice.samples.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B949E]">Updated</span>
                    <span className="text-[#484F58]">
                      {new Date(savedVoice.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* SAVE BUTTON */}
            <Button
              onClick={handleSave}
              disabled={!canSave || saveMutation.isPending}
              className={cn(
                "w-full py-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all",
                !canSave || saveMutation.isPending
                  ? "bg-[#161B22] border border-[#21262D] text-[#484F58] cursor-not-allowed"
                  : "bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:shadow-[0_0_40px_rgba(147,51,234,0.45)] hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  Brand Voice Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Brand Voice
                </>
              )}
            </Button>

            {saveSuccess && (
              <p className="text-center text-xs text-[#22C55E]">
                Omega Swarm will now write in this voice
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
