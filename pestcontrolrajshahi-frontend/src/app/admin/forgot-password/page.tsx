"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const schema = z.object({
  identifier: z.string().min(3, "Enter your admin email, phone, or username"),
});

export default function AdminForgotPassword() {
  const [sent, setSent] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await apiPost("/auth/forgot-password", values);
      setSent(true);
      toast.success("If that account exists, we've sent a reset link.");
    } catch (e: any) {
      // Don't leak whether the account exists — match the success case.
      setSent(true);
      toast.success("If that account exists, we've sent a reset link.");
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <h1 className="font-heading text-3xl font-bold mb-3 text-center">Forgot password</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          Enter the email, phone, or username for your admin account.
          We&apos;ll email a reset link if a matching account exists.
        </p>
        <Card>
          <CardContent className="p-6">
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm">
                  Check your inbox (and spam) for a reset link. The link expires after 1 hour.
                </p>
                <Button asChild variant="outline">
                  <Link href="/admin/login">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="identifier">Email, phone or username</Label>
                  <Input id="identifier" {...form.register("identifier")} />
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
                <div className="text-center text-sm">
                  <Link href="/admin/login" className="text-primary hover:underline">
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
