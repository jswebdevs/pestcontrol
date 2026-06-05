"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CldImage } from "@/components/shared/CldImage";
import { Edit, Eye, EyeOff, ImagePlus, Plus, Trash2 } from "lucide-react";

interface GalleryItem {
  id: string;
  image: string;
  caption?: string | null;
  category?: string | null;
  order: number;
  isVisible: boolean;
  createdAt: string;
}

export default function AdminGalleryListPage() {
  const qc = useQueryClient();
  const q = useQuery<GalleryItem[]>({
    queryKey: ["admin-gallery"],
    queryFn: () => apiGet("/admin/gallery"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      apiPatch(`/admin/gallery/${id}`, { isVisible }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message?.message || "Update failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/gallery/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message?.message || "Delete failed"),
  });

  const items = q.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Photos shown on the public{" "}
            <Link href="/gallery" className="text-primary hover:underline" target="_blank">
              /gallery
            </Link>{" "}
            page. Drag with the order field; hide without deleting via the eye toggle.
          </p>
        </div>
        <Button asChild className="cursor-pointer">
          <Link href="/admin/gallery/new">
            <Plus className="size-4 mr-2" /> Add gallery item
          </Link>
        </Button>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <ImagePlus className="size-10 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="font-heading font-semibold mb-1">No gallery items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add photos of completed jobs, team shots, or before/after pairs.
              </p>
              <Button asChild className="cursor-pointer">
                <Link href="/admin/gallery/new">
                  <Plus className="size-4 mr-2" /> Add the first one
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((g) => (
            <Card key={g.id} className="overflow-hidden p-0 gap-0">
              <Link
                href={`/admin/gallery/${g.id}`}
                className="block aspect-square bg-muted relative cursor-pointer group"
              >
                <CldImage
                  publicId={g.image}
                  alt={g.caption || "Gallery photo"}
                  w={400}
                  h={400}
                  crop="fill"
                  className="absolute inset-0 size-full object-cover"
                />
                {!g.isVisible && (
                  <div className="absolute inset-0 bg-black/55 grid place-items-center text-white text-xs font-medium uppercase tracking-wider">
                    Hidden
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-[10px]">
                    #{g.order}
                  </Badge>
                </div>
              </Link>
              <CardContent className="p-3 space-y-2">
                <div className="text-sm font-medium line-clamp-2 min-h-[2.5em]">
                  {g.caption || <span className="text-muted-foreground italic">No caption</span>}
                </div>
                {g.category && (
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {g.category}
                  </Badge>
                )}
                <div className="flex gap-1 pt-1 border-t">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer flex-1 px-2"
                  >
                    <Link href={`/admin/gallery/${g.id}`}>
                      <Edit className="size-3.5 mr-1" /> Edit
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer px-2"
                    title={g.isVisible ? "Hide" : "Show"}
                    onClick={() =>
                      toggleMut.mutate({ id: g.id, isVisible: !g.isVisible })
                    }
                  >
                    {g.isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer px-2 text-destructive hover:text-destructive"
                    title="Delete"
                    onClick={() => {
                      if (confirm("Delete this gallery item? This cannot be undone.")) {
                        delMut.mutate(g.id);
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
