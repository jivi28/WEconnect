"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassSVGFilter() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute h-0 w-0"
    >
      <filter
        id="glass-distortion"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.008 0.012"
          numOctaves="2"
          seed="17"
          result="turbulence"
        />
        <feGaussianBlur in="turbulence" stdDeviation="1.4" result="softMap" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale="18"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

export type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  function GlassButton({ children, className, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "liquid-glass liquid-glass-brand group inline-flex items-center justify-center overflow-hidden rounded-xl px-6 py-3 font-semibold text-white",
          className,
        )}
        {...props}
      >
        <span className="liquid-glass-distortion" aria-hidden="true" />
        <span className="liquid-glass-sheen" aria-hidden="true" />
        <span className="relative z-10 transition-transform duration-500 ease-out group-hover:scale-[0.98]">
          {children}
        </span>
      </button>
    );
  },
);
