import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  FolderOpen, Share2, Video, ImageIcon,
  Plus, X, Sparkles, Camera, Send, Loader2
} from "lucide-react";

const TABS = [
  { key: "all", label: "All Content", icon: FolderOpen },
  { key: "social", label: "Social Posts", icon: Camera },
  { key: "video", label: "Videos", icon: Video },
  { key: "asset", label: "Assets", icon: ImageIcon },
];

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  social: { label: "Social Post", color: "#EC4899" },
  video: { label: "Video", color: "#A855F7" },
  ad: { label: "Ad Copy", color: "#F59E0B" },
  blog: { label: "Blog", color: "#3B82F6" },
};

export default function ContentLibrary() {
  const [tab, setTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState("");

  // REAL DATA from backend — empty until something is actually posted
  const { data: contentItems, isLoading } = trpc.content.list.useQuery();
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      setShowCreate(false);
      setTopic("");
      utils.content.list.invalidate();
    },
  });
  const utils = trpc.useUtils();

  const filtered = (contentItems || []).filter((item) =>
    tab === "all" ? true : item.type === tab
  );

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Studio</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {contentItems?.length
                ? `${contentItems.length} item(s) — real posts only`
                : "No posts yet. Create your first one below."}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #F97316)",
              color: "#0C0A09",
              boxShadow: "0 0 20px rgba(245,158,11,0.3)",
            }}
          >
            <Plus className="w-4 h-4" />
            Create & Post
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? "rgba(245,158,11,0.15)" : "transparent",
                  color: active ? "#F59E0B" : "var(--text-secondary)",
                  border: active ? "1px solid rgba(245,158,11,0.3)" : "1px solid transparent",
                }}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content Grid — REAL DATA ONLY */}
        {isLoading ? (
          <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          /* Empty state — honest */
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
              <Send className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
            </div>
            <h3 className="text-lg font-bold mb-2">No posts yet</h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
              When you create and post content through Omega Swarm, your real published posts will appear here. Click "Create & Post" to get started.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09" }}
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const typeInfo = TYPE_LABELS[item.type] || TYPE_LABELS.social;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl p-5 transition-all hover:scale-[1.01]"
                  style={{
                    background: "var(--card)",
                    border: "1px solid rgba(245,158,11,0.12)",
                  }}
                >
                  {/* Type badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: typeInfo.color, background: `${typeInfo.color}20` }}
                    >
                      {typeInfo.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#84CC16" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
                      Published
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold mb-2">{item.title}</h3>

                  {/* Caption preview */}
                  <p className="text-sm mb-3 line-clamp-3" style={{ color: "var(--text-secondary)" }}>
                    {item.caption}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{item.date}</span>
                    <span>{item.account}</span>
                  </div>

                  {/* Image if available */}
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="mt-3 w-full h-40 object-cover rounded-xl"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create & Post Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div
              className="w-full max-w-lg rounded-2xl p-6 mx-4"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Create & Post to Instagram</h2>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  What do you want to post about?
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Our new summer collection launching this Sunday..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                  style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <button
                onClick={() => createPost.mutate({ topic })}
                disabled={!topic.trim() || createPost.isPending}
                className="w-full py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                style={{
                  background: !topic.trim() || createPost.isPending ? "var(--border)" : "linear-gradient(135deg, #F59E0B, #F97316)",
                  color: !topic.trim() || createPost.isPending ? "var(--text-muted)" : "#0C0A09",
                  cursor: !topic.trim() || createPost.isPending ? "not-allowed" : "pointer",
                }}
              >
                {createPost.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating & Posting...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Generate AI Content & Post</>
                )}
              </button>

              {createPost.error && (
                <p className="mt-3 text-sm text-red-400">{createPost.error.message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
