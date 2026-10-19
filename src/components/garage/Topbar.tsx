'use client';

// Barre du haut : marque et entreprise, chiffres du parc, son, qualité 3D, mode atelier, menu.
import { Icon } from '@/components/Icons';
import { LogoMark } from '@/components/Logo';
import { ROLES } from '@/lib/domain';
import { chf, grp } from '@/lib/format';
import type { QualityPref } from './prefs';
import { Menu, type MenuEntry } from './ui';

export const QUALITY_LABEL: Record<QualityPref, string> = {
  auto: 'Qualité auto',
  high: 'Qualité haute',
  medium: 'Qualité moyenne',
  low: 'Qualité basse',
};

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
  onSignOut,
}: {
  orgName: string;
  mode: 'cloud' | 'demo';
  role: keyof typeof ROLES;
  person: { name: string | null; email: string | null } | null;
  machines: number | null;
  alerts: number | null;
  cost12: number | null;
  sound: boolean;
  onSound: () => void;
  quality: QualityPref;
  onQuality: () => void;
  show3dControls: boolean;
  atelier: boolean;
  onAtelier: () => void;
  onSignOut: () => void;
}) {
  const items: MenuEntry[] =
    mode === 'demo'
      ? [
          { key: 'h', heading: 'Garage de démonstration', sub: 'Rien de ce que vous saisissez n’est enregistré.' },
          { key: 'inscription', label: 'Créer mon garage', icon: 'plus', href: '/connexion?mode=inscription' },
          { key: 'accueil', label: 'Découvrir Godet', icon: 'garage', href: '/' },
        ]
      : [
          {
            key: 'h',
            heading: person?.name || person?.email || orgName,
            sub: `${ROLES[role].label} · ${orgName}`,
          },
          { key: 'parametres', label: 'Paramètres', icon: 'cog', href: '/parametres' },
          { key: 'sortie', label: 'Déconnexion', icon: 'logout', onSelect: onSignOut },
        ];

  return (
    <header className="topbar g-topbar">
      <div className="brand">
        <LogoMark size={34} />
        <span className="g-brand-text">
          <span className="brand-name">GODET</span>
          <span className="brand-sub">{orgName} · parc d’engins</span>
        </span>
      </div>

      <dl className="stats g-stats" aria-label="Le parc en chiffres">
        <div className="stat">
          <dt>Machines</dt>
          <dd>
            <b>{machines == null ? '—' : grp(machines)}</b>
          </dd>
        </div>
        <div className="stat">
          <dt>Alertes</dt>
          <dd>
            <b className={alerts ? 'warn' : undefined}>{alerts == null ? '—' : grp(alerts)}</b>
          </dd>
        </div>
        <div className="stat wide">
          <dt>Coûts 12 mois</dt>
          <dd>
            <b>{cost12 == null ? '—' : chf(cost12)}</b>
          </dd>
        </div>
      </dl>

      <div className="actions">
        <button
          type="button"
          className="icon-btn"
          aria-pressed={sound}
          aria-label={sound ? 'Couper le son' : 'Activer le son'}
          title={sound ? 'Couper le son' : 'Activer le son'}
          onClick={onSound}
        >
          <Icon name={sound ? 'sound' : 'mute'} />
        </button>
        {show3dControls ? (
          <button
            type="button"
            className="icon-btn"
            onClick={onQuality}
            aria-label={`${QUALITY_LABEL[quality]} : changer la qualité de la 3D`}
          >
            <Icon name="gauge" />
            <span className="lbl" aria-hidden="true">
              {QUALITY_LABEL[quality]}
            </span>
          </button>
        ) : null}
        <button
          type="button"
          className="icon-btn"
          aria-pressed={atelier}
          aria-label="Mode atelier"
          onClick={onAtelier}
          title="Mode atelier : le parc en liste, sans 3D"
        >
          <Icon name="wrench" />
          <span className="lbl">Mode atelier</span>
        </button>
        <Menu label="Menu" items={items} className="g-menu-right" />
      </div>
    </header>
  );
}
