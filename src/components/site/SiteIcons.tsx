// Pictogrammes propres au site, absents du sprite commun. Même trait que src/components/Icons.tsx (1.8 px).

export type SiteIconName = 'eye' | 'eye-off' | 'lock' | 'database' | 'arrow-right' | 'language' | 'info' | 'pin';

const PATHS: Record<SiteIconName, React.ReactNode> = {
  eye: (
    <>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.4 7.5A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.2-1" />
      <path d="M10 10.1a3 3 0 0 0 4 4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.6" />
      <path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
    </>
  ),
  'arrow-right': <path d="M5 12h14M13.5 6.5L19 12l-5.5 5.5" />,
  language: (
    <>
      <path d="M4 6.5h9M8.5 4.5v2c0 4-2 7-4.5 8.5M6 10.5c1.2 2 3.2 3.6 5.5 4.5" />
      <path d="M13 20l3.5-8.5L20 20M14.2 17h4.6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 20.5s6.5-5.6 6.5-10.6a6.5 6.5 0 0 0-13 0c0 5 6.5 10.6 6.5 10.6z" />
      <circle cx="12" cy="9.8" r="2.3" />
    </>
  ),
};

export function SiteIcon({ name, className }: { name: SiteIconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
