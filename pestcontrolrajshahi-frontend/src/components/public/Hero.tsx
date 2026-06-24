"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CldImage } from "@/components/shared/CldImage";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export function Hero({ slides }: { slides: any[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    const t = setInterval(() => embla.scrollNext(), 6000);
    return () => {
      embla.off("select", onSelect);
      clearInterval(t);
    };
  }, [embla]);

  if (!slides || slides.length === 0) return null;

  return (
    <section className="relative overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide: any, i: number) => (
            <div key={i} className="relative shrink-0 grow-0 basis-full">
              <div className="container py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    {slide.headline}
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-prose">{slide.sub}</p>
                  {slide.cta?.href && (
                    <Button asChild size="lg" className="rounded-full px-6">
                      <Link href={slide.cta.href}>
                        {slide.cta.label} <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <div className="aspect-[5/4] rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border overflow-hidden">
                    {slide.image ? (
                      <CldImage
                        publicId={slide.image}
                        alt={slide.imageAlt || (slide.headline ? `${slide.headline} — pest control & cleaning in Rajshahi` : "Pest control & cleaning service in Rajshahi")}
                        w={1200}
                        h={960}
                        crop="fill"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full grid place-items-center text-primary/50 font-heading text-2xl">
                        {slide.headline?.split(" ").slice(0, 2).join(" ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => embla?.scrollPrev()}
            className="hidden md:grid absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-background/80 backdrop-blur border place-items-center hover:bg-background"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => embla?.scrollNext()}
            className="hidden md:grid absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-background/80 backdrop-blur border place-items-center hover:bg-background"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => embla?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-primary" : "w-2 bg-muted"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
