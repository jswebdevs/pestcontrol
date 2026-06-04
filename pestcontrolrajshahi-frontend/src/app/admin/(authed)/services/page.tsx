"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil } from "lucide-react";

export default function AdminServicesPage() {
  const qc = useQueryClient();
  const svcQ = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => apiGet("/admin/services?limit=100"),
  });
  const catQ = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiGet("/admin/service-categories"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-bold">Services</h1>
        <Button asChild>
          <Link href="/admin/services/new">
            <Plus className="size-4 mr-1.5" /> New service
          </Link>
        </Button>
      </div>
      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <Card>
            <CardContent className="p-0 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Price</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Updated</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {(svcQ.data?.items || []).map((s: any) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="p-3">
                        <Link href={`/admin/services/${s.id}`} className="font-medium text-primary hover:underline">
                          {s.name}
                        </Link>
                        {s.featured && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            Featured
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{s.category?.name}</td>
                      <td className="p-3">
                        ৳{Number(s.basePrice || 0).toFixed(0)} {s.priceUnit}
                      </td>
                      <td className="p-3">
                        <Badge variant={s.status === "PUBLISHED" ? "default" : "secondary"}>{s.status}</Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const action = s.status === "PUBLISHED" ? "unpublish" : "publish";
                            await apiPost(`/admin/services/${s.id}/${action}`);
                            toast.success(action === "publish" ? "Published" : "Unpublished");
                            qc.invalidateQueries({ queryKey: ["admin-services"] });
                          }}
                        >
                          {s.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/services/${s.id}`}>
                            <Pencil className="size-4 mr-1" /> Edit
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {svcQ.data?.items?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-sm text-muted-foreground">
                        No services yet — create your first one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab
            categories={catQ.data || []}
            onChange={() => qc.invalidateQueries({ queryKey: ["admin-categories"] })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoriesTab({ categories, onChange }: { categories: any[]; onChange: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-5 grid gap-2">
          <Label>New category</Label>
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pest Control" />
            <Button
              onClick={async () => {
                if (!name) return;
                await apiPost("/admin/service-categories", { name });
                toast.success("Category added");
                setName("");
                onChange();
              }}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody>
              {categories.map((c: any) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground text-xs">/services?cat={c.slug}</td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm("Delete this category? Services will need to be reassigned.")) return;
                        try {
                          await apiDelete(`/admin/service-categories/${c.id}`);
                          toast.success("Deleted");
                          onChange();
                        } catch (e: any) {
                          toast.error(e?.response?.data?.message || "Failed");
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
