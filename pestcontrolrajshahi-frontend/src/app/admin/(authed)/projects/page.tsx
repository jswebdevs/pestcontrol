"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2 } from "lucide-react";

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminProjects() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => apiGet<{ items: any[] }>("/admin/projects"),
  });
  const items = q.data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Projects</h1>
          <p className="text-xs text-muted-foreground">Portfolio entries shown on the public site.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/projects/trash">
              <Trash2 className="size-4 mr-1.5" /> Trash
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/projects/new">
              <Plus className="size-4 mr-1.5" /> New Project
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          {items.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground text-sm">
              No projects yet. Click <strong>New Project</strong> to add your first portfolio entry.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Title</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="p-3 font-medium">
                      <Link href={`/admin/projects/${p.id}`} className="hover:text-primary">
                        {p.title}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(p.date)}</td>
                    <td className="p-3">
                      <Badge variant={p.status === "PUBLISHED" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/projects/${p.id}`}>
                            <Pencil className="size-4 mr-1.5" /> Edit
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const action = p.status === "PUBLISHED" ? "unpublish" : "publish";
                            try {
                              await apiPost(`/admin/projects/${p.id}/${action}`);
                              qc.invalidateQueries({ queryKey: ["admin-projects"] });
                              toast.success(action === "publish" ? "Published" : "Unpublished");
                            } catch (e: any) {
                              toast.error(e?.response?.data?.message || "Failed");
                            }
                          }}
                        >
                          {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
