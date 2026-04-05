import { useState, useEffect } from 'react';

/* ---- Hero Illustration ---- */
export function HeroIllustration() {
  return (
    <svg className="w-full h-full min-h-[200px]" viewBox="0 0 600 200" fill="none" aria-hidden="true">
      {/* Background blobs */}
      <defs>
        <linearGradient id="heroGrad1" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f97316" stopOpacity="0.15" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="heroGrad2" x1="200" y1="0" x2="600" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" stopOpacity="0.08" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="100" rx="200" ry="120" fill="url(#heroGrad1)" />
      <ellipse cx="480" cy="80" rx="180" ry="100" fill="url(#heroGrad2)" />

      {/* Chart bars */}
      <rect x="60" y="120" width="20" height="50" rx="4" fill="#09090b" opacity="0.06" className="dark:fill-white dark:opacity-10" />
      <rect x="90" y="90" width="20" height="80" rx="4" fill="#09090b" opacity="0.08" className="dark:fill-white dark:opacity-12" />
      <rect x="120" y="60" width="20" height="110" rx="4" fill="#09090b" opacity="0.12" className="dark:fill-white dark:opacity-16" />
      <rect x="150" y="40" width="20" height="130" rx="4" fill="#09090b" opacity="0.16" className="dark:fill-white dark:opacity-20" />
      <rect x="180" y="25" width="20" height="145" rx="4" fill="#09090b" className="dark:fill-white" />

      {/* Trend line */}
      <path d="M70 115 L100 85 L130 55 L160 35 L190 20" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="190" cy="20" r="4" fill="#f97316" />

      {/* Floating cards */}
      <rect x="300" y="30" width="120" height="60" rx="10" fill="white" stroke="#e5e5e5" strokeWidth="1" className="dark:fill-[#18181b] dark:stroke-[#27272a]" />
      <rect x="312" y="42" width="40" height="4" rx="2" fill="#a3a3a3" />
      <rect x="312" y="54" width="60" height="6" rx="3" fill="#09090b" className="dark:fill-white" />
      <rect x="312" y="68" width="30" height="4" rx="2" fill="#10b981" />
      <circle cx="400" cy="48" r="10" fill="#10b981" opacity="0.15" />
      <path d="M396 48 L399 51 L405 44" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      <rect x="440" y="80" width="120" height="60" rx="10" fill="white" stroke="#e5e5e5" strokeWidth="1" className="dark:fill-[#18181b] dark:stroke-[#27272a]" />
      <rect x="452" y="92" width="40" height="4" rx="2" fill="#a3a3a3" />
      <rect x="452" y="104" width="70" height="6" rx="3" fill="#09090b" className="dark:fill-white" />
      <rect x="452" y="118" width="40" height="4" rx="2" fill="#f97316" />

      {/* Coin elements */}
      <circle cx="280" cy="140" r="14" stroke="#f59e0b" strokeWidth="1.5" opacity="0.4" />
      <text x="280" y="145" textAnchor="middle" fontSize="12" fill="#f59e0b" opacity="0.6">$</text>
      <circle cx="320" cy="160" r="10" stroke="#f59e0b" strokeWidth="1.5" opacity="0.25" />
      <text x="320" y="164" textAnchor="middle" fontSize="9" fill="#f59e0b" opacity="0.4">$</text>
      <circle cx="250" cy="165" r="8" stroke="#f59e0b" strokeWidth="1.5" opacity="0.2" />
      <text x="250" y="168" textAnchor="middle" fontSize="8" fill="#f59e0b" opacity="0.3">$</text>
    </svg>
  );
}

/* ---- Empty State Wallet Illustration ---- */
export function WalletIllustration() {
  return (
    <svg className="w-20 h-20 mx-auto" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect x="10" y="22" width="60" height="42" rx="10" stroke="currentColor" strokeWidth="1.5" className="text-neutral-200 dark:text-neutral-700" />
      <rect x="22" y="34" width="16" height="10" rx="3" stroke="currentColor" strokeWidth="1.2" className="text-neutral-200 dark:text-neutral-700" />
      <circle cx="56" cy="39" r="3" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
      {/* Coins */}
      <circle cx="22" cy="72" r="6" stroke="currentColor" strokeWidth="1.2" className="text-neutral-200 dark:text-neutral-700" />
      <circle cx="38" cy="74" r="6" stroke="currentColor" strokeWidth="1.2" className="text-neutral-200 dark:text-neutral-700" />
      <circle cx="54" cy="71" r="6" stroke="currentColor" strokeWidth="1.2" className="text-neutral-200 dark:text-neutral-700" />
      <text x="22" y="75" textAnchor="middle" fontSize="7" fill="currentColor" className="text-neutral-300 dark:text-neutral-600">$</text>
      <text x="38" y="77" textAnchor="middle" fontSize="7" fill="currentColor" className="text-neutral-300 dark:text-neutral-600">$</text>
      <text x="54" y="74" textAnchor="middle" fontSize="7" fill="currentColor" className="text-neutral-300 dark:text-neutral-600">$</text>
    </svg>
  );
}

/* ---- Chart Illustration ---- */
export function ChartIllustration() {
  return (
    <svg className="w-20 h-20 mx-auto" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect x="12" y="44" width="8" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-neutral-200 dark:text-neutral-700" />
      <rect x="26" y="32" width="8" height="32" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-neutral-200 dark:text-neutral-700" />
      <rect x="40" y="20" width="8" height="44" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-neutral-200 dark:text-neutral-700" />
      <rect x="54" y="30" width="8" height="34" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-neutral-200 dark:text-neutral-700" />
      <path d="M15 40 L30 28 L44 16 L58 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300 dark:text-neutral-600" />
      <circle cx="58" cy="26" r="2.5" fill="currentColor" className="text-neutral-300 dark:text-neutral-600" />
    </svg>
  );
}

/* ---- Target/Goals Illustration ---- */
export function TargetIllustration() {
  return (
    <svg className="w-20 h-20 mx-auto" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="1.5" className="text-neutral-200 dark:text-neutral-700" />
      <circle cx="40" cy="40" r="20" stroke="currentColor" strokeWidth="1.2" className="text-neutral-200 dark:text-neutral-700" />
      <circle cx="40" cy="40" r="12" stroke="currentColor" strokeWidth="1" className="text-neutral-200 dark:text-neutral-700" />
      <circle cx="40" cy="40" r="4" fill="currentColor" className="text-neutral-300 dark:text-neutral-600" />
      {/* Arrow */}
      <path d="M40 40 L60 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-neutral-300 dark:text-neutral-600" />
      <path d="M62 16 L58 20 L64 20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300 dark:text-neutral-600" />
      {/* Stars */}
      <circle cx="18" cy="20" r="2" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
      <circle cx="62" cy="32" r="1.5" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
      <circle cx="24" cy="62" r="1.5" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
    </svg>
  );
}

/* ---- Document/Search Illustration ---- */
export function DocumentIllustration() {
  return (
    <svg className="w-20 h-20 mx-auto" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect x="16" y="12" width="48" height="58" rx="8" stroke="currentColor" strokeWidth="1.5" className="text-neutral-200 dark:text-neutral-700" />
      <path d="M40 12 V28 H64" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-neutral-200 dark:text-neutral-700" />
      <line x1="26" y1="36" x2="48" y2="36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-neutral-200 dark:text-neutral-700" />
      <line x1="26" y1="44" x2="52" y2="44" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-neutral-200 dark:text-neutral-700" />
      <line x1="26" y1="52" x2="40" y2="52" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-neutral-200 dark:text-neutral-700" />
      {/* Magnifying glass */}
      <circle cx="58" cy="58" r="10" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300 dark:text-neutral-600" />
      <line x1="66" y1="66" x2="74" y2="74" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-neutral-300 dark:text-neutral-600" />
      <text x="58" y="62" textAnchor="middle" fontSize="10" fill="currentColor" className="text-neutral-300 dark:text-neutral-600">?</text>
    </svg>
  );
}
