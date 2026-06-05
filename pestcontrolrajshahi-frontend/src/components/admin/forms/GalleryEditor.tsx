"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { apiPatch, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { MediaPickerField } from "@/components/admin/media/MediaPicker";
import { ArrowLeft, Save } from "lucide-react";

interface GalleryItem {
  id?: string;
  image?: string;
  caption?: string | null;
  category?: string | null;
  order?: number;
  isVisible?: boolean;
}

interface FormValues {
  caption: string;
  category: string;
  order: number;
  isVisible: boolean;
}

export function GalleryEditor({ item }: { item?: GalleryItem }) {
  const router = useRouter();
  const isEdit = Boolean(item?.id);
  const [image, setImage] = useState<string>(item?.image || "");
  const form = useForm<FormValues>({
    defaultValues: {
      caption: item?.caption ?? "",
      category: item?.category ?? "",
      order: item?.order ?? 0,
      isVisible: item?.isVisible ?? true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!image) {
      toast.error("Please pick an image from the media library");
      return;
    }
    const payload = {
      image,
      caption: values.caption?.trim() || null,
      category: values.category?.trim() || null,
      order: Number(values.order) || 0,
      isVisible: values.isVisible,
    };
    try {
      if (isEdit && item?.id) {
        await apiPatch(`/admin/gallery/${item.id}`, payload);
        toast.success("Saved");
      } else {
        await apiPost("/admin/gallery", payload);
        toast.success("Created");
      }
      router.push("/admin/gallery");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message?.message || e?.message || "Save failed");
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="cursor-pointer -ml-2">
            <Link href="/admin/gallery">
              <ArrowLeft className="size-4 mr-1.5" /> Back to gallery
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-bold mt-1">
            {isEdit ? "Edit gallery item" : "New gallery item"}
          </h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            <MediaPickerField
              label="Image"
              value={image || null}
              onChange={(v) => setImage(v || "")}
              w={1200}
              h={1200}
            />

            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                placeholder="Optional caption shown on hover (e.g. 'Cockroach treatment at Uposhohor restaurant')"
                {...form.register("caption")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g. residential, restaurant, before-after, team"
                  {...form.register("category")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional grouping — shown as a filter chip on /gallery.
                </p>
              </div>
              <div>
                <Label htmlFor="order">Display order</Label>
                <Input
                  id="order"
                  type="number"
                  step={1}
                  {...form.register("order", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="isVisible"
                checked={form.watch("isVisible")}
                onCheckedChange={(v) => form.setValue("isVisible", v)}
                className="cursor-pointer"
              />
              <Label htmlFor="isVisible" className="cursor-pointer">
                Visible on the public /gallery page
              </Label>
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="cursor-pointer"
              >
                <Save className="size-4 mr-2" />
                {form.formState.isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create item"}
              </Button>
              <Button asChild variant="ghost" type="button" className="cursor-pointer">
                <Link href="/admin/gallery">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
