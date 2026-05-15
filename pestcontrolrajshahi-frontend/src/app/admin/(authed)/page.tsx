"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="font-heading text-3xl font-bold mt-1">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const q = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => apiGet("/admin/dashboard/summary?range=30d") });
  const d = q.data;
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Orders today" value={d?.ordersToday ?? "-"} />
        <Stat label="Orders this week" value={d?.ordersWeek ?? "-"} />
        <Stat label="Orders 30d" value={d?.ordersMonth ?? "-"} />
        <Stat label="Pending" value={d?.pendingCount ?? "-"} />
        <Stat label="Revenue today" value={`৳${(d?.revenueToday ?? 0).toFixed(0)}`} />
        <Stat label="Revenue 7d" value={`৳${(d?.revenueWeek ?? 0).toFixed(0)}`} />
        <Stat label="Revenue 30d" value={`৳${(d?.revenueTotal ?? 0).toFixed(0)}`} />
        <Stat label="Active customers" value={d?.activeCustomers ?? "-"} hint="Last 30 days" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold mb-3">Orders by status (30d)</h3>
            <div className="space-y-2">
              {(d?.statusGroups || []).map((g: any) => (
                <div key={g.status} className="flex justify-between text-sm">
                  <span>{g.status.replace("_", " ")}</span>
                  <span className="font-medium">{g.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold mb-3">Top services</h3>
            <div className="space-y-2">
              {(d?.topServices || []).map((s: any) => (
                <div key={s.serviceId} className="flex justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
