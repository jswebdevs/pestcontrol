"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiPatch } from "@/lib/api";
import { Loader2, Save } from "lucide-react";

interface SettingShellProps<T> {
  /** Setting key e.g. `home.header` */
  sKey: string;
  /** Section title shown above the form */
  title: string;
  /** Section sub-title / hint */
  description?: string;
  /** The current value from the parent */
  value: T;
  /** Render function returning the form. Pass the local draft + onChange. */
  children: (draft: T, setDraft: (next: T) => void) => React.ReactNode;
  /** Called after a successful save so the page can refetch. */
  onSaved?: () => void;
}

/**
 * Wraps a section editor with local draft state + a Save button so each section
 * is its own self-contained save unit. Discard reverts to the last server value.
 */
export function SettingShell<T>({ sKey, title, description, value, children, onSaved }: SettingShellProps<T>) {
  const [draft, setDraft] = useState<T>(value);
  const [saving, setSaving] = useState(false);

  // Re-sync when the parent value changes (e.g. fresh fetch after save)
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(value);

  async function save() {
    setSaving(true);
    try {
      await apiPatch(`/admin/settings/${sKey}`, { value: draft });
      toast.success(`${title} saved`);
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-heading font-bold">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(value)} disabled={!dirty || saving}>
              Discard
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={!dirty || saving}>
              {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />}
              Save
            </Button>
          </div>
        </div>
        <div>{children(draft, setDraft)}</div>
      </CardContent>
    </Card>
  );
}
