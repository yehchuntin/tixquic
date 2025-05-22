
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <Loader2
      style={{ width: size, height: size }}
      className={cn("animate-spin text-primary", className)}
    />
  );
}
