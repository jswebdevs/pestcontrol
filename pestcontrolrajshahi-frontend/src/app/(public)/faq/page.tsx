import { serverFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 120;

export default async function FaqPage() {
  const faqs = await serverFetch<any[]>("/faqs");
  return (
    <section className="container max-w-3xl py-16 md:py-20">
      <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Frequently asked questions</h1>
      <p className="text-muted-foreground mb-8">Quick answers to common questions.</p>
      <div className="space-y-3">
        {(faqs || []).map((f: any) => (
          <Card key={f.id}>
            <CardContent className="p-6">
              <h3 className="font-heading font-semibold text-lg mb-2">{f.question}</h3>
              <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: f.answerHtml || "" }} />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
