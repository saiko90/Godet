import Link from 'next/link';
import { AuthShell } from '@/components/site/SiteChrome';
import { Icon } from '@/components/Icons';

export default function CarnetIntrouvable() {
  return (
    <AuthShell>
      <span className="s-big-icon s-bad" aria-hidden="true">
        <Icon name="file" />
      </span>
      <div className="s-auth-head">
        <h1>Carnet introuvable</h1>
        <p>
          Cette machine n’existe pas, ou elle appartient à une autre entreprise que la vôtre. Ouvrez le carnet depuis
          la fiche de la machine, dans votre garage.
        </p>
      </div>
      <Link href="/garage" className="btn btn-primary btn-block">
        <Icon name="garage" />
        Ouvrir mon garage
      </Link>
    </AuthShell>
  );
}
