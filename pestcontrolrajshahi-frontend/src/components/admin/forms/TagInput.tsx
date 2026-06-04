"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = "Press Enter to add..." }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (!v || value.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="rounded-md border bg-background px-2 py-1.5 flex flex-wrap items-center gap-1.5">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => remove(tag)}
            className="rounded-full hover:bg-foreground/10 p-0.5"
            aria-label={`Remove ${tag}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        placeholder={value.length ? "" : placeholder}
        className="border-0 shadow-none h-7 flex-1 min-w-[8rem] focus-visible:ring-0 px-1"
      />
    </div>
  );
}
