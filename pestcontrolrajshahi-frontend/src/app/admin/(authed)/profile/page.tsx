"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AdminProfile() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-me"], queryFn: () => apiGet("/users/me") });
  const me = q.data;
  const [name, setName] = useState(me?.name || "");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  if (!me) return <div>Loading...</div>;
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">My profile</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-heading font-bold">Identity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Email</Label>
              <div className="py-2 px-3 rounded-md border bg-muted/30 mt-1">{me.email}</div>
            </div>
            <div>
              <Label>Phone</Label>
              <div className="py-2 px-3 rounded-md border bg-muted/30 mt-1">{me.phone}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-heading font-bold">Personal</h2>
          <div className="grid gap-2 max-w-md">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Button
              size="sm"
              className="w-fit mt-1"
              onClick={async () => {
                await apiPatch("/users/me", { name });
                toast.success("Saved");
                qc.invalidateQueries({ queryKey: ["admin-me"] });
              }}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-heading font-bold">Password</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div className="grid gap-2">
              <Label>Current</Label>
              <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>New</Label>
              <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            </div>
          </div>
          <Button
            disabled={newPwd.length < 8}
            onClick={async () => {
              try {
                await apiPatch("/users/me/password", { currentPassword: currentPwd, newPassword: newPwd });
                toast.success("Password updated");
                setCurrentPwd("");
                setNewPwd("");
              } catch (e: any) {
                toast.error(e?.response?.data?.message || "Failed");
              }
            }}
          >
            Update password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
