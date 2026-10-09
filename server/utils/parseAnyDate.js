// Parse a spreadsheet date cell in (almost) any format.
// Returns { date: 'YYYY-MM-DD' (IST wall date), utc: 'YYYY-MM-DD HH:MM:SS' } or null.
// Times without an explicit zone are treated as IST, since the DB stores UTC.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const IST_MS = 330 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');
const fmtUtc = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
const fromUtcDate = (d) => {
  const ist = new Date(d.getTime() + IST_MS);
  return { date: `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`, utc: fmtUtc(d) };
};

const parseAnyDate = (input) => {
  if (input === null || input === undefined) return null;
  let s = String(input).trim();
  if (!s) return null;

  // ISO with explicit zone, e.g. Facebook lead ads: 2026-10-09T10:00:00+0530 / ...Z
  if (/^\d{4}-\d{1,2}-\d{1,2}T.*(Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const d = new Date(s.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
    if (!isNaN(d)) return fromUtcDate(d);
  }

  // Pure numbers: spreadsheet serial day (Excel/Sheets) or unix seconds / milliseconds
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (n > 20000 && n < 80000) return fromUtcDate(new Date(Date.UTC(1899, 11, 30) + Math.round(n * 86400000) - IST_MS));
    if (/^\d{10}$/.test(s)) return fromUtcDate(new Date(n * 1000));
    if (/^\d{13}$/.test(s)) return fromUtcDate(new Date(n));
    return null;
  }

  // Pull out the time part (10:30, 10:30:15, 10:30 PM, 10.30 am)
  let h = 0, mi = 0, se = 0;
  s = s.replace(/(\d)T(\d)/, '$1 $2');
  s = s.replace(/\b(\d{1,2})[:.](\d{2})(?::(\d{2}))?(?:\.\d+)?\s*([ap])?\.?\s*m?\.?(?![a-z])/i, (m, a, b, c, ap) => {
    if (!/:/.test(m) && !ap) return m; // "10.30" without am/pm is more likely a date part
    h = +a; mi = +b; se = +(c || 0);
    if (ap) { if (h === 12) h = 0; if (/p/i.test(ap)) h += 12; }
    return ' ';
  });
  if (h > 23 || mi > 59 || se > 59) return null;

  // Month names (Oct, October, Sept); every other word (weekday, IST, GMT) is dropped
  let month = null;
  s = s.replace(/[a-z]+/gi, (w) => {
    const i = MONTHS.indexOf(w.slice(0, 3).toLowerCase());
    if (i !== -1 && month === null && w.length >= 3) month = i + 1;
    return ' ';
  });

  const nums = s.match(/\d+/g) || [];
  let y, m, d;
  if (month) {
    if (nums.length < 2) return null;
    m = month;
    if (nums[0].length === 4) { y = +nums[0]; d = +nums[1]; } else { d = +nums[0]; y = +nums[1]; }
  } else {
    if (nums.length < 3) return null;
    if (nums[0].length === 4) {
      [y, m, d] = nums.map(Number);
    } else {
      const a = +nums[0], b = +nums[1];
      y = +nums[2];
      // ponytail: ambiguous 05/06/2026 is read as DD/MM (Indian sheets); MM/DD only when day > 12 forces it
      if (b > 12 && a <= 12) { m = a; d = b; } else { d = a; m = b; }
    }
  }
  if (y < 100) y += 2000;

  const utcMs = Date.UTC(y, m - 1, d, h, mi, se);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(utcMs) || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d || y < 1900 || y > 2200) return null;
  return fromUtcDate(new Date(utcMs - IST_MS));
};

module.exports = { parseAnyDate };

// Self-check: node server/utils/parseAnyDate.js
if (require.main === module) {
  const assert = require('assert');
  const t = (input, date, utc) => {
    const r = parseAnyDate(input);
    const msg = `input: ${input} -> ${JSON.stringify(r)}`;
    if (date === null) return assert.strictEqual(r, null, msg);
    assert.ok(r, msg);
    assert.strictEqual(r.date, date, msg);
    if (utc) assert.strictEqual(r.utc, utc, msg);
  };
  t('2026-10-09 10:00:00', '2026-10-09', '2026-10-09 04:30:00');
  t('2026-10-09', '2026-10-09', '2026-10-08 18:30:00');
  t('2026-10-09T10:00:00+0530', '2026-10-09', '2026-10-09 04:30:00');
  t('2026-10-09T04:30:00Z', '2026-10-09', '2026-10-09 04:30:00');
  t('2026-10-09T10:00:00', '2026-10-09', '2026-10-09 04:30:00');
  t('09/10/2026', '2026-10-09');
  t('9/10/2026 10:30 PM', '2026-10-09', '2026-10-09 17:00:00');
  t('10/25/2026', '2026-10-25');
  t('25-10-2026', '2026-10-25');
  t('25.10.2026', '2026-10-25');
  t('25/10/26', '2026-10-25');
  t('2026/10/25', '2026-10-25');
  t('9 Oct 2026', '2026-10-09');
  t('09-Oct-2026 11:15 am', '2026-10-09', '2026-10-09 05:45:00');
  t('October 9, 2026', '2026-10-09');
  t('Thu, 09 Oct 2026 10:00:00 GMT+0530', '2026-10-09');
  t('Sept 9 2026', '2026-09-09');
  t('46304', '2026-10-09');
  t('46304.4375', '2026-10-09', '2026-10-09 05:00:00');
  t('1791532800', '2026-10-09');
  t('', null);
  t('tomorrow', null);
  t('31/02/2026', null);
  t('call back later', null);
  console.log('parseAnyDate: all checks passed');
}
