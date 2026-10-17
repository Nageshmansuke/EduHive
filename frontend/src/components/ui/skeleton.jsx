import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-[10px] bg-muted", className)}
      {...props} />
  );
}

export { Skeleton }
