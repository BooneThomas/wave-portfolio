import { describe, expect, it } from 'vitest';
import { layoutFloats } from './layout';

describe('layoutFloats', () => {
  it('places any number of projects without overlap and inside the scene bounds', () => {
    for (const spread of [1, 0.55]) for (let n = 1; n <= 40; n++) {
      const items = layoutFloats(n, spread);
      expect(items).toHaveLength(n);
      for (let i = 0; i < n; i++) {
        const a = items[i];
        expect(a.position.every(Number.isFinite)).toBe(true);
        expect(a.x).toBeGreaterThan(-9);
        expect(a.x).toBeLessThan(13);
        expect(a.position[2]).toBeGreaterThan(-8);
        expect(a.position[2]).toBeLessThan(11.5);
        expect(a.position[1]).toBeLessThan(3);
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
  });

  it('is deterministic', () => {
    expect(layoutFloats(7)).toEqual(layoutFloats(7));
  });
});
