// Shared renderer for /terms, /privacy, /refund-policy.
// Accepts either:
//   (A) The AI policy schema: { heading, intro, sections: [{heading, paragraphs[]}], lastUpdatedLine }
//   (B) A legacy TipTap doc: { type: 'doc', content: [{type:'paragraph', content:[{text}]}, ...] }
// (B) is kept for backwards compatibility — if anyone edits via the old admin editor, the page still renders.

interface PolicySection {
  heading: string;
  paragraphs: string[];
}

export interface LegalPolicyValue {
  heading?: string;
  intro?: string;
  sections?: PolicySection[];
  lastUpdatedLine?: string;
  // Legacy fallback
  content?: any[];
  type?: string;
}

function renderTipTapDoc(doc: { content?: any[] }): string {
  if (!doc?.content) return "";
  return doc.content
    .map((node: any) => {
      if (node.type === "paragraph") {
        const inner = (node.content || []).map((c: any) => c.text || "").join("");
        return `<p>${inner}</p>`;
      }
      if (node.type === "heading") {
        const inner = (node.content || []).map((c: any) => c.text || "").join("");
        const level = Math.max(2, Math.min(4, node.attrs?.level || 2));
        return `<h${level}>${inner}</h${level}>`;
      }
      return "";
    })
    .join("");
}

export function LegalPolicy({
  value,
  fallbackHeading,
}: {
  value: LegalPolicyValue | null | undefined;
  fallbackHeading: string;
}) {
  const sections = Array.isArray(value?.sections) ? value!.sections! : [];
  const hasNewShape = sections.length > 0 || value?.intro;
  const hasLegacyDoc = Array.isArray(value?.content) && value!.content!.length > 0;

  return (
    <article className="container max-w-3xl py-16 md:py-20">
      <header className="mb-10 text-center">
        <div className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
          Legal
        </div>
        <h1 className="font-heading text-3xl md:text-5xl font-bold leading-tight mb-3">
          {value?.heading || fallbackHeading}
        </h1>
        {value?.intro && (
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {value.intro}
          </p>
        )}
      </header>

      {hasNewShape ? (
        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="font-heading text-xl md:text-2xl font-bold mb-3">{s.heading}</h2>
              <div className="space-y-3">
                {(s.paragraphs || []).map((p, j) => (
                  <p key={j} className="text-foreground/85 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : hasLegacyDoc ? (
        // eslint-disable-next-line react/no-danger
        <div
          className="space-y-4 leading-relaxed [&_p]:my-3 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3"
          dangerouslySetInnerHTML={{ __html: renderTipTapDoc(value as any) }}
        />
      ) : (
        <p className="text-muted-foreground text-center">
          This document has not been published yet. Please check back soon.
        </p>
      )}

      {value?.lastUpdatedLine && (
        <p className="mt-12 pt-6 border-t text-xs text-muted-foreground text-center font-mono uppercase tracking-wider">
          {value.lastUpdatedLine}
        </p>
      )}
    </article>
  );
}
