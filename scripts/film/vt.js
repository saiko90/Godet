// Horloge virtuelle pour filmer une page image par image (injectée avant tout script de la page).
// Mode réel au chargement ; window.__vt.start() fige le temps, puis window.__vt.advance(ms) le fait avancer :
// minuteries, requestAnimationFrame, performance.now et animations CSS / Web Animations suivent l'horloge virtuelle.
(() => {
  const W = window;
  const realRaf = W.requestAnimationFrame.bind(W);
  const realCaf = W.cancelAnimationFrame.bind(W);
  const realSetTimeout = W.setTimeout.bind(W);
  const realClearTimeout = W.clearTimeout.bind(W);
  const realSetInterval = W.setInterval.bind(W);
  const realClearInterval = W.clearInterval.bind(W);
  const realNow = performance.now.bind(performance);
  let virtual = false;
  let vnow = 0;
  let seq = 1e9;
  const rafs = new Map();
  const timers = new Map();
  const starts = new WeakMap();

  performance.now = () => (virtual ? vnow : realNow());
  W.requestAnimationFrame = (cb) => {
    if (!virtual) return realRaf(cb);
    const id = ++seq;
    rafs.set(id, cb);
    return id;
  };
  W.cancelAnimationFrame = (id) => {
    if (rafs.has(id)) rafs.delete(id);
    else realCaf(id);
  };
  W.setTimeout = (fn, ms, ...args) => {
    if (!virtual || typeof fn !== 'function') return realSetTimeout(fn, ms, ...args);
    const id = ++seq;
    timers.set(id, { at: vnow + Math.max(0, Number(ms) || 0), fn, args, every: 0 });
    return id;
  };
  W.setInterval = (fn, ms, ...args) => {
    if (!virtual || typeof fn !== 'function') return realSetInterval(fn, ms, ...args);
    const every = Math.max(4, Number(ms) || 0);
    const id = ++seq;
    timers.set(id, { at: vnow + every, fn, args, every });
    return id;
  };
  W.clearTimeout = (id) => {
    if (timers.has(id)) timers.delete(id);
    else realClearTimeout(id);
  };
  W.clearInterval = (id) => {
    if (timers.has(id)) timers.delete(id);
    else realClearInterval(id);
  };

  function runTimers(until) {
    for (let guard = 0; guard < 5000; guard++) {
      let best = null;
      let bestId = 0;
      for (const [id, tm] of timers) if (tm.at <= until && (!best || tm.at < best.at)) { best = tm; bestId = id; }
      if (!best) break;
      vnow = Math.max(vnow, best.at);
      if (best.every) best.at += best.every;
      else timers.delete(bestId);
      try { best.fn(...best.args); } catch (e) { console.error('[vt] minuterie', e); }
    }
    vnow = until;
  }

  function syncAnimations() {
    let list;
    try { list = document.getAnimations(); } catch { return; }
    for (const a of list) {
      let st = starts.get(a);
      if (st === undefined) {
        const ct = typeof a.currentTime === 'number' ? a.currentTime : 0;
        st = vnow - (virtual ? 0 : ct);
        starts.set(a, st);
        try { a.pause(); } catch {}
      }
      const timing = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      const end = timing ? timing.endTime : Infinity;
      const t = Math.max(0, vnow - st);
      try {
        if (Number.isFinite(end) && t >= end) a.finish();
        else a.currentTime = t;
      } catch {}
    }
  }

  const microtasks = () => new Promise((r) => realSetTimeout(r, 0));

  W.__vt = {
    get virtual() { return virtual; },
    get now() { return vnow; },
    start() {
      if (virtual) return vnow;
      vnow = realNow();
      virtual = true;
      syncAnimations();
      return vnow;
    },
    /** Avance de ms millisecondes : minuteries, animations CSS, puis une image (requestAnimationFrame). */
    async advance(ms) {
      runTimers(vnow + ms);
      await microtasks();
      syncAnimations();
      const cbs = [...rafs.values()];
      rafs.clear();
      for (const cb of cbs) { try { cb(vnow); } catch (e) { console.error('[vt] image', e); } }
      await microtasks();
      syncAnimations();
      return { now: vnow, rafs: rafs.size, timers: timers.size };
    },
  };
})();
