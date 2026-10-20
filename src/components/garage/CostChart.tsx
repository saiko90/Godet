'use client';

// Coûts par mois sur 12 mois, en colonnes empilées (entretien, réparations, pièces).
// Colonnes fines à bout arrondi, 2 px d'écart entre les segments, grille discrète, légende, infobulle au survol
// et au clavier (flèches gauche/droite), et le tableau des chiffres pour qui ne lit pas le graphique.
import { useTranslations } from 'next-intl';
import { useId, useState, type KeyboardEvent } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { COST_CATEGORIES, type CostCategory, type MonthCost } from '@/lib/domain';
import { useDomainText } from '@/lib/use-domain-text';

const W = 440;
const H = 220;
const M = { l: 46, r: 8, t: 22, b: 26 };
const ORDER: CostCategory[] = ['entretien', 'reparations', 'pieces'];
const GAP = 2;

function niceMax(v: number): number {
  if (v <= 0) return 1000;
  const steps = [500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000];
  for (const s of steps) if (v <= s * 4) return Math.ceil(v / s) * s;
  return Math.ceil(v / 100000) * 100000;
}

/** Barre à bout supérieur arrondi (4 px), carrée à la base. */
function capPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

export function CostChart({ months, title }: { months: MonthCost[]; title: string }) {
  const t = useTranslations('garage.chart');
  const f = useFormat();
  const dt = useDomainText();
  const uid = useId().replace(/:/g, '');
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...months.map((m) => m.total)));
  const pw = W - M.l - M.r;
  const ph = H - M.t - M.b;
  const y = (v: number) => M.t + ph - (v / max) * ph;
  const band = pw / months.length;
  const bw = Math.min(22, band * 0.62);
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
  const peak = months.reduce((best, m, i) => (m.total > months[best].total ? i : best), 0);
  const first = months[0];
  const last = months[months.length - 1];
  const range = t('range', { from: f.month(first.ym, true), to: f.month(last.ym, true) });
  const currency = t('currency', { currency: f.currency });

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    e.stopPropagation();
    const cur = active ?? months.length - 1;
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? months.length - 1
          : Math.min(months.length - 1, Math.max(0, cur + (e.key === 'ArrowRight' ? 1 : -1)));
    setActive(next);
  }

  const tip = active != null ? months[active] : null;
  const tipLeft = active != null ? ((M.l + band * active + band / 2) / W) * 100 : 0;

  return (
    <figure className="chart g-chart" aria-labelledby={`${uid}-t`}>
      <figcaption id={`${uid}-t`} className="g-chart-title">
        {title}
      </figcaption>
      <div className="g-chart-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t('aria', { range, currency })}
          tabIndex={0}
          data-own-arrows=""
          onKeyDown={onKey}
          onFocus={() => setActive((a) => a ?? months.length - 1)}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line className="grid" x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} />
              <text className="ax" x={M.l - 8} y={y(v) + 3.5} textAnchor="end">
                {f.num(v)}
              </text>
            </g>
          ))}
          {months.map((m, i) => {
            const x = M.l + band * i + (band - bw) / 2;
            let acc = 0;
            const parts = ORDER.filter((k) => m[k] > 0);
            return (
              <g
                key={m.ym}
                className={`col${active === i ? ' is-active' : ''}`}
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}
              >
                <rect className="g-chart-hit" x={M.l + band * i} y={M.t} width={band} height={ph} />
                {parts.map((k, j) => {
                  const top = j === parts.length - 1;
                  const y0 = y(acc);
                  acc += m[k];
                  const y1 = y(acc);
                  // Écart de 2 px entre segments, pris sur le segment du dessus.
                  const h = Math.max(0.8, y0 - y1 - (j > 0 ? GAP : 0));
                  const yy = y1;
                  return top ? (
                    <path key={k} d={capPath(x, yy, bw, h, 4)} fill={COST_CATEGORIES[k].color} />
                  ) : (
                    <rect key={k} x={x} y={yy} width={bw} height={h} fill={COST_CATEGORIES[k].color} />
                  );
                })}
                <text className="ax" x={x + bw / 2} y={H - 8} textAnchor="middle">
                  {f.month(m.ym)}
                </text>
                {i === peak && m.total > 0 ? (
                  <text className="g-chart-peak" x={x + bw / 2} y={y(m.total) - 6} textAnchor="middle">
                    {f.num(Math.round(m.total))}
                  </text>
                ) : null}
              </g>
            );
          })}
          <line className="g-chart-base" x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} />
        </svg>
        {tip ? (
          <div className={`g-chart-tip${tipLeft > 62 ? ' is-left' : ''}`} style={{ left: `${tipLeft}%` }} aria-hidden="true">
            <b>{f.money(tip.total)}</b>
            <span className="g-chart-tip-m">{f.month(tip.ym, true)}</span>
            {ORDER.map((k) => (
              <span key={k} className="g-chart-tip-row">
                <i style={{ background: COST_CATEGORIES[k].color }} />
                <b>{f.money(tip[k])}</b> {dt.cost(k)}
              </span>
            ))}
          </div>
        ) : null}
        <p className="g-sr" aria-live="polite">
          {tip
            ? t('live', {
                month: f.month(tip.ym, true),
                total: f.money(tip.total),
                maintenance: f.money(tip.entretien),
                repairs: f.money(tip.reparations),
                parts: f.money(tip.pieces),
              })
            : ''}
        </p>
      </div>
      <div className="legend" aria-hidden="true">
        {ORDER.map((k) => (
          <span key={k}>
            <i style={{ background: COST_CATEGORIES[k].color }} />
            {dt.cost(k)}
          </span>
        ))}
      </div>
      <details className="g-chart-table">
        <summary>{t('showTable')}</summary>
        <div className="table-wrap">
          <table>
            <caption className="g-sr">{t('caption', { range, currency })}</caption>
            <thead>
              <tr>
                <th scope="col">{t('month')}</th>
                {ORDER.map((k) => (
                  <th key={k} scope="col" className="r">
                    {dt.cost(k)}
                  </th>
                ))}
                <th scope="col" className="r">
                  {t('total')}
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.ym}>
                  <th scope="row" className="g-th-row">
                    {f.month(m.ym, true)}
                  </th>
                  {ORDER.map((k) => (
                    <td key={k} className="r">
                      {f.money(m[k])}
                    </td>
                  ))}
                  <td className="r">{f.money(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
