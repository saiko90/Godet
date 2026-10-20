'use client';

// Option Location dans la démonstration : même agenda, même état des lieux, même rapport que dans un compte, avec les
// machines du parc d'exemple. Les écritures restent dans le navigateur (src/lib/rental-demo.ts) : rien n'est envoyé.
import { useTranslations } from 'next-intl';
import { useMemo, type ReactNode } from 'react';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import type { CheckItems, CheckKind, FuelLevel } from '@/lib/rental';
import { demoRentalActions, DEMO_RENTAL_ORG, DEMO_RENTAL_USER } from '@/lib/rental-demo';
import { useDemoLocation } from '@/lib/rental-demo-hook';
import { useDomainText } from '@/lib/use-domain-text';
import { RentalBackendContext, type RentalBackend } from './backend';
import { Planner, type PlannerMachine } from './Planner';
import { RentalCheckForm, type PreviousCheck } from './RentalCheckForm';
import { ReportView, type ReportCheck } from './ReportView';

const BACKEND: RentalBackend = {
  base: '/demo/location',
  garage: '/demo',
  demo: true,
  saveRental: async (input, { id }) => demoRentalActions.save(input, id),
  cancelRental: async (id) => demoRentalActions.cancel(id),
  saveDemoCheck: (input) => demoRentalActions.saveCheck(input),
  refresh: () => {},
};

/** Bandeau de démonstration : rien n'est envoyé ; retour au garage d'exemple ; inscription. */
function DemoBanner() {
  const t = useTranslations('rental.demo');
  return (
    <div className="s-rent-demo" role="note">
      <p>
        <Icon name="spark" /> {t('banner')}
      </p>
      <div>
        <Link href="/demo" className="btn btn-ghost s-btn-sm">
          {t('garage')}
        </Link>
        <Link href="/connexion?mode=inscription" className="btn btn-primary s-btn-sm">
          {t('cta')}
        </Link>
      </div>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <RentalBackendContext.Provider value={BACKEND}>
      <DemoBanner />
      {children}
    </RentalBackendContext.Provider>
  );
}

function Waiting() {
  return <p className="muted s-rent-wait">…</p>;
}

export function DemoAgenda({ nowIso }: { nowIso: string }) {
  const { machines, state, repairs, orgName } = useDemoLocation();
  const dt = useDomainText();
  const list: PlannerMachine[] = useMemo(
    () => machines.map((m) => ({ id: m.id, code: m.code, kind: m.kind, title: dt.machineTitle(m), make: [m.brand, m.model].filter(Boolean).join(' ') })),
    [machines, dt],
  );
  if (!state) return <Shell>{<Waiting />}</Shell>;
  const checks: Record<string, { depart?: string; retour?: string }> = {};
  for (const c of state.checks) (checks[c.rental_id] ??= {})[c.kind as CheckKind] = c.id;
  const seen = new Set<string>();
  const clients = state.rentals
    .map((r) => ({ client_company: r.client_company, client_name: r.client_name, client_phone: r.client_phone, client_email: r.client_email }))
    .filter((c) => {
      const k = `${c.client_company ?? ''}|${c.client_name}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  return (
    <Shell>
      <Planner
        orgId={DEMO_RENTAL_ORG}
        orgName={orgName}
        machines={list}
        rentals={state.rentals.filter((r) => r.status !== 'annulee')}
        checks={checks}
        clients={clients}
        repairs={repairs}
        nowIso={nowIso}
        canManage
        userId={DEMO_RENTAL_USER}
      />
    </Shell>
  );
}

export function DemoCheck({ id, kind }: { id: string; kind: CheckKind }) {
  const t = useTranslations('rental');
  const { machines, state, orgName } = useDemoLocation();
  const dt = useDomainText();
  if (!state) return <Shell>{<Waiting />}</Shell>;
  const rental = state.rentals.find((r) => r.id === id);
  const machine = rental ? machines.find((m) => m.id === rental.machine_id) : undefined;
  const expected = kind === 'depart' ? 'reservee' : 'en_cours';
  if (!rental || !machine || rental.status !== expected) {
    return (
      <Shell>
        <p className="muted">{t('demo.unavailable')}</p>
        <Link href="/demo/location" className="btn btn-soft">
          {t('report.back')}
        </Link>
      </Shell>
    );
  }
  const dep = kind === 'retour' ? state.checks.find((c) => c.rental_id === id && c.kind === 'depart') : undefined;
  const previous: PreviousCheck | null = dep
    ? {
        items: (dep.items ?? {}) as unknown as CheckItems,
        hours: dep.hours != null ? Number(dep.hours) : null,
        fuel: dep.fuel_level as FuelLevel | null,
        accessories: dep.accessories,
        keys: dep.keys_count,
        at: dep.created_at,
        photos: dep.photos.filter((p) => p.kind === 'photo').map((p) => ({ slot: p.slot, url: p.url })),
      }
    : null;
  return (
    <Shell>
      <RentalCheckForm
        kind={kind}
        org={{ id: DEMO_RENTAL_ORG, name: orgName, trackLocation: false, termsUrl: null }}
        role="owner"
        userId={DEMO_RENTAL_USER}
        staffName={t('demo.staff')}
        rental={rental}
        machine={{
          id: machine.id,
          code: machine.code,
          kind: machine.kind,
          title: dt.machineTitle(machine),
          brand: machine.brand,
          model: machine.model,
          hours: Number(machine.hours),
          serial: machine.serial,
          plate: machine.plate,
        }}
        previous={previous}
      />
    </Shell>
  );
}

export function DemoReport({ id, ok }: { id: string; ok: CheckKind | null }) {
  const t = useTranslations('rental');
  const { machines, state, orgName } = useDemoLocation();
  const dt = useDomainText();
  if (!state) return <Shell>{<Waiting />}</Shell>;
  const rental = state.rentals.find((r) => r.id === id);
  const machine = rental ? machines.find((m) => m.id === rental.machine_id) : undefined;
  if (!rental || !machine) {
    return (
      <Shell>
        <p className="muted">{t('demo.unavailable')}</p>
      </Shell>
    );
  }
  const view = (kind: CheckKind): ReportCheck | undefined => {
    const c = state.checks.find((x) => x.rental_id === id && x.kind === kind);
    return c ? { ...c, pdfUrl: null, termsUrl: null, clientSigUrl: c.clientSigUrl, staffSigUrl: c.staffSigUrl, photos: c.photos } : undefined;
  };
  const label = `${machine.code} · ${dt.machineTitle(machine)}${machine.brand || machine.model ? ` · ${[machine.brand, machine.model].filter(Boolean).join(' ')}` : ''}`;
  return (
    <Shell>
      <ReportView
        rental={rental}
        machineKind={machine.kind}
        machineLabel={label}
        orgName={orgName}
        depart={view('depart')}
        retour={view('retour')}
        notices={{ ok, missing: 0, pdfFailed: false }}
      />
    </Shell>
  );
}
