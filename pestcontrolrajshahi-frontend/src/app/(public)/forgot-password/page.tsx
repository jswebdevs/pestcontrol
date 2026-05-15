"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="container max-w-md py-16">
      <h1 className="font-heading text-3xl font-bold mb-3 text-center">Forgot password</h1>
      <p className="text-muted-foreground mb-6 text-center text-sm">
        Enter your email or phone. We'll send a reset link (or OTP if phone-only).
      </p>
      <Card>
        <CardContent className="p-6 grid gap-4">
          {submitted ? (
            <div className="rounded-2xl border bg-primary/5 p-4 text-sm">
              ✓ If we found an account, instructions are on the way.
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label>Email or phone</Label>
                <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              </div>
              <Button
                onClick={async () => {
                  try {
                    await apiPost("/auth/forgot-password", { identifier });
                    setSubmitted(true);
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || "Failed");
                  }
                }}
              >
                Send reset instructions
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
