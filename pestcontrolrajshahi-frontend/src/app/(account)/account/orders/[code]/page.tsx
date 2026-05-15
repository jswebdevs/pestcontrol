"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function MyOrderDetailPage() {
  const params = useParams<{ code: string }>();
  const q = useQuery({
    queryKey: ["my-order", params.code],
    queryFn: () => apiGet(`/users/me/orders/${params.code}`),
  });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const order = q.data;

  if (!order) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{order.code}</h1>
          <p className="text-muted-foreground text-sm">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge variant="secondary">{order.status}</Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-heading font-bold mb-4">Timeline</h2>
          <ol className="relative border-l-2 pl-6 space-y-4">
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

      <Card>
        <CardContent className="p-6">
          <h2 className="font-heading font-bold mb-4">Items</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium text-right">Qty</th>
                <th className="pb-2 font-medium text-right">Price</th>
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
        <CardContent className="p-6 space-y-2">
          <h2 className="font-heading font-bold mb-2">Details</h2>
          <div className="text-sm">
            <span className="text-muted-foreground">Address: </span>
            {order.address}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Schedule: </span>
            {new Date(order.preferredDate).toLocaleDateString()} · {order.timeWindow}
          </div>
          {order.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes: </span>
              {order.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-destructive border-destructive/40">
              Request cancellation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Request cancellation</DialogTitle>
            <DialogDescription>
              We'll review your request and contact you shortly.
            </DialogDescription>
            <Textarea
              placeholder="Reason for cancellation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)}>
                Close
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await apiPost("/contact", {
                      name: order.customerName,
                      email: order.customerEmail,
                      phone: order.customerPhone,
                      subject: `Cancellation request: ${order.code}`,
                      message: reason || "Please cancel my order.",
                      relatedOrderCode: order.code,
                    });
                    toast.success("Request submitted");
                    setCancelOpen(false);
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || "Failed");
                  }
                }}
              >
                Submit request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
