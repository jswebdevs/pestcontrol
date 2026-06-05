"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  id?: string;
  question: string;
  answerHtml?: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  if (!items?.length) {
    return <p className="text-sm text-muted-foreground">No FAQs yet.</p>;
  }
  return (
    <div className="divide-y rounded-2xl border bg-card overflow-hidden">
      {items.map((f, i) => {
        const isOpen = openIdx === i;
        return (
          <details
            key={f.id ?? i}
            open={isOpen}
            // Single-open accordion: clicking another row collapses the current one.
            onToggle={(e) => {
              const el = e.currentTarget as HTMLDetailsElement;
              if (el.open) setOpenIdx(i);
              else if (openIdx === i) setOpenIdx(null);
            }}
            className="group [&_summary::-webkit-details-marker]:hidden"
          >
            <summary
              className="flex items-start justify-between gap-4 cursor-pointer p-5 md:p-6 hover:bg-muted/50 transition-colors list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              role="button"
              aria-expanded={isOpen}
            >
              <h3 className="font-heading font-semibold text-base md:text-lg leading-snug pr-2">
                {f.question}
              </h3>
              <ChevronDown
                className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div
              className="px-5 md:px-6 pb-5 md:pb-6 -mt-1 text-sm md:text-base text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0"
              dangerouslySetInnerHTML={{ __html: f.answerHtml || "" }}
            />
          </details>
        );
      })}
    </div>
  );
}
