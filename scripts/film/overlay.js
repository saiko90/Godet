// Calque des films de Godet : sous-titres, curseur, clic, carton de fin. Injecté dans la page filmée.
// La page ne décide de rien : le script de tournage lui envoie l'état exact de chaque image (window.__film.render).
(() => {
  if (window.__film) return;
  const css = `
#film-root { position: fixed; inset: 0; pointer-events: none; z-index: 2147483000; font-family: var(--f-body); }
#film-cap { position: absolute; left: 40px; bottom: 44px; max-width: 760px; display: flex; gap: 16px; align-items: stretch;
  padding: 16px 24px 17px 16px; border-radius: 16px; background: rgba(9, 10, 12, 0.86);
  border: 1px solid rgba(236, 232, 222, 0.10); box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45); opacity: 0; will-change: transform, opacity; }
#film-cap i { width: 4px; border-radius: 2px; background: var(--paint, #f3b71b); flex: none; }
#film-cap div { display: flex; flex-direction: column; gap: 6px; }
#film-cap small { font-family: var(--f-display); font-size: 10.5px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--paint, #f3b71b); }
#film-cap span { font-size: 25px; line-height: 1.22; font-weight: 600; color: var(--chalk, #ece8de); letter-spacing: -0.005em; text-wrap: balance; }
#film-cur { position: absolute; left: 0; top: 0; width: 26px; height: 26px; opacity: 0; will-change: transform; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.55)); }
#film-ring { position: absolute; left: 0; top: 0; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%;
  border: 2.5px solid var(--paint, #f3b71b); opacity: 0; will-change: transform, opacity; }
#film-end { position: absolute; inset: 0; background: var(--night, #08090b); opacity: 0; display: flex; align-items: center; justify-content: center; }
#film-end .in { display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; will-change: transform, opacity; }
#film-end .mark { display: flex; align-items: center; gap: 22px; }
#film-end svg { width: 74px; height: 70px; }
#film-end b { font-family: var(--f-display); font-weight: 400; font-size: 54px; letter-spacing: 0.3em; padding-left: 0.3em; color: var(--chalk, #ece8de); }
#film-end p { margin: 0; font-size: 23px; line-height: 1.35; color: var(--steel, #a2a6ad); max-width: 820px; }
#film-end em { font-style: normal; font-size: 19px; font-weight: 600; color: var(--night, #08090b); background: var(--paint, #f3b71b);
  padding: 11px 22px; border-radius: 999px; margin-top: 12px; }
#film-end .url { font-family: var(--f-mono); font-size: 15px; color: var(--steel, #a2a6ad); letter-spacing: 0.02em; margin-top: -4px; }
`;
  const bucket = `<svg viewBox="6 8 28 26" aria-hidden="true"><path d="M7 9h15c6.6 0 11 4.4 11 11v2.5L27.5 30H17C11.5 30 7 25.5 7 20z" fill="var(--paint, #f3b71b)"/><path d="M13 15h8.5c3.6 0 5.5 2.1 5.5 5.5v.5l-3 4h-6.5c-2.5 0-4.5-2-4.5-4.5z" fill="var(--night, #08090b)"/><path d="M17 30l1.6 4 1.6-4zM21.6 30l1.6 4 1.6-4zM26.2 30l1.6 4 1.6-4z" fill="var(--paint, #f3b71b)"/></svg>`;
  const cursor = `<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M5 2.5v18.6l4.6-4.4 3.1 7.1 3.4-1.5-3.1-7h6.4z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  let root = null;
  const el = {};
  const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
  function mount() {
    if (root && document.body.contains(root)) return;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    root = document.createElement('div');
    root.id = 'film-root';
    root.innerHTML = `<div id="film-cap"><i></i><div><small></small><span></span></div></div>
<div id="film-ring"></div><div id="film-cur">${cursor}</div>
<div id="film-end"><div class="in"><div class="mark">${bucket}<b>GODET</b></div><p></p><em></em><span class="url"></span></div></div>`;
    document.body.appendChild(root);
    el.cap = root.querySelector('#film-cap');
    el.capSmall = el.cap.querySelector('small');
    el.capText = el.cap.querySelector('span');
    el.cur = root.querySelector('#film-cur');
    el.ring = root.querySelector('#film-ring');
    el.end = root.querySelector('#film-end');
    el.endIn = el.end.querySelector('.in');
    el.endP = el.end.querySelector('p');
    el.endEm = el.end.querySelector('em');
    el.endUrl = el.end.querySelector('.url');
  }
  window.__film = {
    /**
     * s.cap: { text, eyebrow, k } (k : 0 → 1 entrée, 1 → 2 sortie) ou null
     * s.cur: { x, y, on, down } ; s.ring: { x, y, k } (0 → 1) ou null ; s.end: { k, tagline, cta, url } ou null
     */
    render(s) {
      mount();
      const c = s.cap;
      if (c && c.k > 0 && c.k < 2) {
        if (el.capText.textContent !== c.text) el.capText.textContent = c.text;
        el.capSmall.textContent = c.eyebrow || '';
        el.capSmall.style.display = c.eyebrow ? '' : 'none';
        const kin = ease(c.k);
        const kout = c.k > 1 ? ease(c.k - 1) : 0;
        el.cap.style.opacity = String(c.k <= 1 ? kin : 1 - kout);
        el.cap.style.transform = `translateY(${c.k <= 1 ? (1 - kin) * 16 : -kout * 8}px)`;
      } else {
        el.cap.style.opacity = '0';
      }
      const u = s.cur;
      if (u && u.on) {
        el.cur.style.opacity = '1';
        el.cur.style.transform = `translate(${u.x - 5}px, ${u.y - 2.5}px) scale(${u.down ? 0.86 : 1})`;
      } else {
        el.cur.style.opacity = '0';
      }
      const r = s.ring;
      if (r && r.k >= 0 && r.k < 1) {
        const kk = ease(r.k);
        el.ring.style.opacity = String(0.95 * (1 - r.k));
        el.ring.style.transform = `translate(${r.x}px, ${r.y}px) scale(${0.35 + kk * 1.05})`;
      } else {
        el.ring.style.opacity = '0';
      }
      const e = s.end;
      if (e && e.k > 0) {
        el.endP.textContent = e.tagline;
        el.endEm.textContent = e.cta;
        el.endUrl.textContent = e.url || '';
        el.endUrl.style.display = e.url ? '' : 'none';
        el.end.style.opacity = String(ease(e.k / 0.55));
        const kc = ease((e.k - 0.25) / 0.7);
        el.endIn.style.opacity = String(kc);
        el.endIn.style.transform = `translateY(${(1 - kc) * 18}px)`;
      } else {
        el.end.style.opacity = '0';
      }
    },
  };
})();
