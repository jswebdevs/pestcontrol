"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AccountDashboard() {
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => apiGet("/auth/me/customer") });
  const ordersQ = useQuery({ queryKey: ["my-orders"], queryFn: () => apiGet("/users/me/orders?limit=10") });

  const orders = ordersQ.data?.items || [];
  const activeOrders = orders.filter((o: any) => ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(o.status));
  const recentOrders = orders.filter((o: any) => ["COMPLETED", "CANCELLED"].includes(o.status)).slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Hello, {meQ.data?.name?.split(" ")[0] || "there"} 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage orders and book new pickups.</p>
          </div>
          <Button asChild>
            <Link href="/order">Book a service</Link>
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-heading font-bold text-lg mb-3">Active orders</h2>
        {activeOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active orders.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeOrders.map((o: any) => (
              <Card key={o.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/account/orders/${o.code}`} className="font-heading font-bold text-primary">
                      {o.code}
                    </Link>
                    <Badge variant="secondary">{o.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {o.items?.length} items · ৳{Number(o.total).toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Scheduled: {new Date(o.preferredDate).toLocaleDateString()} · {o.timeWindow}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-heading font-bold text-lg mb-3">Recent orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Code</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o: any) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="p-3">
                        <Link href={`/account/orders/${o.code}`} className="text-primary hover:underline">
                          {o.code}
                        </Link>
                      </td>
                      <td className="p-3">{o.status}</td>
                      <td className="p-3">৳{Number(o.total).toFixed(0)}</td>
                      <td className="p-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
