"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface OrderItem {
  serviceId: string;
  serviceName: string;
  priceUnit?: string;
  unitPrice: number;
  quantity: number;
}

const TIME_WINDOWS = ["9-12", "12-3", "3-6"];
const STORAGE_KEY = "orderDraft";

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="container py-16">Loading...</div>}>
      <OrderInner />
    </Suspense>
  );
}

function OrderInner() {
  const router = useRouter();
  const search = useSearchParams();
  const presetSlug = search.get("service");
  const [step, setStep] = useState(1);

  // form state
  const [items, setItems] = useState<OrderItem[]>([]);
  const [date, setDate] = useState("");
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [code, setCode] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<{ code: string; createdNewUser: boolean } | null>(null);

  const servicesQ = useQuery({
    queryKey: ["services"],
    queryFn: () => apiGet("/services"),
  });
  const categoriesQ = useQuery({
    queryKey: ["service-categories"],
    queryFn: () => apiGet("/service-categories"),
  });

  // Load draft + me
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        setItems(draft.items || []);
        setDate(draft.date || "");
        setTimeWindow(draft.timeWindow || TIME_WINDOWS[0]);
        setName(draft.name || "");
        setPhone(draft.phone || "");
        setEmail(draft.email || "");
        setAddress(draft.address || "");
        setArea(draft.area || "");
        setNotes(draft.notes || "");
      } catch {}
    }
    apiGet("/auth/me/customer")
      .then((u) => {
        setMe(u);
        if (u?.name) setName(u.name);
        if (u?.phone) setPhone(u.phone);
        if (u?.email) setEmail(u.email);
      })
      .catch(() => {});
  }, []);

  // Save draft
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, date, timeWindow, name, phone, email, address, area, notes }),
    );
  }, [items, date, timeWindow, name, phone, email, address, area, notes]);

  // Preset service from query
  useEffect(() => {
    if (presetSlug && servicesQ.data && items.length === 0) {
      const s = servicesQ.data.find((x: any) => x.slug === presetSlug);
      if (s) {
        addItem(s);
      }
    }
  }, [presetSlug, servicesQ.data]);

  const total = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [items]);

  function addItem(s: any) {
    setItems((prev) => {
      const existing = prev.find((p) => p.serviceId === s.id);
      if (existing) {
        return prev.map((p) => (p.serviceId === s.id ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [
        ...prev,
        {
          serviceId: s.id,
          serviceName: s.name,
          priceUnit: s.priceUnit,
          unitPrice: Number(s.basePrice || 0),
          quantity: 1,
        },
      ];
    });
  }

  function updateQty(serviceId: string, q: number) {
    if (q <= 0) {
      setItems((prev) => prev.filter((p) => p.serviceId !== serviceId));
      return;
    }
    setItems((prev) => prev.map((p) => (p.serviceId === serviceId ? { ...p, quantity: q } : p)));
  }

  const isLoggedIn = !!me;

  async function sendOtp() {
    if (!phone) return toast.error("Enter phone first");
    setBusy(true);
    try {
      await apiPost("/otp/send", { phone, purpose: "order" });
      toast.success("OTP sent");
      setStep(4);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    try {
      const v = await apiPost<{ otpToken: string }>("/otp/verify", { phone, purpose: "order", code });
      setOtpToken(v.otpToken);
      setStep(5);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Invalid OTP");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    try {
      const result = await apiPost<{ order: any; createdNewUser: boolean }>("/orders", {
        name,
        phone,
        email,
        address,
        area,
        preferredDate: new Date(date).toISOString(),
        timeWindow,
        notes,
        items: items.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity })),
        otpToken: otpToken || undefined,
      });
      localStorage.removeItem(STORAGE_KEY);
      setSubmitted({ code: result.order.code, createdNewUser: result.createdNewUser });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Order failed");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <section className="container max-w-2xl py-16 text-center">
        <CheckCircle2 className="size-16 text-primary mx-auto mb-4" />
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Order received!</h1>
        <p className="text-muted-foreground mb-2">Your order code is</p>
        <div className="font-heading font-bold text-2xl text-primary mb-6">{submitted.code}</div>
        {submitted.createdNewUser && (
          <div className="rounded-2xl border bg-primary/5 p-4 text-sm mb-6 text-left">
            We've created an account for you. Check your email <strong>{email}</strong> for login details.
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <a href={`/account/orders/${submitted.code}`}>Track order</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/">Back to home</a>
          </Button>
        </div>
      </section>
    );
  }

  const categories = categoriesQ.data || [];
  const services = servicesQ.data || [];

  return (
    <section className="container max-w-4xl py-12">
      <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">Book a service</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Step {step} of 5{isLoggedIn ? " (you're signed in)" : ""}
      </p>

      <div className="flex gap-1 mb-8">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {step === 1 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading font-bold text-xl mb-4">Pick services</h2>
                {categories.map((cat: any) => (
                  <div key={cat.id} className="mb-6">
                    <h3 className="font-semibold text-sm mb-2">{cat.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {services
                        .filter((s: any) => s.categoryId === cat.id)
                        .map((s: any) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => addItem(s)}
                            className="text-left rounded-xl border bg-card p-3 hover:border-primary transition"
                          >
                            <div className="font-medium text-sm">{s.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              ৳{Number(s.basePrice || 0).toFixed(0)} {s.priceUnit}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                <Button
                  disabled={items.length === 0}
                  onClick={() => setStep(2)}
                  className="mt-3"
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardContent className="p-6 grid gap-4">
                <h2 className="font-heading font-bold text-xl">Schedule</h2>
                <div className="grid gap-2">
                  <Label>Preferred date</Label>
                  <Input
                    type="date"
                    value={date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Time window</Label>
                  <div className="flex gap-2">
                    {TIME_WINDOWS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setTimeWindow(w)}
                        className={`px-4 py-2 rounded-full text-sm border ${timeWindow === w ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}
                      >
                        {w} PM
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(isLoggedIn ? 5 : 3)} disabled={!date}>
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && !isLoggedIn && (
            <Card>
              <CardContent className="p-6 grid gap-4">
                <h2 className="font-heading font-bold text-xl">Contact & address</h2>
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Area / landmark (optional)</Label>
                  <Input value={area} onChange={(e) => setArea(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Notes (optional)</Label>
                  <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    onClick={sendOtp}
                    disabled={busy || !name || !phone || !email || !address}
                  >
                    {busy ? "Sending OTP..." : "Verify phone & continue"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && !isLoggedIn && (
            <Card>
              <CardContent className="p-6 grid gap-4">
                <h2 className="font-heading font-bold text-xl">Verify phone</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <strong>{phone}</strong>.
                </p>
                <div className="grid gap-2">
                  <Label>Code</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button onClick={verifyOtp} disabled={busy || code.length !== 6}>
                    Verify
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <Card>
              <CardContent className="p-6 grid gap-3">
                <h2 className="font-heading font-bold text-xl">Confirm & submit</h2>
                {isLoggedIn ? (
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <Label>Address</Label>
                      <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Notes (optional)</Label>
                      <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-primary/5 p-4 text-sm">
                    ✓ Phone verified
                  </div>
                )}
                <Button onClick={submit} disabled={busy || items.length === 0 || !date || !address} className="mt-3">
                  {busy ? "Submitting..." : "Place order"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="md:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-5">
              <h3 className="font-heading font-bold mb-3">Your order</h3>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items yet.</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {items.map((it) => (
                    <div key={it.serviceId} className="text-sm">
                      <div className="font-medium">{it.serviceName}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1">
                          <button
                            className="size-6 rounded border grid place-items-center"
                            onClick={() => updateQty(it.serviceId, it.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs">{it.quantity}</span>
                          <button
                            className="size-6 rounded border grid place-items-center"
                            onClick={() => updateQty(it.serviceId, it.quantity + 1)}
                          >
                            +
                          </button>
                          <span className="text-xs text-muted-foreground ml-2">{it.priceUnit}</span>
                        </div>
                        <div className="font-medium">৳{(it.unitPrice * it.quantity).toFixed(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {items.length > 0 && (
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-sm">Total</span>
                  <span className="font-heading text-xl font-bold">৳{total.toFixed(0)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  );
}
