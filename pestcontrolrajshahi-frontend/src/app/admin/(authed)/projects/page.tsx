"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminProjects() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-projects"], queryFn: () => apiGet("/admin/projects") });
  const items = q.data?.items || [];
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Projects</h1>
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground text-sm">
              No projects yet. (Friends Laundry doesn't use Projects — Seba Rajshahi does.)
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Title</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{p.title}</td>
                    <td className="p-3">
                      <Badge variant={p.status === "PUBLISHED" ? "default" : "secondary"}>{p.status}</Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const action = p.status === "PUBLISHED" ? "unpublish" : "publish";
                          await apiPost(`/admin/projects/${p.id}/${action}`);
                          qc.invalidateQueries({ queryKey: ["admin-projects"] });
                          toast.success("Updated");
                        }}
                      >
                        {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </Button>
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
