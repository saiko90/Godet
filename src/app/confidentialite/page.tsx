import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter, SiteHeader, SkipLink, STUDIO_URL } from '@/components/site/SiteChrome';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Comment Godet traite vos données : responsable, données traitées, finalités, sous-traitants, durée de conservation et vos droits selon la nLPD.',
  alternates: { canonical: '/confidentialite' },
};

const UPDATED = '19.10.2026';

export default function ConfidentialitePage() {
  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader />
      <main id="contenu" className="s-main s-legal">
        <div className="s-wrap">
          <article className="s-legal-inner">
            <p className="eyebrow">Protection des données</p>
            <h1>Politique de confidentialité</h1>
            <p className="s-legal-date">Dernière mise à jour&nbsp;: {UPDATED}</p>
            <p className="s-legal-intro">
              Godet est le carnet d’entretien numérique des machines de chantier. Cette page explique quelles données
              nous traitons, pourquoi, où elles sont hébergées et quels sont vos droits, conformément à la loi fédérale
              sur la protection des données (nLPD).
            </p>

            <h2>
              <span>01</span> Responsable du traitement
            </h2>
            <p>
              <strong>Swiss Digital Studio</strong>, Valais, Suisse, éditeur de Godet. Pour toute question sur vos
              données, contactez-nous via{' '}
              <a className="s-link" href={STUDIO_URL}>
                www.swissdigitalstudio.ch
              </a>
              .
            </p>
            <p>
              Les données que votre entreprise saisit dans Godet (parc, interventions, médias) sont les siennes&nbsp;:
              elle décide de leur contenu, et nous les traitons pour son compte.
            </p>

            <h2>
              <span>02</span> Données traitées
            </h2>
            <ul>
              <li>
                <strong>Compte</strong>&nbsp;: nom, adresse e-mail, mot de passe (jamais stocké en clair), entreprises
                dont vous êtes membre et rôle dans chacune.
              </li>
              <li>
                <strong>Données du parc</strong>&nbsp;: machines, interventions, échéances, relevés d’heures, coûts et
                notes saisis par votre entreprise, avec le nom de la personne qui a fait chaque saisie.
              </li>
              <li>
                <strong>Médias déposés</strong>&nbsp;: photos, vidéos et documents (factures, rapports) ajoutés aux
                machines.
              </li>
              <li>
                <strong>Journal des modifications</strong>&nbsp;: qui a créé, modifié ou retiré quoi, et quand.
              </li>
              <li>
                <strong>Données techniques</strong>&nbsp;: informations nécessaires au fonctionnement et à la sécurité,
                comme l’adresse IP et le type de navigateur dans les journaux des serveurs.
              </li>
            </ul>
            <p>
              La démo 3D fonctionne sans compte&nbsp;: ce que vous y faites reste dans votre navigateur.
            </p>

            <h2>
              <span>03</span> Finalités
            </h2>
            <ul>
              <li>Tenir le carnet d’entretien de vos machines, calculer les échéances et les coûts.</li>
              <li>Gérer les comptes, les invitations et les droits d’accès de votre équipe.</li>
              <li>Envoyer les e-mails liés au compte (confirmation d’adresse, nouveau mot de passe).</li>
              <li>Assurer la sécurité du service et prévenir les abus.</li>
            </ul>
            <p>
              Nous ne vendons pas vos données et ne les utilisons pas à des fins publicitaires.
            </p>

            <h2>
              <span>04</span> Cookies et traceurs
            </h2>
            <p>
              Godet utilise uniquement des cookies techniques&nbsp;: celui de votre session de connexion et celui qui
              mémorise l’entreprise active. Aucun traceur publicitaire, aucun outil de mesure d’audience tiers.
            </p>

            <h2>
              <span>05</span> Sous-traitants et lieu d’hébergement
            </h2>
            <ul>
              <li>
                <strong>Supabase</strong>&nbsp;: base de données, authentification et stockage des fichiers. Les
                données sont hébergées dans l’Union européenne (Irlande).
              </li>
              <li>
                <strong>Vercel</strong>&nbsp;: hébergement et diffusion du site.
              </li>
            </ul>
            <p>
              Ces prestataires peuvent être établis hors de Suisse. Lorsque des données y sont communiquées, nous nous
              appuyons sur une décision d’adéquation du Conseil fédéral ou sur des garanties contractuelles reconnues,
              comme les clauses contractuelles types.
            </p>

            <h2>
              <span>06</span> Sécurité
            </h2>
            <p>
              Les échanges sont chiffrés (HTTPS). Chaque entreprise ne voit que ses propres données&nbsp;: les règles
              d’accès sont appliquées par la base de données elle-même. Les photos, vidéos et documents sont rangés
              dans un espace privé et ne s’ouvrent que par des liens temporaires.
            </p>

            <h2>
              <span>07</span> Durée de conservation
            </h2>
            <p>
              Les données de votre compte et de votre entreprise sont conservées tant que le compte est actif. Le
              carnet d’entretien sert de preuve&nbsp;: une saisie retirée y reste visible avec son motif. Après la fin
              du contrat, les données sont supprimées, sauf obligation légale de conservation. Avant cela, vous pouvez
              imprimer ou enregistrer en PDF le carnet de chaque machine.
            </p>

            <h2>
              <span>08</span> Vos droits
            </h2>
            <p>Vous pouvez à tout moment demander&nbsp;:</p>
            <ul>
              <li>l’accès aux données qui vous concernent&nbsp;;</li>
              <li>leur rectification si elles sont inexactes&nbsp;;</li>
              <li>leur effacement, dans les limites des obligations légales&nbsp;;</li>
              <li>leur remise dans un format courant.</li>
            </ul>
            <div className="s-legal-box">
              <p>
                Votre nom se modifie directement dans{' '}
                <Link className="s-link" href="/parametres#compte">
                  Paramètres → Mon compte
                </Link>
                . Pour toute autre demande, écrivez-nous via{' '}
                <a className="s-link" href={STUDIO_URL}>
                  www.swissdigitalstudio.ch
                </a>
                . Vous pouvez aussi vous adresser au Préposé fédéral à la protection des données et à la transparence
                (PFPDT).
              </p>
            </div>

            <h2>
              <span>09</span> Modifications
            </h2>
            <p>
              Nous pouvons adapter cette politique, par exemple si le service évolue. La date de la dernière mise à
              jour figure en haut de cette page.
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
