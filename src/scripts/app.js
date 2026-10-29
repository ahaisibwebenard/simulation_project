import { BASELINE, DAYS, LIMITS, SEASONS, simulate, validate } from './model.js';

const $ = id => document.getElementById(id);
const integer = value => Math.round(value).toLocaleString('en-UG');
const compactMoney = value => value >= 1e9 ? `${(value / 1e9).toFixed(2)}b` : value >= 1e6 ? `${(value / 1e6).toFixed(1)}m` : integer(value);
const percent = value => `${value.toFixed(1)}%`;
const fields = [...Object.keys(LIMITS), 'season'];
const baseline = simulate(BASELINE);
let current = baseline;
let chartMode = 'visitors';
let selectedDay = 1;
let runCount = 1;

function readForm() {
  return Object.fromEntries(fields.map(key => [key, $(key).value]));
}

function sameValues(a, b) {
  return fields.every(key => String(a[key]) === String(b[key]));
}

function clearErrors() {
  for (const key of fields) {
    $(key).removeAttribute('aria-invalid');
    $(`${key}-error`).textContent = '';
  }
}

function updatePreset() {
  const values = readForm();
  for (const button of document.querySelectorAll('[data-preset]')) {
    const active = sameValues(values, { ...BASELINE, season: button.dataset.preset });
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function setForm(values) {
  for (const key of fields) {
    $(key).value = values[key];
    const range = $(`${key}-range`);
    if (range) range.value = values[key];
  }
  clearErrors();
  updatePreset();
}

function markChanged() {
  const dirty = !sameValues(readForm(), current.values);
  $('form-status').textContent = dirty ? 'Inputs changed · Run to update results.' : `Scenario ${runCount} is displayed.`;
  $('form-status').className = `form-status${dirty ? ' dirty' : ''}`;
  updatePreset();
}

for (const key of fields) {
  $(key).addEventListener('input', () => {
    const range = $(`${key}-range`);
    if (range && $(key).value !== '' && Number.isFinite(Number($(key).value))) range.value = $(key).value;
    if (!validate(readForm())[key]) {
      $(key).removeAttribute('aria-invalid');
      $(`${key}-error`).textContent = '';
    }
    markChanged();
  });
  const range = $(`${key}-range`);
  if (range) range.addEventListener('input', () => {
    $(key).value = range.value;
    $(key).removeAttribute('aria-invalid');
    $(`${key}-error`).textContent = '';
    markChanged();
  });
}

for (const button of document.querySelectorAll('[data-preset]')) {
  button.addEventListener('click', () => {
    setForm({ ...BASELINE, season: button.dataset.preset });
    markChanged();
  });
}

$('scenario-form').addEventListener('submit', event => {
  event.preventDefault();
  clearErrors();
  const values = readForm();
  const errors = validate(values);
  const errorKeys = Object.keys(errors);
  if (errorKeys.length) {
    for (const key of errorKeys) {
      $(key).setAttribute('aria-invalid', 'true');
      $(`${key}-error`).textContent = errors[key];
    }
    $('form-status').textContent = 'Check the highlighted input. Results are unchanged.';
    $('form-status').className = 'form-status error';
    $(errorKeys[0]).focus();
    return;
  }
  current = simulate(values);
  runCount += 1;
  render();
  $('form-status').textContent = `Scenario ${runCount} complete · Results updated.`;
  $('form-status').className = 'form-status';
  if (matchMedia('(max-width: 620px)').matches) $('results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
});

$('reset').addEventListener('click', () => {
  setForm(BASELINE);
  current = baseline;
  selectedDay = 1;
  $('day-slider').value = 1;
  runCount += 1;
  render();
  $('form-status').textContent = 'Reset complete · Baseline scenario is displayed.';
  $('form-status').className = 'form-status';
});

function difference(value, base, suffix = '') {
  const delta = value - base;
  if (Math.abs(delta) < 0.05) return 'Same as baseline';
  return `${delta > 0 ? '+' : '−'}${suffix === 'pp' ? Math.abs(delta).toFixed(1) : integer(Math.abs(delta))}${suffix ? ` ${suffix}` : ''} vs baseline`;
}

function renderMetrics() {
  const t = current.total;
  const b = baseline.total;
  const spendDelta = t.spending - b.spending;
  $('metrics').innerHTML = [
    { title: 'Visitors served', value: integer(t.served), caption: 'New arrivals admitted over 30 days', delta: difference(t.served, b.served), primary: true },
    { title: 'Stay requests turned away', value: integer(t.turnedAway), caption: 'No bed available on arrival', delta: difference(t.turnedAway, b.turnedAway), warning: t.turnedAway > b.turnedAway },
    { title: 'Average bed occupancy', value: current.values.beds ? percent(t.occupancy) : '—', caption: current.values.beds ? 'Across all beds and all 30 days' : 'No bed capacity in this scenario', delta: current.values.beds ? difference(t.occupancy, b.occupancy, 'pp') : '0 available beds' },
    { title: 'Visitor spending', value: compactMoney(t.spending), unit: 'UGX', caption: 'Gross spending during the month', delta: spendDelta ? `${spendDelta > 0 ? '+' : '−'}${compactMoney(Math.abs(spendDelta))} UGX vs baseline` : 'Same as baseline' }
  ].map(m => `<article class="metric-card${m.primary ? ' primary' : ''}"><p class="metric-title">${m.title}</p><div class="metric-value">${m.value}${m.unit ? `<small>${m.unit}</small>` : ''}</div><div class="metric-caption">${m.caption}</div><div class="metric-change${m.warning ? ' warning' : ''}">${m.delta}</div></article>`).join('');
}

function niceMax(n) {
  if (!n) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const rough = n / magnitude;
  const step = rough <= 1 ? 1 : rough <= 2 ? 2 : rough <= 4 ? 4 : rough <= 5 ? 5 : rough <= 8 ? 8 : 10;
  return step * magnitude;
}

function renderChart() {
  const isVisitors = chartMode === 'visitors';
  const rows = current.rows;
  const baseRows = baseline.rows;
  const w = 760, h = 224, left = 38, right = 12, top = 16, bottom = 194;
  const chartW = w - left - right;
  const x = i => left + chartW * i / (DAYS - 1);
  const maxValue = niceMax(Math.max(1, ...rows.map(r => isVisitors ? r.interested : r.occupied), ...baseRows.map(r => isVisitors ? r.served : r.occupied), isVisitors ? 0 : current.values.beds));
  const y = value => bottom - value / maxValue * (bottom - top);
  const points = (data, key) => data.map((r, i) => `${x(i).toFixed(2)},${y(r[key]).toFixed(2)}`).join(' ');
  const mainKey = isVisitors ? 'served' : 'occupied';
  const area = `${left},${bottom} ${points(rows, mainKey)} ${x(DAYS - 1)},${bottom}`;
  $('chart-title').textContent = isVisitors ? 'Visitor arrivals' : 'Beds through the month';
  $('chart-description').textContent = isVisitors ? 'New visitors each day, before and after bed limits.' : 'Guests occupy a bed until their chosen stay ends.';
  $('legend').innerHTML = isVisitors
    ? '<span><i></i> Visitors served</span><span><i class="gold"></i> Visitor interest</span><span><i class="dashed"></i> Baseline served</span>'
    : '<span><i></i> Beds occupied</span><span><i class="gold"></i> Available beds</span><span><i class="dashed"></i> Baseline occupied</span>';
  const grid = Array.from({ length: 5 }, (_, i) => {
    const value = maxValue * i / 4;
    return `<line x1="${left}" x2="${w - right}" y1="${y(value)}" y2="${y(value)}" stroke="#e8ebdf" stroke-width="1"/><text x="${left - 9}" y="${y(value) + 3}" text-anchor="end">${Number.isInteger(value) ? integer(value) : value.toFixed(1)}</text>`;
  }).join('');
  const weekends = rows.map((r, i) => r.weekend ? `<rect x="${Math.max(left, x(i) - chartW / 58)}" y="${top}" width="${chartW / 29}" height="${bottom - top}" fill="#eef0e6"/>` : '').join('');
  const labels = [0, 7, 14, 21, 29].map(i => `<text x="${x(i)}" y="${h - 7}" text-anchor="${i === 0 ? 'start' : i === 29 ? 'end' : 'middle'}">Day ${i + 1}</text>`).join('');
  const secondary = isVisitors
    ? `<polyline class="chart-line" points="${points(rows, 'interested')}" fill="none" stroke="#b98a42" stroke-width="2"/>`
    : `<line class="chart-line" x1="${left}" x2="${w - right}" y1="${y(current.values.beds)}" y2="${y(current.values.beds)}" stroke="#b98a42" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  const selected = rows[selectedDay - 1];
  const hitTargets = rows.map((r, i) => `<rect class="hover-target" data-day="${i + 1}" x="${Math.max(left, x(i) - chartW / 58)}" y="${top}" width="${i === 0 || i === 29 ? chartW / 58 : chartW / 29}" height="${bottom - top}"><title>Day ${i + 1}: ${r.interested} interested, ${r.served} served, ${r.occupied} beds occupied</title></rect>`).join('');
  $('chart-wrap').innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="trend-title trend-description"><title id="trend-title">${isVisitors ? 'Daily interested and served visitors' : 'Daily bed occupancy and capacity'}</title><desc id="trend-description">A 30-day simulation. The dashed grey line shows the fixed baseline. Use Explore a day below, or the daily results table, for exact values.</desc><defs><linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3f7865" stop-opacity=".18"/><stop offset="100%" stop-color="#3f7865" stop-opacity=".01"/></linearGradient></defs>${weekends}${grid}<polygon points="${area}" fill="url(#area-fill)"/><polyline class="chart-line" points="${points(baseRows, mainKey)}" fill="none" stroke="#a2ad97" stroke-width="1.5" stroke-dasharray="4 4"/>${secondary}<polyline class="chart-line" points="${points(rows, mainKey)}" fill="none" stroke="#326658" stroke-width="2.4" stroke-linejoin="round"/><line id="selection-line" x1="${x(selectedDay - 1)}" x2="${x(selectedDay - 1)}" y1="${top}" y2="${bottom}" stroke="#69856b" stroke-width="1" stroke-dasharray="2 4"/><circle id="selection-dot" cx="${x(selectedDay - 1)}" cy="${y(selected[mainKey])}" r="4" fill="#326658" stroke="#fffef9" stroke-width="2"/>${labels}${hitTargets}</svg>`;
  $('chart-wrap').querySelectorAll('[data-day]').forEach(rect => {
    const select = () => {
      selectedDay = Number(rect.dataset.day);
      $('day-slider').value = selectedDay;
      updateDay();
      const sx = x(selectedDay - 1);
      $('selection-line').setAttribute('x1', sx);
      $('selection-line').setAttribute('x2', sx);
      $('selection-dot').setAttribute('cx', sx);
      $('selection-dot').setAttribute('cy', y(rows[selectedDay - 1][mainKey]));
    };
    rect.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') select(); });
    rect.addEventListener('click', select);
  });
  updateDay();
}

function updateDay() {
  const row = current.rows[selectedDay - 1];
  $('day-label').textContent = `Day ${selectedDay} · ${row.weekday}${row.weekend ? ' · Weekend' : ''}`;
  $('day-slider').setAttribute('aria-valuetext', `Day ${selectedDay}, ${row.weekday}, ${row.served} visitors served, ${row.occupied} beds occupied`);
  const items = chartMode === 'visitors' ? [['Interested', row.interested], ['Served', row.served], ['Turned away', row.turnedAway]] : [['Occupied', row.occupied], ['Available', current.values.beds], ['Departures', row.leaving]];
  $('day-stats').innerHTML = items.map(([label, value]) => `<div class="day-stat"><strong>${integer(value)}</strong>${label}</div>`).join('');
}

$('day-slider').addEventListener('input', () => {
  selectedDay = Number($('day-slider').value);
  renderChart();
});

for (const mode of ['visitors', 'beds']) {
  $(`${mode}-tab`).addEventListener('click', () => {
    chartMode = mode;
    for (const other of ['visitors', 'beds']) {
      $(`${other}-tab`).classList.toggle('selected', other === mode);
      $(`${other}-tab`).setAttribute('aria-pressed', String(other === mode));
    }
    renderChart();
  });
}

function renderActivities() {
  const labels = ['Boat & island circuit', 'Shoreline & local services', 'Viewpoint walks'];
  $('activity-list').innerHTML = labels.map((label, i) => `<div class="activity-row"><span>${label}</span><strong>${integer(current.total.activities[i])}<small>activity visits</small></strong><div class="activity-track"><span style="width:${current.total.personDays ? current.total.activities[i] / current.total.personDays * 100 : 0}%"></span></div></div>`).join('');
}

function renderInsights() {
  const { total: t, values: v, rows } = current;
  const lostShare = t.overnightRequested ? t.turnedAway / t.overnightRequested * 100 : 0;
  const peak = rows.reduce((a, b) => b.interested > a.interested ? b : a);
  let capacity;
  if (!v.beds) capacity = t.overnightRequested ? `<strong>No beds, no overnight admissions.</strong> All ${integer(t.overnightRequested)} stay requests are turned away; day visits can still happen.` : '<strong>No overnight demand or bed capacity.</strong> Only day visitors contribute to this scenario.';
  else if (t.turnedAway) capacity = `<strong>Bed capacity limits arrivals.</strong> ${percent(lostShare)} of stay requests cannot be accommodated. Beds are full on ${t.fullDays} of 30 days.`;
  else capacity = `<strong>Every stay request fits.</strong> ${integer(t.admitted)} guests are admitted for overnight stays. Beds average ${percent(t.occupancy)} occupancy across the month.`;
  const demand = t.interested ? `<strong>Day ${peak.day} has the highest interest:</strong> ${integer(peak.interested)} people. The assumed weekend uplift and fixed daily variation create the visible peaks.` : '<strong>No visitor interest.</strong> With arrivals set to zero, visits, spending and activity demand all stay at zero.';
  const duration = t.personDays ? (t.admitted ? `<strong>${integer(t.personDays)} person-days of activity.</strong> Longer stays keep beds occupied and add spending days, while leaving fewer beds for new overnight guests.` : `<strong>${integer(t.personDays)} person-days of activity.</strong> All activity and spending come from day visitors in this scenario.`) : '<strong>No visitor activity to spend on.</strong> Change visitor interest or the share of day visitors to generate activity.';
  $('insights').innerHTML = [capacity, demand, duration].map((text, i) => `<div class="insight"><span class="insight-number">${i + 1}</span><p>${text}</p></div>`).join('');
}

function renderTable() {
  $('daily-table').innerHTML = current.rows.map(r => `<tr><th scope="row">${r.day} · ${r.weekday}</th>${['interested', 'served', 'dayVisitors', 'overnightRequested', 'admitted', 'turnedAway', 'occupied', 'personDays', 'spending'].map(key => `<td>${integer(r[key])}</td>`).join('')}</tr>`).join('');
}

function render() {
  const season = { low: 'Low season', normal: 'Normal season', peak: 'Peak season' }[current.values.season];
  const preset = sameValues(current.values, { ...BASELINE, season: current.values.season });
  $('scenario-label').textContent = preset ? season : `Custom · ${season.toLowerCase()}`;
  renderMetrics();
  renderChart();
  renderActivities();
  renderInsights();
  renderTable();
  updatePreset();
}

$('export').addEventListener('click', () => {
  const v = current.values;
  const header = ['day','weekday','interested_visitors','visitors_served','day_visitors','overnight_requests','overnight_admissions','turned_away','departures','beds_occupied','person_days','spending_ugx','boat_activity_visits','shore_activity_visits','viewpoint_activity_visits','base_interest_per_day','season','season_multiplier','overnight_share_percent','stay_nights','available_beds','spend_per_person_day_ugx','seed','data_type'];
  const lines = current.rows.map(r => [r.day,r.weekday,r.interested,r.served,r.dayVisitors,r.overnightRequested,r.admitted,r.turnedAway,r.leaving,r.occupied,r.personDays,r.spending,...r.activities,v.arrivals,v.season,SEASONS[v.season],v.overnight,v.stay,v.beds,v.spend,42,'ILLUSTRATIVE_SIMULATION'].join(','));
  const blob = new Blob([header.join(',') + '\r\n' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bunyonyi-${v.season}-scenario-${runCount}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const dirty = !sameValues(readForm(), current.values);
  $('form-status').textContent = dirty ? 'Displayed results exported · Run to apply edited inputs.' : 'Daily results exported · CSV includes scenario inputs.';
  $('form-status').className = `form-status${dirty ? ' dirty' : ''}`;
});

setForm(BASELINE);
render();
