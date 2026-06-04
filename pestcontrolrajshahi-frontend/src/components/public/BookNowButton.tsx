"use client";

import { Button } from "@/components/ui/button";
import { useBooking } from "@/components/public/BookingModal";

interface BookNowButtonProps {
  serviceId?: string;
  serviceSlug?: string;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function BookNowButton({
  serviceId,
  serviceSlug,
  size = "lg",
  className,
  variant = "default",
  children = "Book now",
}: BookNowButtonProps) {
  const { open } = useBooking();
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={() => open({ serviceId, serviceSlug })}
    >
      {children}
    </Button>
  );
}
