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

export default function AdminFaqs() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-faqs"], queryFn: () => apiGet("/admin/faqs") });
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  async function add() {
    if (!question || !answer) return toast.error("Fill question and answer");
    await apiPost("/admin/faqs", {
      question,
      answer: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: answer }] }],
      },
    });
    toast.success("FAQ added");
    setQuestion(""); setAnswer("");
    qc.invalidateQueries({ queryKey: ["admin-faqs"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">FAQs</h1>
      <Card>
        <CardContent className="p-5 grid gap-3">
          <h3 className="font-heading font-bold">Add new</h3>
          <div className="grid gap-1.5">
            <Label>Question</Label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Answer</Label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} />
          </div>
          <Button onClick={add} className="w-fit">
            Add
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(q.data || []).map((f: any) => (
          <Card key={f.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-semibold">{f.question}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm("Delete?")) return;
                    await apiDelete(`/admin/faqs/${f.id}`);
                    qc.invalidateQueries({ queryKey: ["admin-faqs"] });
                    toast.success("Deleted");
                  }}
                >
                  Delete
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {f.answer?.content?.[0]?.content?.[0]?.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
