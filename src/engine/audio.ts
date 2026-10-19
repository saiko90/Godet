// Sons de synthèse (WebAudio, aucun fichier) : ambiance du hall, interrupteurs des néons, vols de caméra,
// hydraulique, moteur au ralenti et petits effets d'interface.
// Le contexte audio n'est créé que dans unlock(), appelé pendant un geste : aucun avertissement d'autoplay.

type AudioCtor = typeof AudioContext;

function audioCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext || w.webkitAudioContext || null;
}

/** Le navigateur considère-t-il qu'un geste vient d'avoir lieu (sinon, reprendre le son provoquerait un avertissement) ? */
function gestureActive(sticky = false): boolean {
  const ua = (navigator as Navigator & { userActivation?: { isActive: boolean; hasBeenActive: boolean } }).userActivation;
  if (!ua) return true;
  return sticky ? ua.hasBeenActive : ua.isActive;
}

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private verb: ConvolverNode | null = null;
  private noise: AudioBuffer | null = null;
  private amb: { nodes: AudioScheduledSourceNode[]; gain: GainNode } | null = null;
  private idle: { g: GainNode; nodes: AudioScheduledSourceNode[] } | null = null;
  private enabled: boolean;
  private suspendedByPause = false;
  private disposed = false;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  get unlocked(): boolean {
    return !!this.ctx && this.ctx.state !== 'closed';
  }

  /** À appeler dans un geste (clic, toucher, touche). Hors geste, ne fait rien (pas d'avertissement du navigateur). */
  unlock(): void {
    if (this.disposed || !gestureActive()) return;
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && !this.suspendedByPause) void this.ctx.resume().catch(() => {});
      return;
    }
    const AC = audioCtor();
    if (!AC) return;
    try {
      const c = new AC();
      this.ctx = c;
      this.master = c.createGain();
      this.master.gain.value = this.enabled ? 0.9 : 0;
      this.master.connect(c.destination);
      this.verb = c.createConvolver();
      this.verb.buffer = this.impulse(3.2, 3);
      const vg = c.createGain();
      vg.gain.value = 0.45;
      this.verb.connect(vg);
      vg.connect(this.master);
      const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
      this.ambience();
    } catch {
      this.ctx = null;
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.06);
    if (on && this.ctx.state === 'suspended' && !this.suspendedByPause && gestureActive()) {
      void this.ctx.resume().catch(() => {});
    }
  }

  /** Pause du moteur : on coupe le contexte pour économiser la batterie. */
  suspend(): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.suspendedByPause = true;
    void this.ctx.suspend().catch(() => {});
  }

  resume(): void {
    if (!this.ctx) return;
    this.suspendedByPause = false;
    if (this.ctx.state === 'suspended' && gestureActive(true)) void this.ctx.resume().catch(() => {});
  }

  dispose(): void {
    this.disposed = true;
    this.engineOff(true);
    if (this.amb) {
      for (const n of this.amb.nodes) {
        try {
          n.stop();
        } catch {
          /* déjà arrêté */
        }
      }
      this.amb = null;
    }
    if (this.ctx) void this.ctx.close().catch(() => {});
    this.ctx = null;
  }

  // ---------------------------------------------------------------- outils

  private ok(): boolean {
    return !!this.ctx && this.ctx.state === 'running' && this.enabled && !this.disposed;
  }

  private impulse(sec: number, decay: number): AudioBuffer {
    const c = this.ctx as AudioContext;
    const n = Math.floor(c.sampleRate * sec);
    const b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }

  private route(node: AudioNode, wet = 0.25): void {
    const c = this.ctx as AudioContext;
    node.connect(this.master as GainNode);
    if (wet > 0 && this.verb) {
      const g = c.createGain();
      g.gain.value = wet;
      node.connect(g);
      g.connect(this.verb);
    }
  }

  private src(loop = false): AudioBufferSourceNode {
    const s = (this.ctx as AudioContext).createBufferSource();
    s.buffer = this.noise;
    s.loop = loop;
    return s;
  }

  private env(g: GainNode, t: number, a: number, peak: number, d: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  private tone(type: OscillatorType, f0: number, f1: number, t: number, a: number, peak: number, d: number, wet = 0.3): void {
    const c = this.ctx as AudioContext;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + a + d);
    this.env(g, t, a, peak, d);
    o.connect(g);
    this.route(g, wet);
    o.start(t);
    o.stop(t + a + d + 0.05);
  }

  // ---------------------------------------------------------------- ambiance

  /** Souffle grave du hall et ronronnement électrique, à peine audibles. */
  private ambience(): void {
    if (!this.ctx || !this.master || this.amb) return;
    const c = this.ctx;
    const n = this.src(true);
    const lp = c.createBiquadFilter();
    const g = c.createGain();
    lp.type = 'lowpass';
    lp.frequency.value = 160;
    g.gain.value = 0.035;
    n.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    n.start();
    const o = c.createOscillator();
    const og = c.createGain();
    o.frequency.value = 50;
    og.gain.value = 0.004;
    o.connect(og);
    og.connect(this.master);
    o.start();
    this.amb = { nodes: [n, o], gain: g };
  }

  // ---------------------------------------------------------------- effets

  tick(): void {
    if (!this.ok()) return;
    const t = (this.ctx as AudioContext).currentTime;
    this.tone('sine', 1500, 900, t, 0.004, 0.05, 0.07, 0.15);
  }

  /** Interrupteur de néon : claquement sec et grave dans la réverbération du hall. */
  clack(gain = 1): void {
    if (!this.ok()) return;
    const c = this.ctx as AudioContext;
    const t = c.currentTime;
    const n = this.src();
    const hp = c.createBiquadFilter();
    const g = c.createGain();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    this.env(g, t, 0.002, 0.36 * gain, 0.06);
    n.connect(hp);
    hp.connect(g);
    this.route(g, 0.6);
    n.start(t);
    n.stop(t + 0.1);
    this.tone('sine', 110, 42, t, 0.003, 0.32 * gain, 0.28, 0.7);
  }

  /** Souffle d'un vol de caméra, calé sur sa durée. */
  whoosh(dur = 1.4, gain = 1): void {
    if (!this.ok()) return;
    const c = this.ctx as AudioContext;
    const t = c.currentTime;
    const n = this.src(true);
    const bp = c.createBiquadFilter();
    const g = c.createGain();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(280, t);
    bp.frequency.exponentialRampToValueAtTime(1400, t + dur * 0.45);
    bp.frequency.exponentialRampToValueAtTime(360, t + dur);
    const peak = 0.11 * gain;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp);
    bp.connect(g);
    this.route(g, 0.3);
    n.start(t);
    n.stop(t + dur + 0.05);
  }

  /** Pompe et vérins : sifflement filtré et ronflement de la pompe. */
  hydraulic(dur = 1.2): void {
    if (!this.ok()) return;
    const c = this.ctx as AudioContext;
    const t = c.currentTime;
    const e = t + Math.max(dur, 0.3);
    const n = this.src(true);
    const bp = c.createBiquadFilter();
    const g = c.createGain();
    bp.type = 'bandpass';
    bp.frequency.value = 2300;
    bp.Q.value = 1.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.12);
    g.gain.setValueAtTime(0.045, e - 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, e);
    n.connect(bp);
    bp.connect(g);
    this.route(g, 0.2);
    n.start(t);
    n.stop(e + 0.05);
    const o = c.createOscillator();
    const lp = c.createBiquadFilter();
    const g2 = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(86, t);
    o.frequency.linearRampToValueAtTime(104, e);
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.04, t + 0.15);
    g2.gain.setValueAtTime(0.04, e - 0.2);
    g2.gain.exponentialRampToValueAtTime(0.0001, e);
    o.connect(lp);
    lp.connect(g2);
    this.route(g2, 0.15);
    o.start(t);
    o.stop(e + 0.05);
  }

  /** Démarreur puis ralenti diesel (s'arrête avec engineOff). */
  engineOn(): void {
    if (!this.ok() || this.idle) return;
    const c = this.ctx as AudioContext;
    const t = c.currentTime;
    const s = c.createOscillator();
    const sl = c.createBiquadFilter();
    const sg = c.createGain();
    s.type = 'sawtooth';
    s.frequency.setValueAtTime(140, t);
    s.frequency.linearRampToValueAtTime(190, t + 0.7);
    sl.type = 'lowpass';
    sl.frequency.value = 900;
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.045, t + 0.08);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    s.connect(sl);
    sl.connect(sg);
    this.route(sg, 0.2);
    s.start(t);
    s.stop(t + 0.85);
    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    const lp = c.createBiquadFilter();
    const am = c.createGain();
    const g = c.createGain();
    const lfo = c.createOscillator();
    const lg = c.createGain();
    o1.type = 'sawtooth';
    o1.frequency.value = 31;
    o2.type = 'square';
    o2.frequency.value = 62.5;
    lp.type = 'lowpass';
    lp.frequency.value = 250;
    lp.Q.value = 2;
    am.gain.value = 0.7;
    lfo.type = 'sine';
    lfo.frequency.value = 7.8;
    lg.gain.value = 0.3;
    lfo.connect(lg);
    lg.connect(am.gain);
    g.gain.setValueAtTime(0.0001, t + 0.55);
    g.gain.exponentialRampToValueAtTime(0.16, t + 1.1);
    g.gain.exponentialRampToValueAtTime(0.08, t + 2.2);
    o1.connect(lp);
    o2.connect(lp);
    lp.connect(am);
    am.connect(g);
    this.route(g, 0.25);
    for (const o of [o1, o2, lfo]) o.start(t + 0.5);
    this.idle = { g, nodes: [o1, o2, lfo] };
  }

  engineOff(now = false): void {
    if (!this.idle) return;
    const { g, nodes } = this.idle;
    this.idle = null;
    if (!this.ctx || this.ctx.state === 'closed') return;
    const t = this.ctx.currentTime;
    const end = now ? 0.05 : 1.2;
    try {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + end);
      for (const o of nodes) o.stop(t + end + 0.1);
    } catch {
      /* nœuds déjà arrêtés */
    }
  }

  /** Enregistrement réussi : deux notes claires. */
  chime(): void {
    if (!this.ok()) return;
    const t = (this.ctx as AudioContext).currentTime;
    this.tone('sine', 880, 880, t, 0.01, 0.07, 0.5, 0.4);
    this.tone('sine', 1318.5, 1318.5, t + 0.09, 0.01, 0.07, 0.5, 0.4);
  }

  /** Alerte douce : deux notes descendantes, sans agressivité. */
  alert(): void {
    if (!this.ok()) return;
    const t = (this.ctx as AudioContext).currentTime;
    this.tone('triangle', 740, 740, t, 0.01, 0.08, 0.22, 0.3);
    this.tone('triangle', 523, 523, t + 0.16, 0.01, 0.08, 0.36, 0.3);
  }

  open(): void {
    if (!this.ok()) return;
    const t = (this.ctx as AudioContext).currentTime;
    this.tone('sine', 520, 980, t, 0.01, 0.045, 0.16, 0.35);
  }

  close(): void {
    if (!this.ok()) return;
    const t = (this.ctx as AudioContext).currentTime;
    this.tone('sine', 900, 480, t, 0.01, 0.04, 0.16, 0.35);
  }

  /** Obturateur d'appareil photo. */
  shutter(): void {
    if (!this.ok()) return;
    const c = this.ctx as AudioContext;
    const t = c.currentTime;
    for (const d of [0, 0.07]) {
      const n = this.src();
      const hp = c.createBiquadFilter();
      const g = c.createGain();
      hp.type = 'highpass';
      hp.frequency.value = 2500;
      this.env(g, t + d, 0.001, 0.2, 0.04);
      n.connect(hp);
      hp.connect(g);
      this.route(g, 0.1);
      n.start(t + d);
      n.stop(t + d + 0.08);
    }
  }

  /** Visseuse à chocs (réparation). */
  wrench(): void {
    if (!this.ok()) return;
    const c = this.ctx as AudioContext;
    const t = c.currentTime;
    for (let i = 0; i < 9; i++) {
      const n = this.src();
      const bp = c.createBiquadFilter();
      const g = c.createGain();
      bp.type = 'bandpass';
      bp.frequency.value = 1600 + (i % 3) * 300;
      bp.Q.value = 2;
      const ti = t + i * 0.055;
      this.env(g, ti, 0.002, 0.12, 0.035);
      n.connect(bp);
      bp.connect(g);
      this.route(g, 0.25);
      n.start(ti);
      n.stop(ti + 0.06);
    }
  }

  /** Balayage lumineux du service : nappe montante. */
  scan(dur = 1.6): void {
    if (!this.ok()) return;
    const t = (this.ctx as AudioContext).currentTime;
    this.tone('sine', 330, 990, t, 0.2, 0.035, dur, 0.5);
    this.tone('sine', 495, 1485, t + 0.05, 0.2, 0.02, dur, 0.5);
  }

  /** Vibration du rouleau compacteur. */
  rumble(dur = 1.5): void {
    if (!this.ok()) return;
    const c = this.ctx as AudioContext;
    const t = c.currentTime;
    const o = c.createOscillator();
    const lp = c.createBiquadFilter();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(38, t);
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.2);
    g.gain.setValueAtTime(0.09, t + dur - 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    lp.connect(g);
    this.route(g, 0.3);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Arrivée d'une machine sur sa plateforme : vérin de levage puis claquement. */
  lift(): void {
    if (!this.ok()) return;
    this.whoosh(1.8, 0.8);
    const c = this.ctx as AudioContext;
    const t = c.currentTime;
    const o = c.createOscillator();
    const lp = c.createBiquadFilter();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(45, t);
    o.frequency.linearRampToValueAtTime(70, t + 1.5);
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + 0.3);
    g.gain.setValueAtTime(0.11, t + 1.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    o.connect(lp);
    lp.connect(g);
    this.route(g, 0.3);
    o.start(t);
    o.stop(t + 1.9);
  }
}
