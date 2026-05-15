"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/account";
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await apiPost("/auth/login", values);
      toast.success("Welcome back!");
      router.push(next);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Login failed");
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  return (
    <section className="container max-w-md py-16">
      <h1 className="font-heading text-3xl font-bold mb-3 text-center">Sign in</h1>
      <p className="text-muted-foreground mb-6 text-center text-sm">
        Use email, phone, or username to access your account.
      </p>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="identifier">Email, phone or username</Label>
              <Input id="identifier" {...form.register("identifier")} />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <Input id="password" type="password" {...form.register("password")} />
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <Button asChild variant="outline" type="button">
              <a href={`${apiUrl}/auth/google`}>Continue with Google</a>
            </Button>
            <p className="text-sm text-center text-muted-foreground mt-2">
              New here?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container py-16">Loading...</div>}>
      <LoginInner />
    </Suspense>
  );
}
