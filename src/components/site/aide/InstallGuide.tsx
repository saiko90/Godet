'use client';

// Tutoriel d'installation : un onglet par appareil, celui de la personne ouvert d'office.
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { DeviceGlyph } from './DeviceGlyph';
import { DEVICES, type Device } from './content';

function detect(): Device {
  const ua = navigator.userAgent;
  // iPadOS se présente comme un Mac : écran tactile = iPad.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iphone';
  if (/Android/.test(ua)) return 'android';
  return 'computer';
}

export function InstallGuide() {
  const t = useTranslations('help.install');
  const [device, setDevice] = useState<Device>('iphone');
  const [mine, setMine] = useState<Device | null>(null);

  useEffect(() => {
    const d = detect();
    queueMicrotask(() => {
      setMine(d);
      setDevice(d);
    });
  }, []);

  return (
    <div className="s-install">
      <div className="s-install-tabs" role="tablist" aria-label={t('title')}>
        {DEVICES.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            id={`tab-${d}`}
            aria-selected={device === d}
            aria-controls={`panel-${d}`}
            className={device === d ? 'is-on' : ''}
            onClick={() => setDevice(d)}
          >
            {t(`devices.${d}.name`)}
            {mine === d ? <span className="s-install-mine">{t('detected')}</span> : null}
          </button>
        ))}
      </div>
      {DEVICES.map((d) => (
        <div key={d} role="tabpanel" id={`panel-${d}`} aria-labelledby={`tab-${d}`} hidden={device !== d} className="s-install-panel">
          <p className="s-install-browser">{t(`devices.${d}.browser`)}</p>
          <ol className="s-install-steps">
            {(t.raw(`devices.${d}.steps`) as string[]).map((step, i) => (
              <li key={i}>
                <span className="s-install-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{step}</span>
                {i === 1 ? (
                  <span className="s-install-glyph">
                    <DeviceGlyph device={d} />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ))}
      <p className="s-install-note">{t('note')}</p>
    </div>
  );
}
