import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Icon } from '@/components/Icons';
import { ArchivesPanel } from '@/components/site/parametres/ArchivesPanel';
import { ComptePanel } from '@/components/site/parametres/ComptePanel';
import { EntreprisePanel } from '@/components/site/parametres/EntreprisePanel';
import { EquipePanel } from '@/components/site/parametres/EquipePanel';
import { AppHeader, SkipLink } from '@/components/site/SiteChrome';
import type { ArchivedMachine, PendingInvitation } from '@/components/site/types';
import { can, machineMakeModel, machineTitle, ROLES } from '@/lib/domain';
import { siteUrl } from '@/lib/env';
import { dateCH } from '@/lib/format';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import type { Member, MemberRole, Org } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Paramètres',
  robots: { index: false, follow: false },
};

const ROLE_ORDER: Record<MemberRole, number> = { owner: 0, admin: 1, mechanic: 2, operator: 3 };

/** Adresse publique telle que vue par le navigateur (liens d'invitation). */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return siteUrl();
  const proto = h.get('x-forwarded-proto') ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https');
  return `${proto.split(',')[0].trim()}://${host}`;
}

function planLabel(org: Org, now: number): string {
  if (org.plan === 'actif') return 'Abonnement actif';
  if (org.plan === 'suspendu') return 'Compte suspendu';
  const end = Date.parse(org.trial_ends_at);
  return end < now ? `Essai terminé le ${dateCH(org.trial_ends_at)}` : `Essai gratuit jusqu’au ${dateCH(org.trial_ends_at)}`;
}

export default async function ParametresPage() {
  const session = await getSession();
  if (session.status === 'anon') redirect('/connexion?suite=/parametres');
  if (session.status === 'no-org') redirect('/bienvenue');
  const { ctx } = session;
  const orgId = ctx.org.id;
  const supabase = await supabaseServer();

  const [membersRes, invitesRes, archivedRes, activeRes, origin] = await Promise.all([
    supabase.from('memberships').select('user_id, role, created_at, profiles(full_name, email)').eq('org_id', orgId),
    // Réservé au propriétaire et aux administrateurs (la RLS renvoie une liste vide aux autres).
    supabase
      .from('invitations')
      .select('id, email, role, token, created_at, expires_at')
      .eq('org_id', orgId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('machines')
      .select('id, code, kind, brand, model, year, weight_t, archived_at')
      .eq('org_id', orgId)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false }),
    supabase.from('machines').select('code').eq('org_id', orgId).is('archived_at', null),
    requestOrigin(),
  ]);

  if (membersRes.error) console.error('[parametres] membres :', membersRes.error.code, membersRes.error.message);
  if (invitesRes.error) console.error('[parametres] invitations :', invitesRes.error.code, invitesRes.error.message);
  if (archivedRes.error) console.error('[parametres] archives :', archivedRes.error.code, archivedRes.error.message);

  const members: Member[] = (membersRes.data ?? [])
    .map((m) => ({
      userId: m.user_id,
      role: m.role,
      fullName: m.profiles?.full_name ?? null,
      email: m.profiles?.email ?? null,
      since: m.created_at,
    }))
    .sort(
      (a, b) =>
        ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
        (a.fullName || a.email || '').localeCompare(b.fullName || b.email || '', 'fr-CH'),
    );

  const invitations: PendingInvitation[] = (invitesRes.data ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    token: i.token,
    createdAt: i.created_at,
    expiresAt: i.expires_at,
  }));

  const activeCodes = new Set((activeRes.data ?? []).map((m) => m.code.trim().toLowerCase()));
  const archived: ArchivedMachine[] = (archivedRes.data ?? []).map((m) => ({
    id: m.id,
    code: m.code,
    title: machineTitle(m),
    makeModel: machineMakeModel(m),
    archivedAt: m.archived_at ?? '',
    codeFree: !activeCodes.has(m.code.trim().toLowerCase()),
  }));

  const nowIso = new Date().toISOString();
  const myName = ctx.fullName?.trim() || members.find((m) => m.userId === ctx.userId)?.fullName || '';

  return (
    <div className="s-page">
      <SkipLink />
      <AppHeader orgName={ctx.org.name} />
      <main id="contenu" className="s-wrap s-settings">
        <div className="s-settings-title">
          <p className="eyebrow">{ctx.org.name}</p>
          <h1>Paramètres</h1>
          <p>
            Votre rôle&nbsp;: <b>{ROLES[ctx.role].label}</b>. {ROLES[ctx.role].hint}
          </p>
        </div>
        <div className="s-settings-layout">
          <nav className="s-settings-nav" aria-label="Sections des paramètres">
            <ul>
              <li>
                <a href="#entreprise">
                  <Icon name="garage" />
                  Entreprise
                </a>
              </li>
              <li>
                <a href="#equipe">
                  <Icon name="users" />
                  Équipe
                </a>
              </li>
              <li>
                <a href="#compte">
                  <Icon name="edit" />
                  Mon compte
                </a>
              </li>
              <li>
                <a href="#archives">
                  <Icon name="archive" />
                  Machines archivées
                </a>
              </li>
            </ul>
          </nav>
          <div className="s-panels">
            <EntreprisePanel
              org={{ id: ctx.org.id, name: ctx.org.name, canton: ctx.org.canton }}
              planLabel={planLabel(ctx.org, Date.parse(nowIso))}
              createdLabel={dateCH(ctx.org.created_at)}
              canEdit={can.manageTeam(ctx.role)}
              orgs={ctx.orgs}
            />
            <EquipePanel
              members={members}
              membersError={Boolean(membersRes.error)}
              invitations={invitations}
              meId={ctx.userId}
              canManage={can.manageTeam(ctx.role)}
              orgName={ctx.org.name}
              myName={myName}
              origin={origin}
              nowIso={nowIso}
            />
            <ComptePanel
              fullName={ctx.fullName}
              email={ctx.email}
              orgName={ctx.org.name}
              canLeave={ctx.role !== 'owner'}
            />
            <ArchivesPanel machines={archived} loadError={Boolean(archivedRes.error)} canRestore={can.manageFleet(ctx.role)} />
          </div>
        </div>
      </main>
    </div>
  );
}
