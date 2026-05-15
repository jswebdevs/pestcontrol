"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function AdminSettings() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-settings"], queryFn: () => apiGet("/admin/settings") });
  const data = q.data || {};
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Settings</h1>
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <JsonEditor sKey="business.info" value={data["business.info"]} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-settings"] })} />
        </TabsContent>
        <TabsContent value="header">
          <JsonEditor sKey="home.header" value={data["home.header"]} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-settings"] })} />
        </TabsContent>
        <TabsContent value="hero">
          <JsonEditor sKey="home.hero" value={data["home.hero"]} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-settings"] })} />
        </TabsContent>
        <TabsContent value="about">
          <JsonEditor sKey="home.about" value={data["home.about"]} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-settings"] })} />
        </TabsContent>
        <TabsContent value="footer">
          <div className="space-y-3">
            <JsonEditor sKey="footer.contact" value={data["footer.contact"]} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-settings"] })} />
            <JsonEditor sKey="footer.columns" value={data["footer.columns"]} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-settings"] })} />
          </div>
        </TabsContent>
        <TabsContent value="seo">
          <JsonEditor sKey="seo.default" value={data["seo.default"]} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-settings"] })} />
        </TabsContent>
        <TabsContent value="theme">
          <ThemeEditor colors={data["theme.colors"]} typography={data["theme.typography"]} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-settings"] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JsonEditor({ sKey, value, onSaved }: { sKey: string; value: any; onSaved: () => void }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(JSON.stringify(value ?? {}, null, 2));
  }, [value]);
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold">{sKey}</h3>
          <Button
            size="sm"
            onClick={async () => {
              try {
                const parsed = JSON.parse(text);
                await apiPatch(`/admin/settings/${sKey}`, { value: parsed });
                toast.success("Saved");
                onSaved();
              } catch (e: any) {
                toast.error("Invalid JSON: " + (e?.message || ""));
              }
            }}
          >
            Save
          </Button>
        </div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} className="font-mono text-xs" />
      </CardContent>
    </Card>
  );
}

function ThemeEditor({ colors, typography, onSaved }: { colors: any; typography: any; onSaved: () => void }) {
  const [c, setC] = useState(colors || {});
  const [t, setT] = useState(typography || {});
  useEffect(() => {
    setC(colors || {});
    setT(typography || {});
  }, [colors, typography]);

  const keys = Object.keys(c);

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-heading font-bold">Typography</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Heading font</Label>
              <Input value={t.headingFont || ""} onChange={(e) => setT({ ...t, headingFont: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Body font</Label>
              <Input value={t.bodyFont || ""} onChange={(e) => setT({ ...t, bodyFont: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Radius (px)</Label>
              <Input type="number" value={t.radius || 14} onChange={(e) => setT({ ...t, radius: parseInt(e.target.value, 10) })} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-heading font-bold">Colors (HSL: "H S% L%")</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {keys.map((k) => (
              <div key={k} className="flex items-center gap-2 text-sm">
                <Label className="w-44 shrink-0 text-xs">{k}</Label>
                <Input value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} className="font-mono text-xs" />
                <div className="size-8 rounded border" style={{ backgroundColor: `hsl(${c[k]})` }} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Button
        onClick={async () => {
          await apiPatch("/admin/settings/theme.colors", { value: c });
          await apiPatch("/admin/settings/theme.typography", { value: t });
          toast.success("Theme saved");
          onSaved();
        }}
      >
        Save theme
      </Button>
    </div>
  );
}
