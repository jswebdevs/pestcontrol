"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export default function AdminLogin() {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await apiPost("/auth/admin/login", values);
      toast.success("Welcome back");
      router.push("/admin");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <h1 className="font-heading text-3xl font-bold mb-3 text-center">Admin sign in</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          {process.env.NEXT_PUBLIC_SITE_NAME} — administrative access
        </p>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <Label>Email, phone or username</Label>
                <Input {...form.register("identifier")} />
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label>Password</Label>
                  <Link
                    href="/admin/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input type="password" {...form.register("password")} />
              </div>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
