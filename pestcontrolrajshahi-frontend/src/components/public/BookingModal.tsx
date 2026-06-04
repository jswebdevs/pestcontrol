"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface BookingContextValue {
  open: (opts?: { serviceId?: string; serviceSlug?: string }) => void;
  close: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within <BookingProvider>");
  return ctx;
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [presetServiceId, setPresetServiceId] = useState<string | undefined>();
  const [presetServiceSlug, setPresetServiceSlug] = useState<string | undefined>();

  const open = useCallback((opts?: { serviceId?: string; serviceSlug?: string }) => {
    setPresetServiceId(opts?.serviceId);
    setPresetServiceSlug(opts?.serviceSlug);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setPresetServiceId(undefined);
    setPresetServiceSlug(undefined);
  }, []);

  return (
    <BookingContext.Provider value={{ open, close }}>
      {children}
      <BookingDialog
        open={isOpen}
        onOpenChange={(o) => (o ? setOpen(true) : close())}
        presetServiceId={presetServiceId}
        presetServiceSlug={presetServiceSlug}
      />
    </BookingContext.Provider>
  );
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presetServiceId?: string;
  presetServiceSlug?: string;
}

function BookingDialog({ open, onOpenChange, presetServiceId, presetServiceSlug }: BookingDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<{ code: string } | null>(null);

  const servicesQ = useQuery({
    queryKey: ["services-public"],
    queryFn: () => apiGet<any[]>("/services"),
    enabled: open,
  });

  // Preset service: by id if given, otherwise by slug
  useEffect(() => {
    if (!open) return;
    if (presetServiceId) {
      setServiceId(presetServiceId);
      return;
    }
    if (presetServiceSlug && servicesQ.data) {
      const s = servicesQ.data.find((x) => x.slug === presetServiceSlug);
      if (s) setServiceId(s.id);
    }
  }, [open, presetServiceId, presetServiceSlug, servicesQ.data]);

  // Hydrate from /auth/me/customer for logged-in users
  useEffect(() => {
    if (!open) return;
    apiGet<any>("/auth/me/customer")
      .then((u) => {
        if (u?.name && !name) setName(u.name);
        if (u?.email && !email) setEmail(u.email);
        if (u?.phone && !phone) setPhone(u.phone);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function resetAndClose() {
    setSubmitted(null);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setServiceId("");
    setDetails("");
    onOpenChange(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone || !email || !address || !serviceId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setBusy(true);
    try {
      const result = await apiPost<{ order: any; createdNewUser: boolean }>("/orders", {
        name,
        phone,
        email,
        address,
        notes: details,
        items: [{ serviceId, quantity: 1 }],
      });
      setSubmitted({ code: result.order.code });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit booking");
    } finally {
      setBusy(false);
    }
  }

  const services = servicesQ.data || [];

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : resetAndClose())}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="size-14 text-primary mx-auto" />
            <h2 className="font-heading text-2xl font-bold">Booking received!</h2>
            <p className="text-muted-foreground text-sm">
              Reference: <strong className="text-foreground">{submitted.code}</strong>
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We'll call you back shortly to confirm timing and pricing.
            </p>
            <Button className="mt-4" onClick={resetAndClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">Book a service</DialogTitle>
              <DialogDescription>
                Fill in your details — we'll call you back to confirm.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="grid gap-4 pt-2">
              <div className="grid gap-2">
                <Label htmlFor="bm-name">Name</Label>
                <Input id="bm-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="bm-email">Email</Label>
                  <Input
                    id="bm-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bm-phone">Phone</Label>
                  <Input id="bm-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bm-address">Address</Label>
                <Textarea
                  id="bm-address"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bm-service">Service</Label>
                <select
                  id="bm-service"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="px-3 py-2 rounded-md border bg-background text-sm h-10"
                  required
                >
                  <option value="" disabled>
                    {servicesQ.isLoading ? "Loading…" : "Choose a service"}
                  </option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bm-details">Details</Label>
                <Textarea
                  id="bm-details"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="What's the problem? Any access notes?"
                />
              </div>
              <Button type="submit" disabled={busy} size="lg" className="mt-1">
                {busy ? "Submitting…" : "Submit booking"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
