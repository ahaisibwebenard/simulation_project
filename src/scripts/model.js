export const DAYS = 30;
export const BASELINE = Object.freeze({ arrivals: 100, season: 'normal', overnight: 60, stay: 2, beds: 160, spend: 120000 });
export const SEASONS = Object.freeze({ low: 0.65, normal: 1, peak: 1.5 });
export const LIMITS = Object.freeze({ arrivals: [0, 500], overnight: [0, 100], stay: [1, 7], beds: [0, 1000], spend: [0, 500000] });
export const ACTIVITY_SHARES = Object.freeze([0.4, 0.35, 0.25]);

export function validate(values) {
  const errors = {};
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    const value = values[key];
    if (value === '' || value === null || !Number.isFinite(Number(value)) || !Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) {
      errors[key] = `Enter a whole number from ${min.toLocaleString('en-UG')} to ${max.toLocaleString('en-UG')}.`;
    }
  }
  if (!Object.hasOwn(SEASONS, values.season)) errors.season = 'Choose a season.';
  return errors;
}

// The same daily factors are used in every scenario, isolating input changes.
export function dailyFactors(seed = 42) {
  let state = seed >>> 0;
  return Array.from({ length: DAYS }, (_, i) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const jitter = 0.85 + state / 4294967296 * 0.3;
    const weekend = i % 7 >= 5;
    return { weekend, factor: (weekend ? 1.2 : 0.92) * jitter };
  });
}

export function simulate(raw) {
  const errors = validate(raw);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors).join(' '));
  const values = { season: raw.season };
  for (const key of Object.keys(LIMITS)) values[key] = Number(raw[key]);
  const departures = Array(DAYS + values.stay).fill(0);
  let occupied = 0;
  const rows = dailyFactors().map(({ weekend, factor }, i) => {
    const leaving = departures[i];
    occupied -= leaving;
    const interested = Math.round(values.arrivals * SEASONS[values.season] * factor);
    const overnightRequested = Math.round(interested * values.overnight / 100);
    const dayVisitors = interested - overnightRequested;
    const admitted = Math.min(overnightRequested, Math.max(0, values.beds - occupied));
    const turnedAway = overnightRequested - admitted;
    occupied += admitted;
    departures[i + values.stay] += admitted;
    const served = dayVisitors + admitted;
    const personDays = dayVisitors + occupied;
    const boat = Math.round(personDays * ACTIVITY_SHARES[0]);
    const shore = Math.round(personDays * ACTIVITY_SHARES[1]);
    const activities = [boat, shore, personDays - boat - shore];
    return { day: i + 1, weekday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7], weekend, interested, overnightRequested, dayVisitors, admitted, turnedAway, leaving, occupied, served, personDays, spending: personDays * values.spend, activities };
  });
  const sum = key => rows.reduce((total, row) => total + row[key], 0);
  const total = Object.fromEntries(['interested', 'overnightRequested', 'dayVisitors', 'admitted', 'turnedAway', 'served', 'personDays', 'spending', 'occupied'].map(key => [key, sum(key)]));
  total.occupancy = values.beds ? total.occupied / (values.beds * DAYS) * 100 : 0;
  total.fullDays = values.beds ? rows.filter(row => row.occupied === values.beds).length : 0;
  total.activities = ACTIVITY_SHARES.map((_, i) => rows.reduce((n, row) => n + row.activities[i], 0));
  return { values, rows, total };
}
