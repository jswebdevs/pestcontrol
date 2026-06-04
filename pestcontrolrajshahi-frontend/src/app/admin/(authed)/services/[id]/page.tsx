"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ServiceEditor } from "@/components/admin/forms/ServiceEditor";

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const svcQ = useQuery({
    queryKey: ["admin-service", params.id],
    queryFn: () => apiGet(`/admin/services/${params.id}`),
  });
  const catsQ = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiGet("/admin/service-categories"),
  });
  if (svcQ.isLoading || catsQ.isLoading) {
    return <div className="p-6 text-muted-foreground text-sm">Loading…</div>;
  }
  if (!svcQ.data) {
    return <div className="p-6 text-muted-foreground text-sm">Service not found.</div>;
  }
  return <ServiceEditor initial={svcQ.data} categories={catsQ.data || []} />;
}
