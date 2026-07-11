import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ImageIcon,
  VideoIcon,
  Trash2,
  Plus,
  Search,
  UploadCloud,
  X,
  Play,
  FolderOpen,
} from "lucide-react";

const ACCOUNTS = [
  { value: "all", label: "All" },
  { value: "@wildnoff", label: "@wildnoff" },
  { value: "@kyakuwamusic", label: "@kyakuwamusic" },
  { value: "@isaacbullockk", label: "@isaacbullockk" },
];

const ACCOUNTS_FOR_SELECT = [
  { value: "@wildnoff", label: "@wildnoff" },
  { value: "@kyakuwamusic", label: "@kyakuwamusic" },
  { value: "@isaacbullockk", label: "@isaacbullockk" },
  { value: "general", label: "General" },
];

const ACCOUNT_COLORS: Record<string, string> = {
  "@wildnoff": "#22C55E",
  "@kyakuwamusic": "#3B82F6",
  "@isaacbullockk": "#F59E0B",
  general: "#8B949E",
};

export default function ContentLibrary() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  /* Form state */
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"image" | "video">("image");
  const [formUrl, setFormUrl] = useState("");
  const [formAccount, setFormAccount] = useState("@wildnoff");
  const [formTags, setFormTags] = useState("");

  /* tRPC queries & mutations */
  const { data: assets = [], isLoading } = trpc.contentLibrary.list.useQuery(
    activeTab === "all" ? undefined : { account: activeTab }
  );

  const addMutation = trpc.contentLibrary.add.useMutation({
    onSuccess: () => {
      utils.contentLibrary.list.invalidate();
      resetForm();
      setDialogOpen(false);
    },
  });

  const deleteMutation = trpc.contentLibrary.delete.useMutation({
    onSuccess: () => {
      utils.contentLibrary.list.invalidate();
    },
  });

  /* Filtered assets */
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [assets, searchQuery]);

  /* Helpers */
  function resetForm() {
    setFormName("");
    setFormType("image");
    setFormUrl("");
    setFormAccount("@wildnoff");
    setFormTags("");
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;
    addMutation.mutate({
      name: formName.trim(),
      type: formType,
      url: formUrl.trim(),
      account: formAccount as "@wildnoff" | "@kyakuwamusic" | "@isaacbullockk" | "general",
      tags: formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  function handleDelete(id: string) {
    deleteMutation.mutate({ id });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: "#9333EA" }}
          >
            <FolderOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#F0F6FC" }}
            >
              Content Library
            </h1>
            <p className="text-sm" style={{ color: "#8B949E" }}>
              Your photos and videos ready for Omega Swarm
            </p>
          </div>
        </div>
      </div>

      {/* ── Upload Area + Search Row ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Upload dialog trigger */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 rounded-lg font-medium"
              style={{ backgroundColor: "#9333EA", color: "#fff" }}
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent
            className="gap-0 border-0 p-0 sm:max-w-md"
            style={{ backgroundColor: "#0D1117" }}
          >
            <form onSubmit={handleSave}>
              <DialogHeader className="p-6 pb-4">
                <DialogTitle style={{ color: "#F0F6FC" }}>
                  Add New Asset
                </DialogTitle>
                <DialogDescription style={{ color: "#8B949E" }}>
                  Paste a URL for an image or video to add to your library.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 px-6 pb-4">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "#8B949E" }}
                  >
                    Asset Name
                  </label>
                  <Input
                    placeholder="e.g. Forest Adventure"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="border-0 text-sm"
                    style={{
                      backgroundColor: "#161B22",
                      color: "#F0F6FC",
                    }}
                  />
                </div>

                {/* Type */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "#8B949E" }}
                  >
                    Type
                  </label>
                  <Select
                    value={formType}
                    onValueChange={(v) => setFormType(v as "image" | "video")}
                  >
                    <SelectTrigger
                      className="border-0 text-sm"
                      style={{
                        backgroundColor: "#161B22",
                        color: "#F0F6FC",
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{ backgroundColor: "#161B22", borderColor: "#21262D" }}
                    >
                      <SelectItem value="image">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-3.5 w-3.5" />
                          Image
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <VideoIcon className="h-3.5 w-3.5" />
                          Video
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* URL */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "#8B949E" }}
                  >
                    URL
                  </label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    required
                    className="border-0 text-sm"
                    style={{
                      backgroundColor: "#161B22",
                      color: "#F0F6FC",
                    }}
                  />
                </div>

                {/* Account */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "#8B949E" }}
                  >
                    Account
                  </label>
                  <Select value={formAccount} onValueChange={setFormAccount}>
                    <SelectTrigger
                      className="border-0 text-sm"
                      style={{
                        backgroundColor: "#161B22",
                        color: "#F0F6FC",
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{ backgroundColor: "#161B22", borderColor: "#21262D" }}
                    >
                      {ACCOUNTS_FOR_SELECT.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "#8B949E" }}
                  >
                    Tags (comma-separated)
                  </label>
                  <Input
                    placeholder="nature, adventure, outdoor"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="border-0 text-sm"
                    style={{
                      backgroundColor: "#161B22",
                      color: "#F0F6FC",
                    }}
                  />
                </div>
              </div>

              <DialogFooter className="p-6 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setDialogOpen(false);
                  }}
                  className="rounded-lg border-0 font-medium"
                  style={{
                    backgroundColor: "#21262D",
                    color: "#8B949E",
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="rounded-lg font-medium"
                  style={{ backgroundColor: "#9333EA", color: "#fff" }}
                >
                  {addMutation.isPending ? "Saving..." : "Save Asset"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "#8B949E" }}
          />
          <Input
            placeholder="Search by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border-0 pl-9 text-sm"
            style={{ backgroundColor: "#161B22", color: "#F0F6FC" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5" style={{ color: "#8B949E" }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList
          className="h-9 gap-1 rounded-lg p-1"
          style={{ backgroundColor: "#161B22" }}
        >
          {ACCOUNTS.map((a) => (
            <TabsTrigger
              key={a.value}
              value={a.value}
              className="rounded-md px-3 py-1 text-xs font-medium transition-all data-[state=active]:shadow-sm"
              style={{
                color: "#8B949E",
              }}
            >
              {a.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ── Asset Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="overflow-hidden border-0"
              style={{ backgroundColor: "#0D1117" }}
            >
              <div
                className="aspect-square animate-pulse"
                style={{ backgroundColor: "#161B22" }}
              />
              <CardContent className="flex flex-col gap-2 p-3">
                <div
                  className="h-4 w-3/4 animate-pulse rounded"
                  style={{ backgroundColor: "#161B22" }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded"
                  style={{ backgroundColor: "#161B22" }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl py-20">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "#161B22" }}
          >
            <UploadCloud className="h-8 w-8" style={{ color: "#8B949E" }} />
          </div>
          <div className="text-center">
            <p className="text-base font-medium" style={{ color: "#F0F6FC" }}>
              No assets found
            </p>
            <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Add your first image or video to get started"}
            </p>
          </div>
          {!searchQuery && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-2 gap-2 rounded-lg font-medium"
              style={{ backgroundColor: "#9333EA", color: "#fff" }}
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Asset Card ── */
function AssetCard({
  asset,
  onDelete,
  isDeleting,
}: {
  asset: {
    id: string;
    name: string;
    type: "image" | "video";
    url: string;
    tags: string[];
    account: string;
  };
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card
      className="group overflow-hidden border-0 transition-transform duration-200 hover:scale-[1.02]"
      style={{ backgroundColor: "#0D1117" }}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{ backgroundColor: "#161B22" }}
      >
        {asset.type === "video" ? (
          <>
            <img
              src={asset.url}
              alt={asset.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
            />
            {!imgError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(147, 51, 234, 0.9)" }}
                >
                  <Play className="h-5 w-5 fill-white text-white" />
                </div>
              </div>
            )}
          </>
        ) : (
          <img
            src={asset.url}
            alt={asset.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="secondary"
            className="gap-1 rounded-md border-0 px-2 py-0.5 text-[10px] font-semibold uppercase"
            style={{
              backgroundColor:
                asset.type === "image" ? "#22C55E" : "#EF4444",
              color: "#fff",
            }}
          >
            {asset.type === "image" ? (
              <ImageIcon className="h-2.5 w-2.5" />
            ) : (
              <VideoIcon className="h-2.5 w-2.5" />
            )}
            {asset.type}
          </Badge>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(asset.id)}
          disabled={isDeleting}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.9)" }}
        >
          <Trash2 className="h-3.5 w-3.5 text-white" />
        </button>

        {/* Image error fallback */}
        {imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <ImageIcon className="h-8 w-8" style={{ color: "#8B949E" }} />
            <span className="text-xs" style={{ color: "#8B949E" }}>
              Preview unavailable
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <CardContent className="flex flex-col gap-2 p-3">
        <h3
          className="truncate text-sm font-semibold"
          style={{ color: "#F0F6FC" }}
        >
          {asset.name}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Account badge */}
          <Badge
            variant="outline"
            className="rounded-md border-0 px-1.5 py-0 text-[10px] font-medium"
            style={{
              backgroundColor: `${ACCOUNT_COLORS[asset.account] || "#8B949E"}18`,
              color: ACCOUNT_COLORS[asset.account] || "#8B949E",
            }}
          >
            {asset.account}
          </Badge>

          {/* Tag count */}
          {asset.tags.length > 0 && (
            <span className="text-[10px]" style={{ color: "#8B949E" }}>
              {asset.tags.length} tag{asset.tags.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Tags */}
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: "#21262D",
                  color: "#8B949E",
                }}
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: "#21262D", color: "#8B949E" }}
              >
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
