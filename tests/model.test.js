import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE, DAYS, simulate, validate } from '../src/scripts/model.js';

test('baseline is reproducible and has 30 daily results', () => {
  const a = simulate(BASELINE);
  assert.deepEqual(a, simulate(BASELINE));
  assert.equal(a.rows.length, DAYS);
  assert.equal(a.rows[0].weekday, 'Mon');
  assert.equal(a.rows[5].weekend, true);
});

test('visitor conservation, bed conservation and spending reconcile for boundary and mixed scenarios', () => {
  for (const arrivals of [0, 1, 100, 500]) {
    for (const beds of [0, 1, 160, 1000]) {
      for (const stay of [1, 2, 7]) {
        for (const overnight of [0, 60, 100]) {
          const v = { ...BASELINE, arrivals, beds, stay, overnight, season: 'peak' };
          const r = simulate(v);
          let previousOccupied = 0;
          for (const day of r.rows) {
            assert.equal(day.interested, day.served + day.turnedAway);
            assert.equal(day.served, day.dayVisitors + day.admitted);
            assert.equal(day.overnightRequested, day.admitted + day.turnedAway);
            assert.equal(day.occupied, previousOccupied - day.leaving + day.admitted);
            assert(day.occupied >= 0 && day.occupied <= beds);
            assert.equal(day.personDays, day.dayVisitors + day.occupied);
            assert.equal(day.activities.reduce((a, b) => a + b, 0), day.personDays);
            assert(day.activities.every(n => Number.isInteger(n) && n >= 0));
            assert.equal(day.spending, day.personDays * v.spend);
            previousOccupied = day.occupied;
          }
          assert.equal(r.total.served + r.total.turnedAway, r.total.interested);
          assert(r.total.occupancy >= 0 && r.total.occupancy <= 100);
        }
      }
    }
  }
});

test('departures free beds before new guests and respect stay length', () => {
  const r = simulate({ ...BASELINE, arrivals: 500, overnight: 100, beds: 10, stay: 3 });
  assert.deepEqual(r.rows.slice(0, 7).map(x => x.admitted), [10, 0, 0, 10, 0, 0, 10]);
  assert.deepEqual(r.rows.slice(0, 7).map(x => x.leaving), [0, 0, 0, 10, 0, 0, 10]);
  assert.equal(r.total.served, 100);
});

test('one-night stays can use every bed each day', () => {
  const r = simulate({ ...BASELINE, arrivals: 500, overnight: 100, beds: 10, stay: 1 });
  assert.equal(r.total.served, 300);
  assert.equal(r.total.occupancy, 100);
});

test('zero beds retain day visitors and reject all overnight requests', () => {
  const r = simulate({ ...BASELINE, beds: 0 });
  assert.equal(r.total.admitted, 0);
  assert.equal(r.total.turnedAway, r.total.overnightRequested);
  assert.equal(r.total.served, r.total.dayVisitors);
  assert.equal(r.total.occupancy, 0);
});

test('zero demand clears every output and season increases unconstrained arrivals', () => {
  const empty = simulate({ ...BASELINE, arrivals: 0 });
  assert.equal(empty.total.served, 0);
  assert.equal(empty.total.spending, 0);
  assert.equal(empty.total.personDays, 0);
  const low = simulate({ ...BASELINE, season: 'low', beds: 1000 });
  const peak = simulate({ ...BASELINE, season: 'peak', beds: 1000 });
  assert(peak.total.interested > low.total.interested);
  assert(peak.total.served > low.total.served);
});

test('invalid, blank, fractional and unsupported values cannot enter the model', () => {
  for (const overrides of [{ arrivals: -1 }, { beds: 1001 }, { stay: 0 }, { overnight: 101 }, { spend: -1 }, { arrivals: '' }, { beds: null }, { stay: 1.5 }, { arrivals: Infinity }, { season: 'summer' }]) {
    const invalid = { ...BASELINE, ...overrides };
    assert(Object.keys(validate(invalid)).length > 0);
    assert.throws(() => simulate(invalid), RangeError);
  }
});
