// Le godet : logo de la marque (jaune engin sur nuit).
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <path d="M7 9h15c6.6 0 11 4.4 11 11v2.5L27.5 30H17C11.5 30 7 25.5 7 20z" fill="var(--paint)" />
      <path d="M13 15h8.5c3.6 0 5.5 2.1 5.5 5.5v.5l-3 4h-6.5c-2.5 0-4.5-2-4.5-4.5z" fill="var(--night)" />
      <path d="M17 30l1.6 4 1.6-4zM21.6 30l1.6 4 1.6-4zM26.2 30l1.6 4 1.6-4z" fill="var(--paint)" />
    </svg>
  );
}

export function Wordmark({ sub }: { sub?: string }) {
  return (
    <span className="brand">
      <LogoMark size={34} />
      <span>
        <span className="brand-name">GODET</span>
        {sub ? <span className="brand-sub">{sub}</span> : null}
      </span>
    </span>
  );
}
