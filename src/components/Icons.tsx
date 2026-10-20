// Pictogrammes de l'app, dessinés au trait (1.8 px), regroupés dans un seul sprite SVG inséré une fois dans la page.
// Utilisation : <Icon name="wrench" /> (taille et couleur héritées du texte via CSS).

export type IconName =
  | 'plus' | 'close' | 'sound' | 'mute' | 'gauge' | 'wrench' | 'camera' | 'video' | 'upload' | 'drop'
  | 'shield' | 'cog' | 'note' | 'search' | 'power' | 'garage' | 'chevron-left' | 'chevron-right'
  | 'clock' | 'chf' | 'calendar' | 'users' | 'logout' | 'edit' | 'trash' | 'archive' | 'check'
  | 'alert' | 'list' | 'cube' | 'file' | 'print' | 'link' | 'copy' | 'mail' | 'menu' | 'download' | 'qr' | 'table' | 'offline';

export function Icon({ name, className, title }: { name: IconName; className?: string; title?: string }) {
  return (
    <svg className={className} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} focusable="false">
      {title ? <title>{title}</title> : null}
      <use href={`#i-${name}`} />
    </svg>
  );
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <symbol id="i-plus" viewBox="0 0 24 24"><g {...stroke} strokeWidth={1.9}><path d="M12 5v14M5 12h14" /></g></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><g {...stroke} strokeWidth={1.9}><path d="M6 6l12 12M18 6L6 18" /></g></symbol>
        <symbol id="i-sound" viewBox="0 0 24 24"><g {...stroke}><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></g></symbol>
        <symbol id="i-mute" viewBox="0 0 24 24"><g {...stroke}><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M16 10l5 5M21 10l-5 5" /></g></symbol>
        <symbol id="i-gauge" viewBox="0 0 24 24"><g {...stroke}><path d="M4.5 17a8 8 0 1 1 15 0" /><path d="M12 15l4-5" /><circle cx="12" cy="15.5" r="1.2" /></g></symbol>
        <symbol id="i-wrench" viewBox="0 0 24 24"><g {...stroke}><path d="M14.8 5.2a4.2 4.2 0 0 0-5.4 5.4L4.2 15.8a1.9 1.9 0 0 0 2.7 2.7l5.2-5.2a4.2 4.2 0 0 0 5.4-5.4l-2.6 2.6-2.3-.6-.6-2.3z" /></g></symbol>
        <symbol id="i-camera" viewBox="0 0 24 24"><g {...stroke}><path d="M4 8h3l1.8-2.5h6.4L17 8h3v11H4z" /><circle cx="12" cy="13.2" r="3.4" /></g></symbol>
        <symbol id="i-video" viewBox="0 0 24 24"><g {...stroke}><rect x="3" y="6.5" width="12" height="11" rx="2" /><path d="M15 10.5l6-3v9l-6-3" /></g></symbol>
        <symbol id="i-upload" viewBox="0 0 24 24"><g {...stroke}><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M4 19.5h16" /></g></symbol>
        <symbol id="i-download" viewBox="0 0 24 24"><g {...stroke}><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M4 19.5h16" /></g></symbol>
        <symbol id="i-drop" viewBox="0 0 24 24"><g {...stroke}><path d="M12 3.5s5.5 6 5.5 10.2a5.5 5.5 0 0 1-11 0C6.5 9.5 12 3.5 12 3.5z" /></g></symbol>
        <symbol id="i-shield" viewBox="0 0 24 24"><g {...stroke}><path d="M12 3.5l7 2.8v5.4c0 4.3-2.9 7.4-7 8.8-4.1-1.4-7-4.5-7-8.8V6.3z" /><path d="M9 12l2 2 4-4" /></g></symbol>
        <symbol id="i-cog" viewBox="0 0 24 24"><g {...stroke}><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></g></symbol>
        <symbol id="i-note" viewBox="0 0 24 24"><g {...stroke}><path d="M5 19h3.8L19 8.8 15.2 5 5 15.2z" /><path d="M13.5 6.7l3.8 3.8" /></g></symbol>
        <symbol id="i-edit" viewBox="0 0 24 24"><g {...stroke}><path d="M5 19h3.8L19 8.8 15.2 5 5 15.2z" /><path d="M13.5 6.7l3.8 3.8" /></g></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><g {...stroke}><circle cx="10.5" cy="10.5" r="5.5" /><path d="M15 15l5 5" /></g></symbol>
        <symbol id="i-power" viewBox="0 0 24 24"><g {...stroke} strokeWidth={2}><path d="M12 3.5V11" /><path d="M6.6 6.8a7.5 7.5 0 1 0 10.8 0" /></g></symbol>
        <symbol id="i-garage" viewBox="0 0 24 24"><g {...stroke}><path d="M3 10l9-6 9 6v10H3z" /><path d="M7 20v-6h10v6M7 17h10" /></g></symbol>
        <symbol id="i-chevron-left" viewBox="0 0 24 24"><g {...stroke} strokeWidth={2}><path d="M14.5 5.5L8 12l6.5 6.5" /></g></symbol>
        <symbol id="i-chevron-right" viewBox="0 0 24 24"><g {...stroke} strokeWidth={2}><path d="M9.5 5.5L16 12l-6.5 6.5" /></g></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><g {...stroke}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></g></symbol>
        <symbol id="i-chf" viewBox="0 0 24 24"><g {...stroke}><rect x="3.5" y="6" width="17" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6.5 9v6M17.5 9v6" /></g></symbol>
        <symbol id="i-calendar" viewBox="0 0 24 24"><g {...stroke}><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></g></symbol>
        <symbol id="i-users" viewBox="0 0 24 24"><g {...stroke}><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M15.5 6.2a3 3 0 0 1 0 5.6M17.5 14.2a5 5 0 0 1 3 4.8" /></g></symbol>
        <symbol id="i-logout" viewBox="0 0 24 24"><g {...stroke}><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" /><path d="M14.5 8l4 4-4 4M18.5 12H9.5" /></g></symbol>
        <symbol id="i-trash" viewBox="0 0 24 24"><g {...stroke}><path d="M5 7h14M10 7V4.8h4V7M7 7l.8 12.2h8.4L17 7" /></g></symbol>
        <symbol id="i-archive" viewBox="0 0 24 24"><g {...stroke}><rect x="3.5" y="4.5" width="17" height="4.5" rx="1" /><path d="M5 9v10h14V9M10 13h4" /></g></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><g {...stroke} strokeWidth={2}><path d="M5 12.5l4.5 4.5L19 7.5" /></g></symbol>
        <symbol id="i-alert" viewBox="0 0 24 24"><g {...stroke}><path d="M12 4l9 15.5H3z" /><path d="M12 10v4.2M12 16.8v.2" /></g></symbol>
        <symbol id="i-list" viewBox="0 0 24 24"><g {...stroke}><path d="M9 6.5h11M9 12h11M9 17.5h11" /><circle cx="4.8" cy="6.5" r=".9" /><circle cx="4.8" cy="12" r=".9" /><circle cx="4.8" cy="17.5" r=".9" /></g></symbol>
        <symbol id="i-cube" viewBox="0 0 24 24"><g {...stroke}><path d="M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z" /><path d="M4.5 7.7L12 12l7.5-4.3M12 12v8.5" /></g></symbol>
        <symbol id="i-file" viewBox="0 0 24 24"><g {...stroke}><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" /></g></symbol>
        <symbol id="i-qr" viewBox="0 0 24 24"><g {...stroke}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 20h1M20 14v1" /></g></symbol>
        <symbol id="i-table" viewBox="0 0 24 24"><g {...stroke}><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" /></g></symbol>
        <symbol id="i-offline" viewBox="0 0 24 24"><g {...stroke}><path d="M2.5 9a14 14 0 0 1 5-2.9M21.5 9A14 14 0 0 0 11 5.1M5.5 12.5a9 9 0 0 1 4-2M18.5 12.5a9 9 0 0 0-2.6-1.7M9 16a4.5 4.5 0 0 1 5 0M12 19.5v.1M4 4l16 16" /></g></symbol>
        <symbol id="i-print" viewBox="0 0 24 24"><g {...stroke}><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="7.5" rx="1.5" /><path d="M7 14h10v6H7z" /></g></symbol>
        <symbol id="i-link" viewBox="0 0 24 24"><g {...stroke}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></g></symbol>
        <symbol id="i-copy" viewBox="0 0 24 24"><g {...stroke}><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" /></g></symbol>
        <symbol id="i-mail" viewBox="0 0 24 24"><g {...stroke}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M4 7l8 6 8-6" /></g></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><g {...stroke} strokeWidth={1.9}><path d="M4.5 7h15M4.5 12h15M4.5 17h15" /></g></symbol>
      </defs>
    </svg>
  );
}
