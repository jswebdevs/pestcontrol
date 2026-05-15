"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminTestimonials() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-testimonials"], queryFn: () => apiGet("/admin/testimonials") });
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  async function add() {
    if (!name || !body) return toast.error("Fill name and body");
    await apiPost("/admin/testimonials", { name, role, rating, body });
    toast.success("Added");
    setName(""); setRole(""); setBody("");
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Testimonials</h1>
      <Card>
        <CardContent className="p-5 grid gap-3">
          <h3 className="font-heading font-bold">Add new</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Role / company</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Rating</Label>
              <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(parseInt(e.target.value, 10))} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          </div>
          <Button onClick={add} className="w-fit">
            Add testimonial
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(q.data || []).map((t: any) => (
          <Card key={t.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{t.name}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm("Delete?")) return;
                    await apiDelete(`/admin/testimonials/${t.id}`);
                    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
                    toast.success("Deleted");
                  }}
                >
                  Delete
                </Button>
              </div>
              <div className="text-amber-500 mb-2">{"★".repeat(t.rating)}</div>
              <p className="text-sm text-muted-foreground">{t.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
