'use client';

// Barre du haut : marque et entreprise, chiffres du parc, son, qualité 3D, mode atelier, menu (avec la langue).
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/Icons';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LogoMark } from '@/components/Logo';
import { useFormat } from '@/components/FormatProvider';
import type { MemberRole } from '@/lib/types';
import { useDomainText } from '@/lib/use-domain-text';
import type { QualityPref } from './prefs';
import { Menu, type MenuEntry } from './ui';

export function Topbar({
  orgName,
  mode,
  role,
  person,
  machines,
  alerts,
  cost12,
  sound,
  onSound,
  quality,
  onQuality,
  show3dControls,
  atelier,
  onAtelier,
  groups,
  onGroups,
  onExcel,
  onAssistant,
  assistantOpen,
  onSignOut,
}: {
  orgName: string;
  mode: 'cloud' | 'demo';
  role: MemberRole;
  person: { name: string | null; email: string | null } | null;
  machines: number | null;
  alerts: number | null;
  cost12: number | null;
  sound: boolean;
  onSound: () => void;
  quality: QualityPref;
  /** Absent sur téléphone et tablette : la 3D y reste en qualité basse. */
  onQuality?: () => void;
  show3dControls: boolean;
  atelier: boolean;
  onAtelier: () => void;
  /** Machines du même type sur un seul plateau (réglage de l'appareil). */
  groups: boolean;
  onGroups: () => void;
  /** Import / export Excel (absent tant que le parc n'est pas chargé). */
  onExcel?: () => void;
  /** Assistant IA (tiroir à droite). */
  onAssistant: () => void;
  assistantOpen: boolean;
  onSignOut: () => void;
}) {
  const t = useTranslations('garage');
  const tx = useTranslations('excel');
  const f = useFormat();
  const dt = useDomainText();
  const qualityLabel = t(`quality.${quality}`);

  const shared: MenuEntry[] = [
    ...(show3dControls ? [{ key: 'groups', label: t('groups.menu'), icon: 'garage' as const, checked: groups, onSelect: onGroups }] : []),
    ...(onExcel ? [{ key: 'excel', label: tx('menu'), icon: 'table' as const, onSelect: onExcel }] : []),
    { key: 'contact', label: t('menu.contact'), icon: 'mail', href: '/contact' },
    { key: 'idees', label: t('menu.ideas'), icon: 'note', href: '/idees' },
  ];
  const items: MenuEntry[] =
    mode === 'demo'
      ? [
          { key: 'h', heading: t('menu.demoHeading'), sub: t('menu.demoSub') },
          { key: 'inscription', label: t('menu.signup'), icon: 'plus', href: '/connexion?mode=inscription' },
          { key: 'accueil', label: t('menu.discover'), icon: 'garage', href: '/' },
          ...shared,
        ]
      : [
          {
            key: 'h',
            heading: person?.name || person?.email || orgName,
            sub: t('menu.roleOrg', { role: dt.role(role), org: orgName }),
          },
          { key: 'parametres', label: t('menu.settings'), icon: 'cog', href: '/parametres' },
          { key: 'etiquettes', label: t('menu.labels'), icon: 'qr', href: '/etiquettes' },
          ...shared,
          { key: 'sortie', label: t('menu.signOut'), icon: 'logout', onSelect: onSignOut },
        ];

  return (
    <header className="topbar g-topbar">
      <div className="brand">
        <LogoMark size={34} />
        <span className="g-brand-text">
          <span className="brand-name">GODET</span>
          <span className="brand-sub">{t('topbar.brandSub', { org: orgName })}</span>
        </span>
      </div>

      <dl className="stats g-stats" aria-label={t('topbar.stats')}>
        <div className="stat">
          <dt>{t('topbar.machines')}</dt>
          <dd>
            <b>{machines == null ? '—' : f.num(machines)}</b>
          </dd>
        </div>
        <div className="stat">
          <dt>{t('topbar.alerts')}</dt>
          <dd>
            <b className={alerts ? 'warn' : undefined}>{alerts == null ? '—' : f.num(alerts)}</b>
          </dd>
        </div>
        <div className="stat wide">
          <dt>{t('topbar.cost12')}</dt>
          <dd>
            <b>{cost12 == null ? '—' : f.money(cost12)}</b>
          </dd>
        </div>
      </dl>

      <div className="actions">
        <button
          type="button"
          className="icon-btn"
          aria-pressed={sound}
          aria-label={sound ? t('topbar.soundOff') : t('topbar.soundOn')}
          title={sound ? t('topbar.soundOff') : t('topbar.soundOn')}
          onClick={onSound}
        >
          <Icon name={sound ? 'sound' : 'mute'} />
        </button>
        {show3dControls && onQuality ? (
          <button type="button" className="icon-btn" onClick={onQuality} aria-label={t('topbar.qualityAria', { quality: qualityLabel })}>
            <Icon name="gauge" />
            <span className="lbl" aria-hidden="true">
              {qualityLabel}
            </span>
          </button>
        ) : null}
        <button
          type="button"
          className="icon-btn g-ai-btn"
          aria-pressed={assistantOpen}
          aria-label={t('assistant.open')}
          title={t('assistant.open')}
          onClick={onAssistant}
        >
          <Icon name="spark" />
          <span className="lbl">{t('assistant.short')}</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={atelier}
          aria-label={t('topbar.atelier')}
          onClick={onAtelier}
          title={t('topbar.atelierTitle')}
        >
          <Icon name="wrench" />
          <span className="lbl">{t('topbar.atelier')}</span>
        </button>
        <Menu label={t('topbar.menu')} items={items} footer={<LanguageSwitcher className="g-menu-lang" />} className="g-menu-right" />
      </div>
    </header>
  );
}
