const CORE = { stopColor: "var(--ex-accent, #e33e68)" };
const CORE_LIGHT = { stopColor: "var(--ex-accent-2, #f5708f)" };

export default function Logo({ className = "w-10 h-10" }) {
  return (
    <div className={`${className} flex items-center justify-center shrink-0`}>
      <svg viewBox="0 0 40 40" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Retenix">
        <defs>
          <linearGradient id="rxCore" x1="8" y1="6" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop style={CORE} />
            <stop offset="1" style={CORE_LIGHT} />
          </linearGradient>
          <radialGradient id="rxGlow" cx="50%" cy="50%" r="50%" gradientUnits="userSpaceOnUse">
            <stop style={CORE} stopOpacity="0.28" />
            <stop offset="1" style={CORE} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="14" fill="url(#rxGlow)" />
        <path d="M20 7.5 L30 13.5 V26.5 L20 32.5 L10 26.5 V13.5 Z" stroke="url(#rxCore)" strokeWidth="1.6" strokeLinejoin="round" opacity="0.9" />
        <path d="M10 13.5 L30 26.5 M30 13.5 L10 26.5" stroke="url(#rxCore)" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
        <circle cx="20" cy="20" r="5.4" fill="url(#rxCore)" />
        <circle cx="20" cy="20" r="2.1" fill="#ffffff" opacity="0.95" />
        <circle cx="10" cy="13.5" r="1.7" fill="url(#rxCore)" />
        <circle cx="30" cy="13.5" r="1.7" fill="url(#rxCore)" />
        <circle cx="10" cy="26.5" r="1.7" fill="url(#rxCore)" />
        <circle cx="30" cy="26.5" r="1.7" fill="url(#rxCore)" />
      </svg>
    </div>
  );
}
