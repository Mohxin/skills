function EmptyStateIllustration() {
  return (
    <svg className="w-32 h-32 mx-auto text-neutral-200 dark:text-neutral-700" viewBox="0 0 128 128" fill="none" aria-hidden="true">
      {/* Wallet */}
      <rect x="24" y="40" width="80" height="56" rx="12" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="36" y="56" width="24" height="16" rx="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="80" cy="64" r="4" fill="currentColor"/>
      {/* Coins */}
      <circle cx="32" cy="108" r="8" stroke="currentColor" strokeWidth="2"/>
      <circle cx="56" cy="112" r="8" stroke="currentColor" strokeWidth="2"/>
      <circle cx="80" cy="106" r="8" stroke="currentColor" strokeWidth="2"/>
      {/* Chart arrow */}
      <path d="M96 32l-8 8-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M104 24v12h-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Dollar signs on coins */}
      <text x="28" y="112" fontSize="10" fill="currentColor" textAnchor="middle">$</text>
      <text x="52" y="116" fontSize="10" fill="currentColor" textAnchor="middle">$</text>
      <text x="76" y="110" fontSize="10" fill="currentColor" textAnchor="middle">$</text>
    </svg>
  );
}

function NoDataIllustration() {
  return (
    <svg className="w-32 h-32 mx-auto text-neutral-200 dark:text-neutral-700" viewBox="0 0 128 128" fill="none" aria-hidden="true">
      {/* Document */}
      <rect x="32" y="20" width="64" height="80" rx="8" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M64 20v20h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Lines on document */}
      <line x1="44" y1="52" x2="72" y2="52" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="44" y1="62" x2="80" y2="62" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="44" y1="72" x2="64" y2="72" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Magnifying glass */}
      <circle cx="88" cy="88" r="14" stroke="currentColor" strokeWidth="2.5"/>
      <line x1="98" y1="98" x2="110" y2="110" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Question mark */}
      <text x="88" y="93" fontSize="16" fill="currentColor" textAnchor="middle">?</text>
    </svg>
  );
}

function ChartIllustration() {
  return (
    <svg className="w-32 h-32 mx-auto text-neutral-200 dark:text-neutral-700" viewBox="0 0 128 128" fill="none" aria-hidden="true">
      {/* Chart bars */}
      <rect x="16" y="96" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="36" y="72" width="12" height="40" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="56" y="48" width="12" height="64" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="76" y="32" width="12" height="80" rx="2" stroke="currentColor" strokeWidth="2"/>
      {/* Trend line */}
      <path d="M22 90l20-20 20-16 20-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="22" cy="90" r="3" fill="currentColor"/>
      <circle cx="42" cy="70" r="3" fill="currentColor"/>
      <circle cx="62" cy="54" r="3" fill="currentColor"/>
      <circle cx="82" cy="42" r="3" fill="currentColor"/>
      {/* Arrow */}
      <path d="M104 24l12-8-4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GoalsIllustration() {
  return (
    <svg className="w-32 h-32 mx-auto text-neutral-200 dark:text-neutral-700" viewBox="0 0 128 128" fill="none" aria-hidden="true">
      {/* Target */}
      <circle cx="64" cy="64" r="40" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="64" cy="64" r="28" stroke="currentColor" strokeWidth="2"/>
      <circle cx="64" cy="64" r="16" stroke="currentColor" strokeWidth="2"/>
      <circle cx="64" cy="64" r="4" fill="currentColor"/>
      {/* Arrow in bullseye */}
      <path d="M64 64l24-40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M90 20l-4 8 8-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Stars */}
      <circle cx="28" cy="28" r="3" fill="currentColor"/>
      <circle cx="100" cy="48" r="2" fill="currentColor"/>
      <circle cx="36" cy="100" r="2.5" fill="currentColor"/>
    </svg>
  );
}

export { EmptyStateIllustration, NoDataIllustration, ChartIllustration, GoalsIllustration };
