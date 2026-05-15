"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MyOrdersPage() {
  const q = useQuery({ queryKey: ["my-orders-all"], queryFn: () => apiGet("/users/me/orders?limit=50") });
  const items = q.data?.items || [];
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">My orders</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No orders yet.</p>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Code</th>
                  <th className="p-3 font-medium">Services</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o: any) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="p-3">
                      <Link href={`/account/orders/${o.code}`} className="text-primary hover:underline font-medium">
                        {o.code}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {o.items?.map((i: any) => i.service?.name).join(", ")}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{o.status}</Badge>
                    </td>
                    <td className="p-3 font-medium">৳{Number(o.total).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
