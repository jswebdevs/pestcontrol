"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import { TiptapEditor } from "@/components/admin/editor/TiptapEditor";
import { MediaPicker, MediaPickerField, PickedMedia } from "@/components/admin/media/MediaPicker";
import { CldImage } from "@/components/shared/CldImage";
import { ArrowLeft, ImagePlus, Save, Send, Trash2, X } from "lucide-react";

interface ProjectFormProps {
  initial?: any;
}

function toDateInputValue(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

export function ProjectEditor({ initial }: ProjectFormProps) {
  const router = useRouter();
  const editing = !!initial?.id;

  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugDirty, setSlugDirty] = useState(editing);
  const [client, setClient] = useState(initial?.client || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [summary, setSummary] = useState(initial?.summary || "");
  const [body, setBody] = useState<any>(initial?.body || { type: "doc", content: [] });
  const [cover, setCover] = useState<string | null>(initial?.cover || null);
  const [gallery, setGallery] = useState<string[]>(initial?.gallery || []);
  const [date, setDate] = useState(toDateInputValue(initial?.date));
  const [order, setOrder] = useState<number>(initial?.order ?? 0);
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription || "");
  const [seoImage, setSeoImage] = useState<string | null>(initial?.seoImage || null);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(initial?.status || "DRAFT");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (slugDirty) return;
    const next = title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setSlug(next);
  }, [title, slugDirty]);

  const payload = () => ({
    title,
    slug,
    client: client || undefined,
    category: category || undefined,
    summary,
    body,
    cover: cover || undefined,
    gallery,
    date: date || null,
    order,
    seoTitle: seoTitle || undefined,
    seoDescription: seoDescription || undefined,
    seoImage: seoImage || undefined,
  });

  async function save(nextStatus: "DRAFT" | "PUBLISHED") {
    if (!title) {
      toast.error("Title is required");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        const updated = await apiPatch(`/admin/projects/${initial.id}`, { ...payload(), status: nextStatus });
        toast.success(nextStatus === "PUBLISHED" ? "Published" : "Saved");
        setStatus(nextStatus);
        if (updated?.slug && updated.slug !== initial.slug) {
          router.replace(`/admin/projects/${updated.id}`);
        } else {
          router.refresh();
        }
      } else {
        const created = await apiPost("/admin/projects", { ...payload(), status: nextStatus });
        toast.success(nextStatus === "PUBLISHED" ? "Published" : "Saved as draft");
        router.replace(`/admin/projects/${created.id}`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function moveToTrash() {
    setBusy(true);
    try {
      await apiDelete(`/admin/projects/${initial.id}`);
      toast.success("Moved to trash");
      router.push("/admin/projects");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/projects">
            <ArrowLeft className="size-4 mr-1.5" /> Projects
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={status === "PUBLISHED" ? "default" : "secondary"}>
            {status === "PUBLISHED" ? "Published" : "Draft"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => save("DRAFT")} disabled={busy}>
            <Save className="size-4 mr-1.5" /> Save Draft
          </Button>
          {status === "PUBLISHED" ? (
            <Button size="sm" onClick={() => save("PUBLISHED")} disabled={busy}>
              <Save className="size-4 mr-1.5" /> Update
            </Button>
          ) : (
            <Button size="sm" onClick={() => save("PUBLISHED")} disabled={busy}>
              <Send className="size-4 mr-1.5" /> Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4 min-w-0">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project title (e.g. Riverside Apartments – cockroach treatment)"
                  className="text-2xl font-heading font-bold h-12 border-0 px-0 shadow-none focus-visible:ring-0"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>/projects/</span>
                  <Input
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugDirty(true);
                    }}
                    className="h-7 flex-1 max-w-md"
                  />
                  {editing && initial.slug !== slug && (
                    <span className="text-amber-600 dark:text-amber-500">↻ a 301 redirect will be recorded</span>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Summary</Label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  placeholder="One-sentence summary shown above the cover image."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Body</Label>
              <TiptapEditor value={body} onChange={setBody} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Gallery</Label>
              {gallery.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {gallery.map((pid) => (
                    <div key={pid} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                      <CldImage publicId={pid} alt="" w={400} h={400} className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setGallery(gallery.filter((p) => p !== pid))}
                        className="absolute top-1.5 right-1.5 size-7 rounded-full bg-background/90 text-foreground border opacity-0 group-hover:opacity-100 transition grid place-items-center"
                        aria-label="Remove"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No images yet.</p>
              )}
              <MediaPicker
                multiple
                onSelect={(picked) => {
                  const ids = (picked as PickedMedia[]).map((p) => p.publicId);
                  setGallery(Array.from(new Set([...gallery, ...ids])));
                }}
                selectedIds={gallery}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <ImagePlus className="size-4 mr-1.5" /> Add to gallery
                  </Button>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-heading font-semibold">SEO</h3>
              <div className="grid gap-2">
                <Label>SEO title</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Leave blank to use title" />
              </div>
              <div className="grid gap-2">
                <Label>SEO description</Label>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={2}
                  placeholder="Leave blank to use summary"
                />
              </div>
              <MediaPickerField label="OG Image" value={seoImage} onChange={setSeoImage} w={1200} h={630} />
            </CardContent>
          </Card>

          {editing && (
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-destructive">Danger zone</h3>
                  <p className="text-xs text-muted-foreground">Trashed projects are hidden but recoverable.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="size-4 mr-1.5" /> Move to Trash
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Move this project to trash?</AlertDialogTitle>
                      <AlertDialogDescription>
                        It will be hidden from the public site. You can restore it later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={moveToTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Move to Trash
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <MediaPickerField label="Cover image" value={cover} onChange={setCover} w={1200} h={720} />

              <div className="grid gap-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <p className="text-xs text-muted-foreground">Shown on the portfolio card on hover.</p>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Client</Label>
                <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Optional" />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Residential"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Order</Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value || "0", 10))}
                />
                <p className="text-xs text-muted-foreground">Lower numbers show first.</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
