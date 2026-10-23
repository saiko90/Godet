// Données structurées pour Google (schema.org, JSON-LD). Le « < » est échappé : le JSON ne peut pas fermer la balise.
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
