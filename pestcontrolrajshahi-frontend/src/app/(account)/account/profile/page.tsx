"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export default function ProfilePage() {
  const qc = useQueryClient();
  const meQ = useQuery({ queryKey: ["me-full"], queryFn: () => apiGet("/users/me") });
  const me = meQ.data;
  const [name, setName] = useState(me?.name || "");
  const [emailDraft, setEmailDraft] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");

  if (!me) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Profile</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-heading font-bold">Identity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                Email {me.email && <Lock className="size-3 text-muted-foreground" />}
              </Label>
              {me.email ? (
                <div className="text-sm py-2.5 px-3 rounded-md border bg-muted/30">{me.email}</div>
              ) : (
                <div className="flex gap-2">
                  <Input value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} placeholder="you@example.com" />
                  <Button
                    onClick={async () => {
                      try {
                        await apiPost("/users/me/email", { email: emailDraft });
                        toast.success("Verification link sent");
                      } catch (e: any) {
                        toast.error(e?.response?.data?.message || "Failed");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                Username {me.username && <Lock className="size-3 text-muted-foreground" />}
              </Label>
              {me.username ? (
                <div className="text-sm py-2.5 px-3 rounded-md border bg-muted/30">@{me.username}</div>
              ) : (
                <div className="flex gap-2">
                  <Input value={usernameDraft} onChange={(e) => setUsernameDraft(e.target.value.toLowerCase())} placeholder="username" />
                  <Button
                    onClick={async () => {
                      try {
                        await apiPost("/users/me/username", { username: usernameDraft });
                        toast.success("Username set");
                        qc.invalidateQueries({ queryKey: ["me-full"] });
                      } catch (e: any) {
                        toast.error(e?.response?.data?.message || "Failed");
                      }
                    }}
                  >
                    Set
                  </Button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Once set, email and username cannot be changed. Contact support if needed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-heading font-bold">Personal</h2>
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Button
              size="sm"
              className="w-fit mt-1"
              onClick={async () => {
                try {
                  await apiPatch("/users/me", { name });
                  toast.success("Saved");
                  qc.invalidateQueries({ queryKey: ["me-full"] });
                } catch (e: any) {
                  toast.error(e?.response?.data?.message || "Failed");
                }
              }}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-heading font-bold">Phone</h2>
          <div className="text-sm">Current: <strong>{me.phone || "—"}</strong></div>
          {me.phoneChangedAt && (
            <p className="text-xs text-muted-foreground">
              Phone last changed {new Date(me.phoneChangedAt).toLocaleDateString()}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-heading font-bold">Password</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Current password</Label>
              <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>New password</Label>
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
