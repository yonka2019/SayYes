import { describe, expect, it } from "vitest";
import {
  MAX_FLEE,
  MAX_HOP,
  MIN_FLEE,
  MIN_HOP,
  MIN_SCALE,
  PLEAS,
  nextDodgeOffset,
  nextFleeOffset,
  pleaForCatches,
  scaleForCatches,
  type Offset,
} from "../src/lib/dodge";

const dist = (a: Offset, b: Offset) => Math.hypot(a.x - b.x, a.y - b.y);

describe("nextDodgeOffset", () => {
  it("hops between MIN_HOP and MAX_HOP from the current spot", () => {
    let cur: Offset = { x: 0, y: 0 };
    for (let i = 0; i < 200; i++) {
      const next = nextDodgeOffset(cur, { x: 500, y: 500 }, () => (i % 100) / 100);
      expect(dist(cur, next)).toBeGreaterThanOrEqual(MIN_HOP - 0.001);
      expect(dist(cur, next)).toBeLessThanOrEqual(MAX_HOP + 0.001);
      cur = next;
    }
  });

  it("never leaves the allowed box", () => {
    let cur: Offset = { x: 0, y: 0 };
    for (let i = 0; i < 500; i++) {
      cur = nextDodgeOffset(cur, { x: 60, y: 30 }, () => (i * 0.37) % 1);
      expect(Math.abs(cur.x)).toBeLessThanOrEqual(60.001);
      expect(Math.abs(cur.y)).toBeLessThanOrEqual(30.001);
    }
  });

  it("always moves, even from a corner of a tight box", () => {
    const corner: Offset = { x: 60, y: 30 };
    const next = nextDodgeOffset(corner, { x: 60, y: 30 }, () => 0);
    expect(dist(corner, next)).toBeGreaterThan(0);
  });

  it("always moves when rand() is 0", () => {
    const cur: Offset = { x: 0, y: 0 };
    expect(dist(cur, nextDodgeOffset(cur, { x: 100, y: 100 }, () => 0))).toBeGreaterThan(0);
  });

  it("is deterministic for a fixed rand", () => {
    const a = nextDodgeOffset({ x: 5, y: 5 }, { x: 100, y: 100 }, () => 0.25);
    const b = nextDodgeOffset({ x: 5, y: 5 }, { x: 100, y: 100 }, () => 0.25);
    expect(a).toEqual(b);
  });

  it("stays inside a box smaller than a single hop", () => {
    const next = nextDodgeOffset({ x: 0, y: 0 }, { x: 5, y: 5 }, () => 0.8);
    expect(Math.abs(next.x)).toBeLessThanOrEqual(5.001);
    expect(Math.abs(next.y)).toBeLessThanOrEqual(5.001);
  });
});

describe("nextFleeOffset", () => {
  const roomy = { x: 400, y: 400 };

  it("runs away from the cursor, not in a random direction", () => {
    // Cursor to the left of the button → it must end up further right.
    const next = nextFleeOffset({ x: 0, y: 0 }, roomy, { x: -100, y: 0 }, () => 0.5);
    expect(next.x).toBeGreaterThan(0);
  });

  it("runs away on the other axis too", () => {
    const next = nextFleeOffset({ x: 0, y: 0 }, roomy, { x: 0, y: 90 }, () => 0.5);
    expect(next.y).toBeLessThan(0);
  });

  it("keeps a positive component along the away-from-cursor direction", () => {
    for (let i = 0; i < 100; i++) {
      const cursor = { x: Math.cos(i) * 80, y: Math.sin(i) * 80 };
      const current = { x: 0, y: 0 };
      const next = nextFleeOffset(current, roomy, cursor, () => (i % 10) / 10);
      const away = { x: current.x - cursor.x, y: current.y - cursor.y };
      const moved = { x: next.x - current.x, y: next.y - current.y };
      expect(away.x * moved.x + away.y * moved.y).toBeGreaterThan(0);
    }
  });

  it("flees further than a plain hop", () => {
    const next = nextFleeOffset({ x: 0, y: 0 }, roomy, { x: -50, y: 0 }, () => 0.5);
    const hopped = dist({ x: 0, y: 0 }, next);
    expect(hopped).toBeGreaterThanOrEqual(MIN_FLEE - 0.001);
    expect(hopped).toBeLessThanOrEqual(MAX_FLEE + 0.001);
    expect(MIN_FLEE).toBeGreaterThan(MAX_HOP);
  });

  it("never leaves the allowed box, even cornered", () => {
    let cur: Offset = { x: 120, y: 60 };
    for (let i = 0; i < 300; i++) {
      const cursor = { x: cur.x - 10, y: cur.y - 10 };
      cur = nextFleeOffset(cur, { x: 120, y: 60 }, cursor, () => (i * 0.31) % 1);
      expect(Math.abs(cur.x)).toBeLessThanOrEqual(120.001);
      expect(Math.abs(cur.y)).toBeLessThanOrEqual(60.001);
    }
  });

  it("still moves when the cursor sits exactly on it", () => {
    const cur = { x: 10, y: 10 };
    const next = nextFleeOffset(cur, roomy, cur, () => 0.3);
    expect(dist(cur, next)).toBeGreaterThan(0);
  });

  it("is deterministic for a fixed rand", () => {
    const args = [{ x: 4, y: 4 }, roomy, { x: 0, y: 0 }] as const;
    expect(nextFleeOffset(...args, () => 0.42)).toEqual(nextFleeOffset(...args, () => 0.42));
  });
});

describe("scaleForCatches", () => {
  it("is full size before anyone catches it", () => {
    expect(scaleForCatches(0)).toBe(1);
  });

  it("shrinks on every catch", () => {
    for (let n = 1; n < 8; n++) {
      expect(scaleForCatches(n)).toBeLessThan(scaleForCatches(n - 1));
    }
  });

  it("never shrinks past MIN_SCALE, so it never vanishes", () => {
    expect(scaleForCatches(500)).toBe(MIN_SCALE);
    expect(MIN_SCALE).toBeGreaterThan(0);
  });
});

describe("pleaForCatches", () => {
  it("says nothing until she lands a click", () => {
    expect(pleaForCatches(0)).toBeNull();
  });

  it("escalates with each catch", () => {
    expect(pleaForCatches(1)).toBe(PLEAS[0]);
    expect(pleaForCatches(2)).toBe(PLEAS[1]);
    expect(pleaForCatches(3)).toBe(PLEAS[2]);
  });

  it("holds on the last plea instead of running out", () => {
    expect(pleaForCatches(PLEAS.length)).toBe(PLEAS[PLEAS.length - 1]);
    expect(pleaForCatches(99)).toBe(PLEAS[PLEAS.length - 1]);
  });
});
