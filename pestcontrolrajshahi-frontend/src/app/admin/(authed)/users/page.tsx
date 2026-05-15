"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (role) params.set("role", role);
  const usersQ = useQuery({
    queryKey: ["admin-users", q, role],
    queryFn: () => apiGet(`/admin/users?${params.toString()}`),
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Users</h1>
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Search by name, email, phone..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="px-3 py-2 rounded-md border bg-background text-sm">
            <option value="">All roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-xs text-muted-foreground">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(usersQ.data?.items || []).map((u: any) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {u.email || ""}<br />{u.phone || ""}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">{u.role}</Badge>
                  </td>
                  <td className="p-3">{u.status}</td>
                  <td className="p-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const next = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                        await apiPatch(`/admin/users/${u.id}`, { status: next });
                        toast.success(`User ${next}`);
                        qc.invalidateQueries({ queryKey: ["admin-users"] });
                      }}
                    >
                      {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await apiPost(`/admin/users/${u.id}/force-logout`);
                        toast.success("Sessions revoked");
                      }}
                    >
                      Force logout
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
