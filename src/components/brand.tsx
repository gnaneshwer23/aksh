import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={cn("size-7 shrink-0", className)}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="7" height="24" rx="2" fill="currentColor" />
      <rect x="11" y="2" width="15" height="11" rx="2" fill="currentColor" />
      <rect x="11" y="15" width="9" height="11" rx="2" fill="currentColor" />
      <rect x="22" y="15" width="4" height="11" rx="1.5" fill="#FF6B1A" />
    </svg>
  )
}

export function Brand({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "hero"
  className?: string
}) {
  const sizes = {
    sm: "text-lg tracking-tight",
    md: "text-2xl tracking-tight",
    lg: "text-4xl tracking-[-0.03em]",
    hero: "text-5xl sm:text-6xl tracking-[-0.04em]",
  }

  return (
    <div className={cn("flex items-center gap-2.5 text-foreground", className)}>
      <BrandMark
        className={cn(
          size === "hero" && "size-11 sm:size-12",
          size === "lg" && "size-9",
          size === "md" && "size-7",
          size === "sm" && "size-5"
        )}
      />
      <span className={cn("font-heading font-semibold leading-none", sizes[size])}>
        aksh
      </span>
    </div>
  )
}
