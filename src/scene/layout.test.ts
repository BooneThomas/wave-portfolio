import { describe, expect, it } from 'vitest';
import { barrelEndFor, layoutFloats } from './layout';
import { setBarrelEnd, WAVE } from './waveProfile';

describe('layoutFloats', () => {
  it('places any number of projects without overlap, the first three at the mouth and the rest down the barrel', () => {
    for (const narrow of [false, true]) {
      for (let n = 1; n <= 60; n++) {
        setBarrelEnd(barrelEndFor(n));
        const items = layoutFloats(n, narrow);
        expect(items).toHaveLength(n);
        for (let i = 0; i < n; i++) {
          const a = items[i];
          expect(a.position.every(Number.isFinite)).toBe(true);
          expect(a.position[1]).toBeLessThan(3);
          if (i < 3) {
            // Entry lights: in front of the wave or just inside its mouth.
            expect(a.x).toBeGreaterThan(-9);
            expect(a.x).toBeLessThan(2);
          } else {
            // Barrel lights: behind the falling lip, before the barrel collapses, each one deeper than the last.
            expect(a.inside).toBe(1);
            expect(a.x).toBeGreaterThan(items[i - 1].x);
            expect(a.x).toBeLessThan(WAVE.barrelEnd - 3);
            expect(a.position[2]).toBeLessThan(-2.5);
          }
          for (let j = i + 1; j < n; j++) {
            const b = items[j];
            const d = Math.hypot(
              a.position[0] - b.position[0],
              a.position[1] - b.position[1],
              a.position[2] - b.position[2],
            );
            expect(d, `n=${n}, lights ${i} and ${j}`).toBeGreaterThan((a.radius + b.radius) * 1.25);
          }
        }
      }
    }
  });

  it('keeps the first three places fixed when projects are added', () => {
    setBarrelEnd(barrelEndFor(20));
    const few = layoutFloats(4).slice(0, 3).map((p) => p.position);
    const many = layoutFloats(20).slice(0, 3).map((p) => p.position);
    expect(many).toEqual(few);
  });
});
