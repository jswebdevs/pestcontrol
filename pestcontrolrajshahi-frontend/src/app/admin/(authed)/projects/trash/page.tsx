"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default function AdminProjectsTrash() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-projects-trash"],
    queryFn: () => apiGet<{ items: any[] }>("/admin/projects?trash=true"),
  });
  const items = q.data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/projects">
              <ArrowLeft className="size-4 mr-1.5" /> Back to projects
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-bold mt-2">Trash</h1>
          <p className="text-xs text-muted-foreground">Soft-deleted projects.</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-xs text-muted-foreground">
                <th className="p-3 font-medium">Title</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-muted-foreground text-sm">
                    Trash is empty.
                  </td>
                </tr>
              ) : (
                items.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="p-3 font-medium">{p.title}</td>
                    <td className="p-3">
                      <Badge variant="secondary">{p.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await apiPost(`/admin/projects/${p.id}/restore`);
                            toast.success("Restored");
                            qc.invalidateQueries({ queryKey: ["admin-projects-trash"] });
                            qc.invalidateQueries({ queryKey: ["admin-projects"] });
                          } catch (e: any) {
                            toast.error(e?.response?.data?.message || "Failed");
                          }
                        }}
                      >
                        <RotateCcw className="size-4 mr-1.5" /> Restore
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
