/* ---- Premium Hero Illustration ---- */
export function HeroIllustration() {
  return (
    <svg className="w-full h-full min-h-[200px]" viewBox="0 0 600 220" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f97316" stopOpacity="0.12" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="g2" x1="300" y1="0" x2="600" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" stopOpacity="0.06" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#09090b" /><stop offset="1" stopColor="#525252" />
        </linearGradient>
        <linearGradient id="bar1d" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#fafafa" /><stop offset="1" stopColor="#a3a3a3" />
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {/* Background blobs */}
      <ellipse cx="120" cy="110" rx="220" ry="130" fill="url(#g1)" />
      <ellipse cx="480" cy="90" rx="200" ry="110" fill="url(#g2)" />

      {/* Chart bars with gradient */}
      <g className="dark:hidden">
        <rect x="50" y="140" width="18" height="48" rx="4" fill="url(#bar1)" opacity="0.1" />
        <rect x="78" y="110" width="18" height="78" rx="4" fill="url(#bar1)" opacity="0.2" />
        <rect x="106" y="80" width="18" height="108" rx="4" fill="url(#bar1)" opacity="0.35" />
        <rect x="134" y="55" width="18" height="133" rx="4" fill="url(#bar1)" opacity="0.5" />
        <rect x="162" y="35" width="18" height="153" rx="4" fill="url(#bar1)" opacity="0.7" />
        <rect x="190" y="18" width="18" height="170" rx="4" fill="url(#bar1)" />
      </g>
      <g className="hidden dark:block">
        <rect x="50" y="140" width="18" height="48" rx="4" fill="url(#bar1d)" opacity="0.1" />
        <rect x="78" y="110" width="18" height="78" rx="4" fill="url(#bar1d)" opacity="0.2" />
        <rect x="106" y="80" width="18" height="108" rx="4" fill="url(#bar1d)" opacity="0.35" />
        <rect x="134" y="55" width="18" height="133" rx="4" fill="url(#bar1d)" opacity="0.5" />
        <rect x="162" y="35" width="18" height="153" rx="4" fill="url(#bar1d)" opacity="0.7" />
        <rect x="190" y="18" width="18" height="170" rx="4" fill="url(#bar1d)" />
      </g>

      {/* Trend line with glow */}
      <path d="M59 136 L87 106 L115 76 L143 51 L171 31 L199 14" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" opacity="0.8" />
      <circle cx="199" cy="14" r="5" fill="#f97316" filter="url(#glow)" />
      <circle cx="199" cy="14" r="3" fill="#f97316" />

      {/* Floating card 1 - Income */}
      <g transform="translate(280, 25)">
        <rect width="130" height="68" rx="12" fill="white" stroke="#e5e5e5" strokeWidth="0.8" className="dark:fill-[#18181b] dark:stroke-[#27272a]" />
        <rect x="14" y="16" width="44" height="4" rx="2" className="fill-neutral-300 dark:fill-neutral-600" />
        <rect x="14" y="28" width="70" height="8" rx="4" className="fill-[#09090b] dark:fill-[#fafafa]" />
        <rect x="14" y="46" width="36" height="4" rx="2" fill="#10b981" />
        <circle cx="106" cy="34" r="14" fill="#10b981" opacity="0.1" />
        <path d="M101 34 L104 37 L111 30" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Floating card 2 - Spending */}
      <g transform="translate(430, 70)">
        <rect width="130" height="68" rx="12" fill="white" stroke="#e5e5e5" strokeWidth="0.8" className="dark:fill-[#18181b] dark:stroke-[#27272a]" />
        <rect x="14" y="16" width="50" height="4" rx="2" className="fill-neutral-300 dark:fill-neutral-600" />
        <rect x="14" y="28" width="80" height="8" rx="4" className="fill-[#09090b] dark:fill-[#fafafa]" />
        <rect x="14" y="46" width="44" height="4" rx="2" fill="#f97316" />
        {/* Mini sparkline */}
        <path d="M80 50 Q86 46 92 48 T106 42 T116 44" stroke="#f97316" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Floating card 3 - Small */}
      <g transform="translate(340, 130)">
        <rect width="80" height="44" rx="10" fill="white" stroke="#e5e5e5" strokeWidth="0.8" className="dark:fill-[#18181b] dark:stroke-[#27272a]" />
        <rect x="12" y="14" width="28" height="3" rx="1.5" className="fill-neutral-300 dark:fill-neutral-600" />
        <rect x="12" y="24" width="40" height="6" rx="3" className="fill-[#09090b] dark:fill-[#fafafa]" />
        <circle cx="62" cy="22" r="8" fill="#f97316" opacity="0.1" />
        <text x="62" y="25" textAnchor="middle" fontSize="8" fill="#f97316" fontWeight="700">$</text>
      </g>

      {/* Coins with subtle gradient */}
      <defs>
        <radialGradient id="coin" cx="50%" cy="40%"><stop stopColor="#fbbf24" /><stop offset="1" stopColor="#d97706" /></radialGradient>
      </defs>
      <g opacity="0.5">
        <circle cx="260" cy="155" r="12" fill="url(#coin)" />
        <text x="260" y="159" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">$</text>
      </g>
      <g opacity="0.35">
        <circle cx="290" cy="175" r="9" fill="url(#coin)" />
        <text x="290" y="178" textAnchor="middle" fontSize="8" fill="white" fontWeight="600">$</text>
      </g>
      <g opacity="0.2">
        <circle cx="240" cy="178" r="7" fill="url(#coin)" />
        <text x="240" y="181" textAnchor="middle" fontSize="7" fill="white" fontWeight="600">$</text>
      </g>
    </svg>
  );
}

/* ---- Wallet Illustration ---- */
export function WalletIllustration() {
  return (
    <svg className="w-20 h-20 mx-auto" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wallet" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f97316" stopOpacity="0.15" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="10" y="22" width="60" height="42" rx="10" fill="url(#wallet)" stroke="currentColor" strokeWidth="1.2" className="text-neutral-300 dark:text-neutral-600" />
      <rect x="22" y="34" width="16" height="10" rx="3" stroke="currentColor" strokeWidth="1" className="text-neutral-300 dark:text-neutral-600" />
      <circle cx="56" cy="39" r="3" fill="currentColor" className="text-orange-400/60 dark:text-orange-500/40" />
      <g opacity="0.5">
        <circle cx="22" cy="72" r="6" fill="url(#wallet)" stroke="currentColor" strokeWidth="1" className="text-neutral-300 dark:text-neutral-600" />
        <text x="22" y="75" textAnchor="middle" fontSize="7" fill="currentColor" className="text-orange-400/50 dark:text-orange-500/30">$</text>
      </g>
      <g opacity="0.35">
        <circle cx="38" cy="74" r="6" fill="url(#wallet)" stroke="currentColor" strokeWidth="1" className="text-neutral-300 dark:text-neutral-600" />
        <text x="38" y="77" textAnchor="middle" fontSize="7" fill="currentColor" className="text-orange-400/50 dark:text-orange-500/30">$</text>
      </g>
      <g opacity="0.2">
        <circle cx="54" cy="71" r="6" fill="url(#wallet)" stroke="currentColor" strokeWidth="1" className="text-neutral-300 dark:text-neutral-600" />
        <text x="54" y="74" textAnchor="middle" fontSize="7" fill="currentColor" className="text-orange-400/50 dark:text-orange-500/30">$</text>
      </g>
    </svg>
  );
}

/* ---- Chart Illustration ---- */
export function ChartIllustration() {
  return (
    <svg className="w-20 h-20 mx-auto" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="chBar" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#09090b" className="dark:stop-[#fafafa]" stopOpacity="0.6" />
          <stop offset="1" stopColor="#525252" className="dark:stop-[#a3a3a3]" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x="12" y="44" width="8" height="20" rx="2" fill="url(#chBar)" />
      <rect x="26" y="32" width="8" height="32" rx="2" fill="url(#chBar)" />
      <rect x="40" y="20" width="8" height="44" rx="2" fill="url(#chBar)" />
      <rect x="54" y="30" width="8" height="34" rx="2" fill="url(#chBar)" />
      <path d="M15 40 L30 28 L44 16 L58 26" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="58" cy="26" r="3" fill="#f97316" opacity="0.8" />
      <circle cx="58" cy="26" r="1.5" fill="#f97316" />
    </svg>
  );
}

/* ---- Target Illustration ---- */
export function TargetIllustration() {
  return (
    <svg className="w-20 h-20 mx-auto" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="1.2" className="text-neutral-300 dark:text-neutral-600" />
      <circle cx="40" cy="40" r="20" stroke="currentColor" strokeWidth="1" className="text-neutral-300 dark:text-neutral-600" />
      <circle cx="40" cy="40" r="12" fill="#f97316" opacity="0.08" stroke="#f97316" strokeWidth="1" />
      <circle cx="40" cy="40" r="4" fill="#f97316" opacity="0.6" />
      <path d="M40 40 L58 20" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M60 18 L56 22 L62 22" stroke="#f97316" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="20" r="2" fill="#f97316" opacity="0.2" />
      <circle cx="62" cy="32" r="1.5" fill="#f97316" opacity="0.15" />
      <circle cx="24" cy="62" r="1.5" fill="#f97316" opacity="0.12" />
    </svg>
  );
}

/* ---- Document Illustration ---- */
export function DocumentIllustration() {
  return (
    <svg className="w-20 h-20 mx-auto" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect x="16" y="12" width="48" height="58" rx="8" fill="white" stroke="currentColor" strokeWidth="1.2" className="dark:fill-[#18181b] text-neutral-300 dark:text-neutral-600" />
      <path d="M40 12 V28 H64" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-neutral-300 dark:text-neutral-600" />
      <rect x="26" y="36" width="22" height="3" rx="1.5" className="fill-neutral-200 dark:fill-neutral-700" />
      <rect x="26" y="44" width="28" height="3" rx="1.5" className="fill-neutral-200 dark:fill-neutral-700" />
      <rect x="26" y="52" width="16" height="3" rx="1.5" className="fill-neutral-200 dark:fill-neutral-700" />
      {/* Magnifying glass */}
      <circle cx="58" cy="58" r="10" stroke="#f97316" strokeWidth="1.5" fill="#f97316" fillOpacity="0.05" />
      <line x1="66" y1="66" x2="74" y2="74" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <text x="58" y="62" textAnchor="middle" fontSize="10" fill="#f97316" fontWeight="600">?</text>
    </svg>
  );
}
