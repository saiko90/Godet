import { getTranslations } from 'next-intl/server';
import { Loader } from '@/components/Loader';

export default async function Loading() {
  const t = await getTranslations('settings');
  return <Loader label={t('loading')} />;
}
