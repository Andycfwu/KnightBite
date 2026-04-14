export function RutgersMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-[16px] bg-brand shadow-[0_12px_24px_rgba(177,31,36,0.22)] ${className}`}
      aria-hidden="true"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <text
          x="12"
          y="17"
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fontFamily="Georgia, 'Times New Roman', serif"
          fill="white"
        >
          R
        </text>
      </svg>
    </div>
  );
}
