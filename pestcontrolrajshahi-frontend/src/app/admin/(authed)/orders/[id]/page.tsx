"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

export default function AdminOrderDetail() {
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-order", params.id],
    queryFn: () => apiGet(`/admin/orders/${params.id}`),
  });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const order = q.data;
  if (!order) return <div>Loading...</div>;

  async function setStatus(status: string) {
    try {
      await apiPatch(`/admin/orders/${order.id}/status`, { status, note: statusNote });
      toast.success(`Status changed to ${status}`);
      qc.invalidateQueries({ queryKey: ["admin-order", order.id] });
      setStatusNote("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  async function cancel() {
    try {
      await apiPost(`/admin/orders/${order.id}/cancel`, { reason });
      toast.success("Order cancelled");
      setCancelOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-order", order.id] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{order.code}</h1>
          <p className="text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge variant="secondary">{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold mb-2">Customer</h3>
            <div className="text-sm space-y-1">
              <div>{order.customerName}</div>
              <div className="text-muted-foreground">{order.customerPhone}</div>
              <div className="text-muted-foreground">{order.customerEmail}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold mb-2">Schedule</h3>
            <div className="text-sm space-y-1">
              <div>{new Date(order.preferredDate).toLocaleDateString()}</div>
              <div className="text-muted-foreground">{order.timeWindow}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold mb-2">Address</h3>
            <div className="text-sm">{order.address}</div>
            {order.area && <div className="text-xs text-muted-foreground">{order.area}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-heading font-bold mb-3">Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium text-right">Qty</th>
                <th className="pb-2 font-medium text-right">Unit</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((i: any) => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="py-2">{i.service?.name}</td>
                  <td className="py-2 text-right">{i.quantity}</td>
                  <td className="py-2 text-right">৳{Number(i.unitPrice).toFixed(0)}</td>
                  <td className="py-2 text-right">৳{Number(i.lineTotal).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-4 border-t flex justify-between">
            <span className="font-medium">Total</span>
            <span className="font-heading text-xl font-bold">৳{Number(order.total).toFixed(0)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-heading font-bold mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {STATUSES.map((s) => (
              <Button
                key={s}
                variant={order.status === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(s)}
                disabled={order.status === s}
              >
                {s.replace("_", " ")}
              </Button>
            ))}
          </div>
          <Textarea
            placeholder="Optional note (sent to customer)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            rows={2}
            className="mb-3"
          />
          <div className="flex flex-wrap gap-2">
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/40">
                  Cancel order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Cancel this order?</DialogTitle>
                <DialogDescription>
                  The customer will be notified by email and SMS. Cancelling is separate from deleting.
                </DialogDescription>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCancelOpen(false)}>
                    Close
                  </Button>
                  <Button variant="destructive" disabled={!reason} onClick={cancel}>
                    Confirm cancellation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={async () => {
                if (!confirm("Move this order to trash? Customer will NOT be notified. Recoverable from /admin/orders/trash.")) return;
                try {
                  const { apiDelete } = await import("@/lib/api");
                  await apiDelete(`/admin/orders/${order.id}`);
                  toast.success("Moved to trash");
                  window.location.href = "/admin/orders";
                } catch (e: any) {
                  toast.error(e?.response?.data?.message || "Failed");
                }
              }}
            >
              Move to Trash
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-heading font-bold mb-3">Timeline</h3>
          <ol className="relative border-l-2 pl-6 space-y-3">
            {order.statusLogs?.map((log: any, i: number) => (
              <li key={i} className="relative">
                <div className="absolute -left-[34px] size-4 rounded-full bg-primary" />
                <div className="font-medium text-sm">{log.status.replace("_", " ")}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
                {log.note && <div className="text-sm mt-1 text-muted-foreground">{log.note}</div>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
