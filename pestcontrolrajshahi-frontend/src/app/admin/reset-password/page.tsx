"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string().min(8),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [done, setDone] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await apiPost("/auth/reset-password", { token, password: values.password });
      setDone(true);
      toast.success("Password updated. You can sign in now.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Reset failed — the link may have expired.");
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Missing or invalid reset link. Request a new one from the forgot password page.
        </p>
        <Button asChild variant="outline">
          <Link href="/admin/forgot-password">Request new link</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm">Your password has been reset.</p>
        <Button onClick={() => router.push("/admin/login")}>Sign in</Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" type="password" {...form.register("password")} />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" type="password" {...form.register("confirm")} />
        {form.formState.errors.confirm && (
          <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
        )}
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Updating..." : "Set new password"}
      </Button>
      <div className="text-center text-sm">
        <Link href="/admin/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}

export default function AdminResetPassword() {
  return (
    <div className="min-h-dvh grid place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <h1 className="font-heading text-3xl font-bold mb-3 text-center">Reset password</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          Choose a new password for your admin account.
        </p>
        <Card>
          <CardContent className="p-6">
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
              <ResetInner />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
