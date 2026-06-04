"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

interface RepeaterProps<T> {
  items: T[];
  onChange: (next: T[]) => void;
  renderItem: (item: T, idx: number, update: (patch: Partial<T>) => void) => React.ReactNode;
  newItem: () => T;
  addLabel?: string;
  itemLabel?: (item: T, idx: number) => string;
  min?: number;
  max?: number;
}

export function Repeater<T>({
  items,
  onChange,
  renderItem,
  newItem,
  addLabel = "Add item",
  itemLabel,
  min,
  max,
}: RepeaterProps<T>) {
  const update = (idx: number) => (patch: Partial<T>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const add = () => onChange([...items, newItem()]);

  return (
    <div className="space-y-3">
      {items.map((it, idx) => (
        <Card key={idx} className="bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {itemLabel ? itemLabel(it, idx) : `Item ${idx + 1}`}
              </span>
              <div className="flex items-center gap-1">
                <Button type="button" size="icon" variant="ghost" className="size-7" disabled={idx === 0} onClick={() => move(idx, -1)} aria-label="Move up">
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="size-7" disabled={idx === items.length - 1} onClick={() => move(idx, 1)} aria-label="Move down">
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive hover:bg-destructive/10"
                  disabled={typeof min === "number" && items.length <= min}
                  onClick={() => remove(idx)}
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
            {renderItem(it, idx, update(idx))}
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={add} disabled={typeof max === "number" && items.length >= max}>
        <Plus className="size-4 mr-1.5" /> {addLabel}
      </Button>
    </div>
  );
}
