"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminServicesPage() {
  const qc = useQueryClient();
  const svcQ = useQuery({ queryKey: ["admin-services"], queryFn: () => apiGet("/admin/services?limit=100") });
  const catQ = useQuery({ queryKey: ["admin-categories"], queryFn: () => apiGet("/admin/service-categories") });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Services & Categories</h1>
      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="services">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{svcQ.data?.total || 0} services</span>
            <ServiceCreateDialog onCreated={() => qc.invalidateQueries({ queryKey: ["admin-services"] })} categories={catQ.data || []} />
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Price</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {(svcQ.data?.items || []).map((s: any) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 text-muted-foreground">{s.category?.name}</td>
                      <td className="p-3">৳{Number(s.basePrice || 0).toFixed(0)} {s.priceUnit}</td>
                      <td className="p-3">
                        <Badge variant={s.status === "PUBLISHED" ? "default" : "secondary"}>{s.status}</Badge>
                      </td>
                      <td className="p-3">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab onChange={() => qc.invalidateQueries({ queryKey: ["admin-categories"] })} categories={catQ.data || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoriesTab({ categories, onChange }: { categories: any[]; onChange: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" />
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
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody>
              {categories.map((c: any) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground text-xs">{c.slug}</td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm("Delete this category?")) return;
                        await apiDelete(`/admin/service-categories/${c.id}`);
                        toast.success("Deleted");
                        onChange();
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

function ServiceCreateDialog({ onCreated, categories }: { onCreated: () => void; categories: any[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("per piece");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New service</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>New service</DialogTitle>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Short description</Label>
            <Textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2} />
          </div>
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="px-3 py-2 rounded-md border bg-background">
              <option value="">Select...</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Base price (BDT)</Label>
              <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Unit</Label>
              <Input value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name || !shortDesc || !categoryId}
            onClick={async () => {
              try {
                await apiPost("/admin/services", {
                  name,
                  shortDesc,
                  categoryId,
                  basePrice: basePrice ? Number(basePrice) : undefined,
                  priceUnit,
                  status: "DRAFT",
                });
                toast.success("Service created");
                setOpen(false);
                onCreated();
                setName(""); setShortDesc(""); setBasePrice(""); setCategoryId("");
              } catch (e: any) {
                toast.error(e?.response?.data?.message || "Failed");
              }
            }}
          >
            Create as draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
