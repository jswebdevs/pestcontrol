"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUSES = ["", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function AdminOrders() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (showCancelled) params.set("showCancelled", "true");

  const query = useQuery({
    queryKey: ["admin-orders", status, q, showCancelled],
    queryFn: () => apiGet(`/admin/orders?${params.toString()}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Orders</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/orders/trash">Trash</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <Input placeholder="Search by code, phone, email..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-md border bg-background text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s ? s.replace("_", " ") : "All statuses"}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
            Show cancelled
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-xs text-muted-foreground">
                <th className="p-3 font-medium">Code</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Services</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {(query.data?.items || []).map((o: any) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline font-medium">
                      {o.code}
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">{o.customerPhone}</div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground line-clamp-1 max-w-[260px]">
                    {o.items?.length} items
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(o.preferredDate).toLocaleDateString()} {o.timeWindow}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">{o.status}</Badge>
                  </td>
                  <td className="p-3 font-medium">৳{Number(o.total).toFixed(0)}</td>
                </tr>
              ))}
              {query.data?.items?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    No orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
