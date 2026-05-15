"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function ResetInner() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [newPassword, setNewPassword] = useState("");

  return (
    <section className="container max-w-md py-16">
      <h1 className="font-heading text-3xl font-bold mb-3 text-center">Reset password</h1>
      <Card>
        <CardContent className="p-6 grid gap-4">
          {!token ? (
            <p className="text-sm text-muted-foreground">Invalid or missing reset link.</p>
          ) : (
            <>
              <div className="grid gap-2">
                <Label>New password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              </div>
              <Button
                disabled={newPassword.length < 8}
                onClick={async () => {
                  try {
                    await apiPost("/auth/reset-password", { token, newPassword });
                    toast.success("Password updated. Please sign in.");
                    router.push("/login");
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || "Reset failed");
                  }
                }}
              >
                Update password
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container py-16">Loading...</div>}>
      <ResetInner />
    </Suspense>
  );
}
