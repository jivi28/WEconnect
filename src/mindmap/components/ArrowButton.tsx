interface ArrowButtonProps {
  size?: number
  className?: string
}

/** The small red square + white arrow CTA mark used throughout WU Elektronik's site. */
export default function ArrowButton({ size = 28, className = '' }: ArrowButtonProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-brand-red transition-colors group-hover:bg-brand-redDark ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
