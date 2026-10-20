// État des lieux de départ ou de retour d'une location (formulaire plein écran, pensé pour tablette et téléphone).
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FormatProvider } from '@/components/FormatProvider';
import { RentalCheckForm, type PreviousCheck } from '@/components/site/location/RentalCheckForm';
import { isUuid } from '@/components/site/nav';
import { checkLocale, metaLocale, NO_INDEX } from '@/components/site/seo';
import { AppHeader, SkipLink } from '@/components/site/SiteChrome';
import { getPathname, redirect } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { rentalEnabled } from '@/lib/billing';
import { getDomainText } from '@/lib/domain-text.server';
import { nowMs } from '@/lib/clock';
import { makeFormat } from '@/lib/format';
import { asFuel, type CheckItems, type Rental } from '@/lib/rental';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

type Params = Promise<{ locale: string; id: string; kind: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, kind } = await params;
  const t = await getTranslations({
    locale: metaLocale(locale),
    namespace: 'rental.check',
  });
  return {
    title: kind === 'retour' ? t('titleIn') : t('titleOut'),
    robots: NO_INDEX,
  };
}

export default async function CheckPage({ params }: { params: Params }) {
  const { locale: raw, id, kind } = await params;
  const locale = checkLocale(raw);
  setRequestLocale(locale);
  if (!isUuid(id) || (kind !== 'depart' && kind !== 'retour')) notFound();
  const session = await getSession();
  if (session.status === 'anon') {
    return redirect({
      href: `/connexion?suite=${encodeURIComponent(getPathname({ href: `/location/${id}/${kind}`, locale }))}`,
      locale,
    });
  }
  if (session.status === 'no-org') return redirect({ href: '/bienvenue', locale });
  const { ctx } = session;
  if (!rentalEnabled(ctx.org, nowMs())) return redirect({ href: '/location', locale });

  const supabase = await supabaseServer();
  const { data: rental } = await supabase.from('rentals').select('*').eq('id', id).eq('org_id', ctx.org.id).maybeSingle();
  if (!rental) notFound();
  // Mauvaise étape (départ déjà fait, location terminée…) : retour au rapport ou à l'agenda.
  const expected = kind === 'depart' ? 'reservee' : 'en_cours';
  if (rental.status !== expected) {
    return redirect({
      href: rental.status === 'annulee' ? '/location' : `/location/${id}/rapport`,
      locale,
    });
  }
  const { data: machine } = await supabase
    .from('machines')
    .select('id, code, kind, brand, model, weight_t, hours, serial, plate')
    .eq('id', rental.machine_id)
    .single();
  if (!machine) notFound();

  // Retour : l'état des lieux de départ sert de comparaison (points, compteur, carburant, photos).
  let previous: PreviousCheck | null = null;
  if (kind === 'retour') {
    const { data: dep } = await supabase.from('rental_checks').select('*').eq('rental_id', id).eq('kind', 'depart').maybeSingle();
    if (dep) {
      const { data: media } = await supabase.from('media').select('id, path, slot, kind').eq('rental_check_id', dep.id).order('taken_at');
      const paths = (media ?? []).filter((m) => m.kind === 'photo').map((m) => m.path);
      const { data: signed } = paths.length ? await supabase.storage.from('medias').createSignedUrls(paths, 3600) : { data: [] };
      const url = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
      previous = {
        items: (dep.items ?? {}) as unknown as CheckItems,
        hours: dep.hours != null ? Number(dep.hours) : null,
        fuel: asFuel(dep.fuel_level),
        accessories: dep.accessories,
        keys: dep.keys_count,
        at: dep.created_at,
        photos: (media ?? [])
          .filter((m) => m.kind === 'photo')
          .map((m) => ({
            slot: m.slot ?? 'libre',
            url: url.get(m.path) ?? null,
          })),
      };
    }
  }

  // Départ : conditions de location du loueur (case à cocher avant la signature).
  const termsUrl =
    kind === 'depart' && ctx.org.rental_terms_path
      ? ((await supabase.storage.from('medias').createSignedUrl(ctx.org.rental_terms_path, 3600)).data?.signedUrl ?? null)
      : null;

  const f = makeFormat({
    locale,
    country: ctx.org.country,
    currency: ctx.org.currency,
  });
  const dt = await getDomainText(locale, f);
  const messages = (await getMessages({ locale })) as unknown as AppMessages;
  return (
    <div className="s-page">
      <SkipLink />
      <AppHeader orgName={ctx.org.name} />
      <main id="contenu" className="s-wrap s-rent s-check-page">
        <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain', 'rental', 'garage'])}>
          <FormatProvider locale={locale} country={ctx.org.country} currency={ctx.org.currency}>
            <RentalCheckForm
              kind={kind}
              org={{
                id: ctx.org.id,
                name: ctx.org.name,
                trackLocation: ctx.org.track_location,
                termsUrl,
              }}
              role={ctx.role}
              userId={ctx.userId}
              staffName={ctx.fullName ?? ctx.email}
              rental={rental as Rental}
              machine={{
                ...machine,
                hours: Number(machine.hours),
                title: dt.machineTitle(machine),
              }}
              previous={previous}
            />
          </FormatProvider>
        </NextIntlClientProvider>
      </main>
    </div>
  );
}
