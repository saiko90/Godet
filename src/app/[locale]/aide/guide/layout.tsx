import '@/components/site/site.css';

// Le guide imprimable garde le fond blanc (le site est sombre).
export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <style>{'@page { size: A4; margin: 16mm 15mm; } :root { color-scheme: light !important; } html, body { background: #fff !important; color: #1d1f24; }'}</style>
      {children}
    </div>
  );
}
