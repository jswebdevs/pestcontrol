import { getSettings } from "@/lib/settings";

export const revalidate = 60;

function renderDoc(doc: any): string {
  if (!doc?.content) return "";
  return doc.content
    .map((node: any) => {
      if (node.type === "paragraph") {
        const inner = (node.content || [])
          .map((c: any) => c.text || "")
          .join("");
        return `<p>${inner}</p>`;
      }
      return "";
    })
    .join("");
}

export default async function PrivacyPage() {
  const settings = await getSettings();
  const html = renderDoc(settings["legal.privacy"]);
  return (
    <article className="container max-w-3xl py-16 prose prose-slate max-w-none">
      <h1>Privacy Policy</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
