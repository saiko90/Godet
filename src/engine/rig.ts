// Canaux lumineux du hall (plafond, mur du fond, enseigne, baies…) : chaque canal a un niveau de 0 à 1 que
// l'on règle, fait monter progressivement ou allume « comme un néon » (quelques clignements irréguliers).
// Les éléments s'y abonnent ; un propriétaire (le hall) peut retirer tous ses abonnements d'un coup.
import { easeOut, lerp, type Timeline, type Tween } from './tween';

type Binding = { fn: (level: number) => void; owner: object | null };

interface Channel {
  level: number;
  binds: Binding[];
  tween: Tween | null;
}

export class Rig {
  private chans = new Map<string, Channel>();

  constructor(private tl: Timeline) {}

  private chan(name: string): Channel {
    let c = this.chans.get(name);
    if (!c) {
      c = { level: 0, binds: [], tween: null };
      this.chans.set(name, c);
    }
    return c;
  }

  /** Abonne un élément à un canal ; il reçoit tout de suite le niveau courant. */
  bind(name: string, fn: (level: number) => void, owner: object | null = null): void {
    const c = this.chan(name);
    c.binds.push({ fn, owner });
    fn(c.level);
  }

  /** Retire les abonnements d'un propriétaire (reconstruction du hall). Les niveaux sont conservés. */
  unbind(owner: object): void {
    for (const c of this.chans.values()) c.binds = c.binds.filter((b) => b.owner !== owner);
  }

  level(name: string): number {
    return this.chans.get(name)?.level ?? 0;
  }

  private apply(c: Channel, v: number): void {
    c.level = v;
    for (const b of c.binds) b.fn(v);
  }

  set(name: string, level: number): void {
    const c = this.chan(name);
    if (c.tween) {
      c.tween.cancel();
      c.tween = null;
    }
    this.apply(c, level);
  }

  ramp(name: string, to: number, dur: number): Promise<boolean> {
    const c = this.chan(name);
    if (c.tween) c.tween.cancel();
    const from = c.level;
    const t = this.tl.tween(dur, (e) => this.apply(c, lerp(from, to, e)), easeOut);
    c.tween = t;
    return t.done;
  }

  /** Allumage façon néon : quelques clignements irréguliers puis montée douce. */
  flicker(name: string, to: number, reduced: boolean, seed = Math.random()): Promise<void> {
    return flickerTo(this.tl, (v) => this.set(name, v), to, reduced, seed, (d) => this.ramp(name, to, d));
  }
}

/** Clignements d'allumage pour n'importe quel réglage (canal, baie…). */
export async function flickerTo(
  tl: Timeline,
  set: (v: number) => void,
  to: number,
  reduced: boolean,
  seed = Math.random(),
  ramp?: (dur: number) => Promise<boolean>,
): Promise<void> {
  if (reduced) {
    if (ramp) await ramp(0.18);
    else set(to);
    return;
  }
  const steps = [0.55, 0.06, 0.8, 0.18];
  for (let i = 0; i < steps.length; i++) {
    set(steps[i] * to);
    const wait = 0.04 + ((seed * 7.3 + i * 0.37) % 1) * 0.05;
    if (!(await tl.delay(wait))) return;
  }
  if (ramp) await ramp(0.22);
  else {
    const from = steps[steps.length - 1] * to;
    await tl.tween(0.22, (e) => set(lerp(from, to, e)), easeOut).done;
  }
}
