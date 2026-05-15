"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    if (!phone) return toast.error("Enter your phone first");
    setBusy(true);
    try {
      await apiPost("/otp/send", { phone, purpose: "register" });
      toast.success("OTP sent to your phone");
      setStep(2);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const verifyAndRegister = async () => {
    setBusy(true);
    try {
      const v = await apiPost<{ otpToken: string }>("/otp/verify", { phone, purpose: "register", code });
      const token = v.otpToken;
      setOtpToken(token);
      await apiPost("/auth/register", {
        name,
        phone,
        email: email || undefined,
        username: username || undefined,
        password,
        otpToken: token,
      });
      toast.success("Account created!");
      router.push("/account");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to register");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="container max-w-md py-16">
      <h1 className="font-heading text-3xl font-bold mb-3 text-center">Create account</h1>
      <p className="text-muted-foreground mb-6 text-center text-sm">
        Phone verification required. Email and username are optional but help with login.
      </p>
      <Card>
        <CardContent className="p-6 grid gap-4">
          {step === 1 ? (
            <>
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Phone (Bangladeshi number)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017XXXXXXXX" />
              </div>
              <div className="grid gap-2">
                <Label>Email (optional)</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Username (optional)</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              </div>
              <Button onClick={sendOtp} disabled={busy || !name || !phone || password.length < 8}>
                {busy ? "Sending..." : "Send OTP & continue"}
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-2xl border bg-primary/5 p-4 text-sm">
                We sent a 6-digit code to <strong>{phone}</strong>.
              </div>
              <div className="grid gap-2">
                <Label>Verification code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
              </div>
              <Button onClick={verifyAndRegister} disabled={busy || code.length !== 6}>
                {busy ? "Creating account..." : "Verify & create account"}
              </Button>
              <Button variant="ghost" type="button" onClick={() => setStep(1)}>
                Back
              </Button>
            </>
          )}
          <p className="text-sm text-center text-muted-foreground mt-2">
            Already registered?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
