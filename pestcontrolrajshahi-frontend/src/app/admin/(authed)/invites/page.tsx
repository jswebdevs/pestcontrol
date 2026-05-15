"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AdminInvites() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-invites"], queryFn: () => apiGet("/admin/invites") });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");

  async function create() {
    if (!email) return toast.error("Email required");
    try {
      const r = await apiPost<any>("/admin/invites", { email, role });
      toast.success("Invite sent");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      if (r.link) {
        await navigator.clipboard.writeText(r.link);
        toast.success("Link copied to clipboard");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Invites</h1>
      <Card>
        <CardContent className="p-5 grid gap-3">
          <h3 className="font-heading font-bold">Send a new invite</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-1.5 md:col-span-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="px-3 py-2 rounded-md border bg-background">
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          </div>
          <Button onClick={create} className="w-fit">
            Send invite
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-xs text-muted-foreground">
                <th className="p-3 font-medium">Email/Phone</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Expires</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(q.data || []).map((inv: any) => (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="p-3">{inv.email || inv.phone}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{inv.role}</Badge>
                  </td>
                  <td className="p-3">{inv.acceptedAt ? "Accepted" : "Pending"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    {!inv.acceptedAt && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await apiDelete(`/admin/invites/${inv.id}`);
                          qc.invalidateQueries({ queryKey: ["admin-invites"] });
                          toast.success("Revoked");
                        }}
                      >
                        Revoke
                      </Button>
                    )}
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
