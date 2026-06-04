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
import { Switch } from "@/components/ui/switch";
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
import { TagInput } from "@/components/admin/forms/TagInput";
import { CldImage } from "@/components/shared/CldImage";
import { ArrowLeft, ImagePlus, Save, Send, Trash2, X } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
}

interface ServiceFormProps {
  initial?: any;
  categories: ServiceCategory[];
}

export function ServiceEditor({ initial, categories }: ServiceFormProps) {
  const router = useRouter();
  const editing = !!initial?.id;

  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugDirty, setSlugDirty] = useState(editing);
  const [shortDesc, setShortDesc] = useState(initial?.shortDesc || "");
  const [longDesc, setLongDesc] = useState<any>(initial?.longDesc || { type: "doc", content: [] });
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId || (categories[0]?.id ?? ""));
  const [basePrice, setBasePrice] = useState<string>(initial?.basePrice != null ? String(initial.basePrice) : "");
  const [priceUnit, setPriceUnit] = useState(initial?.priceUnit || "per visit");
  const [featured, setFeatured] = useState<boolean>(initial?.featured ?? false);
  const [order, setOrder] = useState<number>(initial?.order ?? 0);
  const [image, setImage] = useState<string | null>(initial?.image || null);
  const [gallery, setGallery] = useState<string[]>(initial?.gallery || []);
  const [inclusions, setInclusions] = useState<string[]>(initial?.inclusions || []);
  const [exclusions, setExclusions] = useState<string[]>(initial?.exclusions || []);
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription || "");
  const [seoImage, setSeoImage] = useState<string | null>(initial?.seoImage || null);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(initial?.status || "DRAFT");
  const [busy, setBusy] = useState(false);

  // Auto-slug from name until user manually edits the slug
  useEffect(() => {
    if (slugDirty) return;
    const next = name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setSlug(next);
  }, [name, slugDirty]);

  const payload = () => ({
    name,
    slug,
    shortDesc,
    longDesc,
    categoryId,
    basePrice: basePrice ? Number(basePrice) : undefined,
    priceUnit,
    featured,
    order,
    image: image || undefined,
    gallery,
    inclusions,
    exclusions,
    seoTitle: seoTitle || undefined,
    seoDescription: seoDescription || undefined,
    seoImage: seoImage || undefined,
  });

  async function save(nextStatus: "DRAFT" | "PUBLISHED") {
    if (!name || !shortDesc || !categoryId) {
      toast.error("Name, short description and category are required");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        const updated = await apiPatch(`/admin/services/${initial.id}`, { ...payload(), status: nextStatus });
        toast.success(nextStatus === "PUBLISHED" ? "Published" : "Saved");
        setStatus(nextStatus);
        // If slug changed, jump to new edit URL
        if (updated?.slug && updated.slug !== initial.slug) {
          router.replace(`/admin/services/${updated.id}`);
        } else {
          router.refresh();
        }
      } else {
        const created = await apiPost("/admin/services", { ...payload(), status: nextStatus });
        toast.success(nextStatus === "PUBLISHED" ? "Published" : "Saved as draft");
        router.replace(`/admin/services/${created.id}`);
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
      await apiDelete(`/admin/services/${initial.id}`);
      toast.success("Moved to trash");
      router.push("/admin/services");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/services">
            <ArrowLeft className="size-4 mr-1.5" /> Services
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

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4 min-w-0">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Service name (e.g. Cockroach Control)"
                  className="text-2xl font-heading font-bold h-12 border-0 px-0 shadow-none focus-visible:ring-0"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>/services/</span>
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
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Short description</Label>
                <Textarea
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  rows={2}
                  placeholder="Used on cards and SEO when no SEO description is set."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Long description</Label>
              <TiptapEditor
                value={longDesc}
                onChange={setLongDesc}
                onPickImage={() =>
                  new Promise<{ publicId: string; alt: string } | null>(() => {
                    // Image picker inside TipTap is handled by the simple prompt; users can also
                    // upload via the Media library and embed via the inline image button.
                  })
                }
              />
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
                <p className="text-sm text-muted-foreground">No images yet. Add a few to brighten the service page.</p>
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
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Inclusions</Label>
                <TagInput value={inclusions} onChange={setInclusions} placeholder="Add an inclusion…" />
                <p className="text-xs text-muted-foreground">What's included in the service.</p>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Exclusions</Label>
                <TagInput value={exclusions} onChange={setExclusions} placeholder="Add an exclusion…" />
                <p className="text-xs text-muted-foreground">What's not included (e.g. extra-charge add-ons).</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-heading font-semibold">SEO</h3>
              <div className="grid gap-2">
                <Label>SEO title</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Leave blank to use name" />
              </div>
              <div className="grid gap-2">
                <Label>SEO description</Label>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={2}
                  placeholder="Leave blank to use short description"
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
                  <p className="text-xs text-muted-foreground">Trashed services are hidden but recoverable.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="size-4 mr-1.5" /> Move to Trash
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Move this service to trash?</AlertDialogTitle>
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

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <MediaPickerField label="Featured image" value={image} onChange={setImage} w={1200} h={720} />

              <div className="grid gap-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="px-3 py-2 rounded-md border bg-background text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Price</Label>
                  <Input
                    type="number"
                    min={0}
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Unit</Label>
                  <Input value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Order</Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value || "0", 10))}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <Label htmlFor="featured" className="text-sm">
                  Featured
                </Label>
                <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
