"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ServiceEditor } from "@/components/admin/forms/ServiceEditor";

export default function NewServicePage() {
  const cats = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiGet("/admin/service-categories"),
  });
  if (cats.isLoading) return <div className="p-6 text-muted-foreground text-sm">Loading…</div>;
  return <ServiceEditor categories={cats.data || []} />;
}
