interface WebTrexLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function WebTrexLogo({ size = 'md' }: WebTrexLogoProps) {
  const boxDim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="inline-flex items-center gap-3 select-none group">
      <div
        className={`${boxDim} rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 p-[1px] shadow-lg shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-105`}
      >
        <div className="w-full h-full rounded-[11px] bg-[#0B0E14] flex items-center justify-center">
          <svg viewBox="0 0 32 32" className="w-4.5 h-4.5 text-white" fill="none">
            <path
              d="M4.5 8.5L10.5 23.5L16 12.5L21.5 23.5L27.5 8.5"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="6.5" r="2.3" fill="#22D3EE" />
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`font-display font-bold tracking-tight text-white ${textSize}`}>
          WEBTREX
        </span>
        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20 text-[9px] font-mono font-semibold text-cyan-300 uppercase">
          LABS
        </span>
      </div>
    </div>
  );
}
