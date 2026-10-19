import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/Icons';
import { HeroStage } from '@/components/site/HeroStage';
import { HERO_IMAGE, heroImageAvailable } from '@/components/site/hero-image';
import { SiteFooter, SiteHeader, SkipLink } from '@/components/site/SiteChrome';
import { SiteIcon, type SiteIconName } from '@/components/site/SiteIcons';

// Page générée au déploiement : rapide, et la présence de l'image du héros y est vérifiée une fois.
export const dynamic = 'force-static';

const NB = '\u00a0';
const hasHero = heroImageAvailable();

export const metadata: Metadata = {
  title: { absolute: 'Godet — le garage de votre parc d’engins' },
  description:
    'Le carnet d’entretien numérique des machines de chantier : services, réparations, pièces, coûts, photos, vidéos et échéances. Essai gratuit de 30 jours, sans carte de crédit.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Godet — le garage de votre parc d’engins',
    description:
      'Chaque machine a son carnet complet. Les contrôles ne s’oublient plus, les coûts par machine sont clairs. Conforme à l’art. 32b OPA.',
    url: '/',
    locale: 'fr_CH',
    type: 'website',
    siteName: 'Godet',
    ...(hasHero ? { images: [{ url: HERO_IMAGE, width: 1600, height: 900, alt: 'Le showroom 3D de Godet' }] } : {}),
  },
};

const PAINS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'file',
    title: 'Des carnets papier',
    text: 'Ils restent dans la cabine, se salissent, se perdent. Personne ne sait vraiment où en est la machine.',
  },
  {
    icon: 'search',
    title: 'Des factures éparpillées',
    text: 'Entre le classeur, la boîte e-mail et la camionnette, l’historique d’un engin devient introuvable.',
  },
  {
    icon: 'calendar',
    title: 'Des contrôles oubliés',
    text: 'Le service des 500 h ou le contrôle annuel de sécurité passe à la trappe. On s’en rend compte trop tard.',
  },
  {
    icon: 'chf',
    title: 'Des coûts flous',
    text: 'Impossible de dire ce qu’une machine a coûté cette année, ni s’il est temps de la remplacer.',
  },
];

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'list',
    title: 'Le carnet complet',
    text: 'Services, contrôles, réparations, pièces et notes. Chaque intervention garde sa date, le compteur, qui l’a faite et ce qu’elle a coûté.',
  },
  {
    icon: 'clock',
    title: 'Échéances en heures ou en dates',
    text: `Service toutes les 500${NB}h, contrôle annuel de sécurité${NB}: Godet suit le rythme réel de chaque machine et vous prévient avant l’échéance.`,
  },
  {
    icon: 'chf',
    title: 'Les coûts par machine',
    text: `Pièces, main-d’œuvre, immobilisation${NB}: le coût de chaque engin sur douze mois, mois par mois.`,
  },
  {
    icon: 'camera',
    title: 'Photos, vidéos, documents',
    text: 'Photographiez une fuite, filmez un bruit suspect, déposez la facture en PDF. Tout reste attaché à la machine.',
  },
  {
    icon: 'users',
    title: 'Équipe et rôles',
    text: `Propriétaire, administrateur, mécanicien, machiniste${NB}: chacun accède au parc selon son rôle.`,
  },
  {
    icon: 'wrench',
    title: 'Mode atelier, sans 3D',
    text: 'Une vue en liste, rapide sur tous les appareils, pour saisir les heures et les interventions sans détour.',
  },
  {
    icon: 'print',
    title: 'Le carnet imprimé',
    text: `Le carnet d’une machine s’imprime ou s’enregistre en PDF${NB}: pour un contrôle, une expertise ou une revente.`,
  },
  {
    icon: 'cube',
    title: 'Un showroom pour votre parc',
    text: `Chaque machine sur son plateau, son état visible d’un coup d’œil${NB}: vert, orange ou rouge.`,
  },
];

const PROOFS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'archive',
    title: 'Rien ne s’efface',
    text: 'Une saisie erronée est retirée avec son motif. Elle reste visible, barrée, dans l’historique.',
  },
  {
    icon: 'list',
    title: 'Chaque changement est journalisé',
    text: 'Qui a saisi, modifié ou retiré quoi, et quand.',
  },
  {
    icon: 'shield',
    title: 'Les machines s’archivent',
    text: 'Une machine vendue ou hors service quitte le showroom. Son carnet reste consultable et imprimable.',
  },
];

const SWISS: { icon: SiteIconName; title: string; text: string; formats?: string[] }[] = [
  {
    icon: 'pin',
    title: 'Formats suisses',
    text: 'Heures, francs et dates s’affichent comme vous les écrivez.',
    formats: [`6’842${NB}h`, `CHF${NB}1’240`, '14.08.2026'],
  },
  {
    icon: 'language',
    title: 'En français, avec les mots du chantier',
    text: `Interface en français de Suisse romande. Service 500${NB}h, compteur d’heures, contrôle annuel${NB}: le vocabulaire de l’atelier.`,
  },
  {
    icon: 'database',
    title: 'Données hébergées dans l’UE',
    text: 'Base de données et fichiers sont hébergés en Irlande, dans l’Union européenne.',
  },
  {
    icon: 'lock',
    title: 'Accès réservé à votre entreprise',
    text: 'Chaque entreprise ne voit que ses propres données. Les règles d’accès sont appliquées par la base de données elle-même.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: `Faut-il installer quelque chose${NB}?`,
    a: 'Non. Godet s’ouvre dans le navigateur, sur ordinateur, tablette ou téléphone. Vous pouvez l’ajouter à l’écran d’accueil comme une application.',
  },
  {
    q: `La 3D est-elle obligatoire${NB}?`,
    a: 'Non. Le mode atelier affiche le parc en liste, sans 3D. Il convient aux appareils modestes et aux saisies rapides.',
  },
  {
    q: `Qui voit nos données${NB}?`,
    a: 'Uniquement les personnes que vous invitez dans votre entreprise, selon leur rôle. Les données sont hébergées dans l’UE, en Irlande.',
  },
  {
    q: `Peut-on effacer une intervention${NB}?`,
    a: `On peut la retirer, avec un motif. Elle reste visible dans l’historique${NB}: c’est ce qui fait la valeur du carnet lors d’un contrôle.`,
  },
  {
    q: `Peut-on sortir le carnet de Godet${NB}?`,
    a: 'Oui. Chaque carnet s’imprime ou s’enregistre en PDF, avec les interventions, les réparations, les pièces et les coûts.',
  },
  {
    q: `Que se passe-t-il après l’essai${NB}?`,
    a: 'Les tarifs vous sont annoncés avant la fin des 30 jours. Aucune carte de crédit n’est demandée pour essayer.',
  },
];

export default function HomePage() {
  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader anchors />
      <main id="contenu" className="s-main">
        {/* ---------- héros ---------- */}
        <section className="s-hero" aria-labelledby="titre">
          <div className="s-wrap">
            <p className="s-kicker">
              <i aria-hidden="true" />
              Carnet d’entretien des machines de chantier
            </p>
            <h1 id="titre">
              Le garage de votre <em>parc d’engins</em>
            </h1>
            <p className="s-lead">
              Chaque machine a son carnet complet&nbsp;: services, réparations, pièces, coûts, photos, vidéos et
              échéances. Les contrôles ne s’oublient plus. Vous savez enfin ce que coûte chaque engin.
            </p>
            <div className="s-cta">
              <Link href="/demo" className="btn btn-primary">
                <Icon name="cube" />
                Essayer la démo 3D
              </Link>
              <Link href="/connexion?mode=inscription" className="btn btn-ghost">
                Créer mon garage
                <SiteIcon name="arrow-right" />
              </Link>
            </div>
            <p className="s-hero-login">
              Déjà un compte&nbsp;?{' '}
              <Link href="/connexion" className="s-link">
                Se connecter
              </Link>
            </p>
            <ul className="s-assure">
              <li>
                <Icon name="check" />
                Essai gratuit de 30 jours
              </li>
              <li>
                <Icon name="check" />
                Sans carte de crédit
              </li>
              <li>
                <Icon name="check" />
                Données hébergées dans l’UE
              </li>
            </ul>
            <HeroStage image={hasHero ? HERO_IMAGE : null} />
          </div>
        </section>

        {/* ---------- le problème ---------- */}
        <section className="s-section" aria-labelledby="titre-probleme" id="probleme">
          <div className="s-wrap">
            <div className="s-head">
              <p className="eyebrow">Le constat</p>
              <h2 className="s-h2" id="titre-probleme">
                Le carnet papier ne suit plus le rythme du chantier
              </h2>
              <p>
                Cinq, vingt ou cinquante machines, plusieurs chantiers, une équipe qui tourne. En route,
                l’information se perd.
              </p>
            </div>
            <div className="s-grid s-grid-4">
              {PAINS.map((p) => (
                <article key={p.title} className="s-card s-pain">
                  <span className="s-ico s-ico-dim">
                    <Icon name={p.icon} />
                  </span>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- ce que fait Godet ---------- */}
        <section className="s-section s-section-line" aria-labelledby="titre-fonctions" id="fonctions">
          <div className="s-wrap">
            <div className="s-head">
              <p className="eyebrow">Ce que fait Godet</p>
              <h2 className="s-h2" id="titre-fonctions">
                Tout l’entretien de votre parc, au même endroit
              </h2>
              <p>
                L’historique, les échéances et les coûts de chaque machine, réunis dans un seul garage. Sur
                ordinateur, tablette et téléphone.
              </p>
            </div>
            <div className="s-grid s-grid-4">
              {FEATURES.map((f) => (
                <article key={f.title} className="s-card">
                  <span className="s-ico">
                    <Icon name={f.icon} />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- conformité ---------- */}
        <section className="s-section s-section-line" aria-labelledby="titre-conformite" id="conformite">
          <div className="s-wrap">
            <div className="s-head">
              <p className="eyebrow">Conformité</p>
              <h2 className="s-h2" id="titre-conformite">
                Un carnet qui tient devant un contrôle
              </h2>
            </div>
            <div className="s-split">
              <figure className="s-quote">
                <span className="s-law-mark">ART. 32B OPA</span>
                <blockquote>
                  <span>«&nbsp;</span>Les résultats des opérations d’entretien doivent être consignés.
                  <span>&nbsp;»</span>
                </blockquote>
                <figcaption>
                  Ordonnance sur la prévention des accidents et des maladies professionnelles (OPA, RS 832.30),
                  art. 32b. Godet consigne chaque intervention, datée, avec son auteur et ses coûts.
                </figcaption>
              </figure>
              <div>
                <ul className="s-checks">
                  {PROOFS.map((p) => (
                    <li key={p.title}>
                      <span className="s-ico">
                        <Icon name={p.icon} />
                      </span>
                      <div>
                        <h3>{p.title}</h3>
                        <p>{p.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="s-note">
                  Godet facilite la tenue du carnet. L’entretien des équipements de travail reste de la
                  responsabilité de l’employeur.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- pensé pour la Suisse ---------- */}
        <section className="s-section s-section-line" aria-labelledby="titre-suisse" id="suisse">
          <div className="s-wrap">
            <div className="s-head">
              <p className="eyebrow">Pensé pour la Suisse</p>
              <h2 className="s-h2" id="titre-suisse">
                Conçu en Valais, pour les entreprises suisses
              </h2>
              <p>Godet parle la langue du chantier et respecte vos habitudes.</p>
            </div>
            <div className="s-grid s-grid-4">
              {SWISS.map((s) => (
                <article key={s.title} className="s-card">
                  <span className="s-ico">
                    <SiteIcon name={s.icon} />
                  </span>
                  <h3>{s.title}</h3>
                  {s.formats ? (
                    <ul className="s-formats" aria-label="Exemples de formats">
                      {s.formats.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p>{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- tarif ---------- */}
        <section className="s-section s-section-line" aria-labelledby="titre-tarif" id="tarif">
          <div className="s-wrap">
            <div className="s-price">
              <p className="eyebrow">Tarif</p>
              <h2 className="s-price-big" id="titre-tarif">
                Essai gratuit de 30&nbsp;jours
              </h2>
              <p>Sans carte de crédit. Tarifs annoncés avant la fin de l’essai.</p>
              <div className="s-cta">
                <Link href="/connexion?mode=inscription" className="btn btn-primary">
                  Créer mon garage
                  <SiteIcon name="arrow-right" />
                </Link>
                <Link href="/demo" className="btn btn-ghost">
                  <Icon name="cube" />
                  Essayer la démo 3D
                </Link>
              </div>
              <small>Toutes les fonctions sont disponibles pendant l’essai.</small>
            </div>
          </div>
        </section>

        {/* ---------- questions ---------- */}
        <section className="s-section s-section-line" aria-labelledby="titre-faq" id="questions">
          <div className="s-wrap">
            <div className="s-head s-head-center">
              <p className="eyebrow">Questions</p>
              <h2 className="s-h2" id="titre-faq">
                Questions fréquentes
              </h2>
            </div>
            <div className="s-faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>
                    {item.q}
                    <Icon name="plus" />
                  </summary>
                  <p className="s-faq-a">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- appel final ---------- */}
        <section className="s-section s-section-line s-final-section" aria-labelledby="titre-final">
          <div className="s-wrap s-final">
            <h2 className="s-h2" id="titre-final">
              Ouvrez votre garage
            </h2>
            <p>Visitez la démo sans compte, ou créez votre garage et ajoutez votre première machine.</p>
            <div className="s-cta">
              <Link href="/demo" className="btn btn-primary">
                <Icon name="cube" />
                Essayer la démo 3D
              </Link>
              <Link href="/connexion?mode=inscription" className="btn btn-ghost">
                Créer mon garage
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
