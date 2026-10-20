'use client';

import { useTranslations } from 'next-intl';
import { Loader } from '@/components/Loader';

export default function Loading() {
  const t = useTranslations('demo');
  return <Loader label={t('loading')} />;
}
