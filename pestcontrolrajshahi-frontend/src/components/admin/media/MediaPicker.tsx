"use client";

import { useCallback, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Check, ImageIcon, Loader2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { cld } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

export interface PickedMedia {
  publicId: string;
  alt: string;
  url?: string;
}

interface MediaPickerProps {
  /** false = single select returns one item; true = multi returns an array. */
  multiple?: boolean;
  resourceType?: "image" | "video" | "all";
  /** When single, called with a single item. When multiple, called with an array. */
  onSelect: (picked: PickedMedia | PickedMedia[]) => void;
  /** Optional preview of currently-selected publicIds (renders selected ring). */
  selectedIds?: string[];
  trigger?: React.ReactNode;
  /** Default open state — useful for inline embedding. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface MediaItem {
  id: string;
  publicId: string;
  url: string;
  resourceType: "IMAGE" | "VIDEO" | "RAW";
  alt?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

export function MediaPicker({
  multiple = false,
  resourceType = "image",
  onSelect,
  selectedIds = [],
  trigger,
  defaultOpen = false,
  onOpenChange,
}: MediaPickerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [picked, setPicked] = useState<Record<string, PickedMedia>>({});
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
    if (next) {
      setPicked({});
      refresh();
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (resourceType === "image") params.set("resourceType", "IMAGE");
      else if (resourceType === "video") params.set("resourceType", "VIDEO");
      if (q) params.set("q", q);
      params.set("limit", "60");
      const data = await apiGet(`/admin/media?${params.toString()}`);
      setItems(data.items || []);
    } catch (e) {
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [q, resourceType]);

  const togglePick = (item: MediaItem) => {
    if (multiple) {
      setPicked((prev) => {
        const next = { ...prev };
        if (next[item.publicId]) delete next[item.publicId];
        else next[item.publicId] = { publicId: item.publicId, alt: item.alt || "", url: item.url };
        return next;
      });
    } else {
      onSelect({ publicId: item.publicId, alt: item.alt || "", url: item.url });
      handleOpen(false);
    }
  };

  const confirmMultiple = () => {
    const values = Object.values(picked);
    if (!values.length) {
      toast.error("Select at least one item");
      return;
    }
    onSelect(values);
    handleOpen(false);
  };

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const sign = await apiPost<any>("/admin/media/sign", {
          resourceType: isVideo ? "video" : "image",
        });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("timestamp", String(sign.timestamp));
        formData.append("api_key", sign.apiKey);
        formData.append("signature", sign.signature);
        formData.append("folder", sign.folder);
        const url = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resourceType}/upload`;
        const res = await axios.post(url, formData);
        const data = res.data;
        await apiPost("/admin/media/record", {
          publicId: data.public_id,
          url: data.secure_url,
          resourceType: sign.resourceType,
          format: data.format,
          width: data.width,
          height: data.height,
          duration: data.duration,
          bytes: data.bytes,
          alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        });
      }
      toast.success("Upload complete");
      setTab("library");
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm">
            <ImageIcon className="size-4 mr-1.5" />
            {multiple ? "Pick media" : "Pick image"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle>{multiple ? "Pick media" : "Pick image"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex flex-col">
          <div className="px-5 pt-3 flex items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            {tab === "library" && (
              <Input
                placeholder="Search alt, caption, public ID..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refresh()}
                className="max-w-xs h-9"
              />
            )}
          </div>

          <TabsContent value="library" className="m-0">
            <ScrollArea className="h-[480px]">
              <div className="px-5 py-4">
                {loading ? (
                  <div className="grid place-items-center py-20 text-muted-foreground text-sm">
                    <Loader2 className="size-6 animate-spin mb-2" /> Loading library…
                  </div>
                ) : items.length === 0 ? (
                  <div className="grid place-items-center py-20 text-muted-foreground text-sm">
                    <ImageIcon className="size-10 opacity-30 mb-3" />
                    No media yet. Upload your first item.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {items.map((m) => {
                      const isPicked = !!picked[m.publicId];
                      const wasPreselected = selectedIds.includes(m.publicId);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => togglePick(m)}
                          className={cn(
                            "relative aspect-square rounded-xl overflow-hidden border bg-muted text-left group",
                            (isPicked || (wasPreselected && !multiple)) && "ring-2 ring-primary ring-offset-2",
                          )}
                          title={m.alt || m.publicId}
                        >
                          {m.resourceType === "VIDEO" ? (
                            // eslint-disable-next-line jsx-a11y/media-has-caption
                            <video src={m.url} className="size-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cld(m.publicId, { w: 320 })} alt={m.alt || ""} className="size-full object-cover" />
                          )}
                          {isPicked && (
                            <div className="absolute top-2 right-2 size-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
                              <Check className="size-3.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="m-0">
            <div className="px-5 py-10 h-[480px] grid place-items-center">
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  upload(e.dataTransfer.files);
                }}
                className="w-full max-w-md aspect-[16/9] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Uploading to Cloudinary…</p>
                  </>
                ) : (
                  <>
                    <Upload className="size-8 text-primary" />
                    <div className="text-center space-y-1">
                      <p className="font-medium text-sm">Drop files here or click to browse</p>
                      <p className="text-xs text-muted-foreground">Images and video supported</p>
                    </div>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept={
                    resourceType === "video"
                      ? "video/*"
                      : resourceType === "image"
                      ? "image/*"
                      : "image/*,video/*"
                  }
                  className="hidden"
                  onChange={(e) => upload(e.target.files)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {multiple && (
          <DialogFooter className="px-5 py-3 border-t">
            <Button variant="outline" onClick={() => handleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmMultiple} disabled={!Object.keys(picked).length}>
              Insert {Object.keys(picked).length || ""}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Convenience wrappers
// ────────────────────────────────────────────────────────────────────────────

interface SinglePickProps {
  value?: string | null;
  onChange: (publicId: string | null) => void;
  label?: string;
  w?: number;
  h?: number;
}

/** Form-field wrapper: shows current image preview + a "Change" / "Remove" button. */
export function MediaPickerField({ value, onChange, label, w = 1200, h = 600 }: SinglePickProps) {
  return (
    <div className="grid gap-2">
      {label && <Label>{label}</Label>}
      <div className="flex items-start gap-3">
        <div className="size-24 rounded-lg border overflow-hidden bg-muted shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cld(value, { w: 200 })} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full grid place-items-center text-muted-foreground">
              <ImageIcon className="size-6 opacity-40" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <MediaPicker
            multiple={false}
            onSelect={(p) => onChange((p as PickedMedia).publicId)}
            selectedIds={value ? [value] : []}
            trigger={
              <Button type="button" variant="outline" size="sm">
                <ImageIcon className="size-4 mr-1.5" />
                {value ? "Change" : "Pick image"}
              </Button>
            }
          />
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X className="size-4 mr-1.5" /> Remove
            </Button>
          )}
          <p className="text-xs text-muted-foreground font-mono">
            Recommended: {w} × {h}
          </p>
        </div>
      </div>
    </div>
  );
}
