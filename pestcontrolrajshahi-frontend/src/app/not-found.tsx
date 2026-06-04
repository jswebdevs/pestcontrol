import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container py-24 md:py-32 text-center">
      <div className="font-heading text-6xl md:text-7xl font-extrabold text-primary mb-3">404</div>
      <h1 className="font-heading text-2xl md:text-3xl font-bold mb-3">Page not found</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        The page you're looking for doesn't exist or has moved. Try one of the links below.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="rounded-full">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full">
          <Link href="/services">Browse services</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full">
          <Link href="/contact">Contact us</Link>
        </Button>
      </div>
    </section>
  );
}
