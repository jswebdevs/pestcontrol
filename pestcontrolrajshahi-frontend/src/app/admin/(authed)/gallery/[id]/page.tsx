"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { GalleryEditor } from "@/components/admin/forms/GalleryEditor";

export default function EditGalleryItemPage({
  params,
}: {
  // Next 15+: params is a Promise. Use React 19's `use()` to unwrap inside a client component.
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const q = useQuery({
    queryKey: ["admin-gallery-item", id],
    queryFn: () => apiGet(`/admin/gallery/${id}`),
  });

  if (q.isLoading) {
    return <div className="text-sm text-muted-foreground p-6">Loading…</div>;
  }
  if (q.isError || !q.data) {
    return (
      <div className="text-sm text-destructive p-6">
        Could not load this gallery item. It may have been deleted.
      </div>
    );
  }
  return <GalleryEditor item={q.data} />;
}
