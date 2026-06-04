"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ProjectEditor } from "@/components/admin/forms/ProjectEditor";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ["admin-project", id],
    queryFn: () => apiGet<any>(`/admin/projects/${id}`),
    enabled: !!id,
  });

  if (q.isLoading) return <div className="text-sm text-muted-foreground">Loading project…</div>;
  if (q.isError || !q.data) return <div className="text-sm text-destructive">Failed to load project.</div>;

  return <ProjectEditor initial={q.data} />;
}
