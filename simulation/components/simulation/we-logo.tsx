import { cn } from "@/lib/utils";

/**
 * Würth Elektronik "WE" mark — a solid red square with the WE monogram,
 * matching the brand's primary identity. Decorative; not the official asset.
 */
export function WeLogo({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-[var(--radius-we)] bg-we-red font-bold leading-none text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label="Würth Elektronik"
    >
      WE
    </div>
  );
}
