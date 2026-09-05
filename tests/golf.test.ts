import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hourScore,
  playingWindows,
  localNow,
  hourLabel,
} from '../lib/golf/recommendations.ts';
import {
  extractRate,
  robotsAllows,
  getCourseSignals,
} from '../lib/golf/sources.ts';
import { publishedPrice } from '../lib/golf/pricing.ts';
import {
  milesBetween,
  DENVER,
  COURSES,
  validCoordinates,
} from '../lib/golf/courses.ts';
import { cached, safeWebsite } from '../lib/golf/http.ts';
import type { Forecast, Hour } from '../lib/golf/types.ts';

const baseHour: Hour = {
  time: '2026-09-05T10:00',
  temperature: 72,
  wind: 5,
  gust: 9,
  rain: 0,
  code: 0,
  daylight: true,
};
function forecast(): Forecast {
  return {
    timezone: 'America/Denver',
    utcOffset: -21600,
    fetchedAt: '2026-09-05T12:00:00Z',
    source: 'test',
    hours: Array.from({ length: 24 }, (_, h) => ({
      ...baseHour,
      time: `2026-09-05T${String(h).padStart(2, '0')}:00`,
      daylight: h >= 7 && h < 19,
    })),
    days: [
      {
        date: '2026-09-05',
        sunrise: '2026-09-05T06:30',
        sunset: '2026-09-05T19:15',
        high: 75,
        low: 50,
      },
    ],
  };
}
const morning = new Date('2026-09-05T13:10:00Z');

void test('round windows never recommend past starts or finishes after sunset', () => {
  const windows = playingWindows(forecast(), '2026-09-05', 18, 'any', morning);
  assert.ok(windows.length > 0);
  assert.ok(
    windows.every(
      (w) =>
        w.start.time > '2026-09-05T07:10' && w.end.time <= '2026-09-05T19:15',
    ),
  );
  assert.equal(windows.at(-1)?.start.time, '2026-09-05T14:00');
});
void test('a storm midway through a round excludes the entire window', () => {
  const f = forecast();
  f.hours[12].code = 95;
  assert.ok(
    !playingWindows(f, '2026-09-05', 18, 'any', morning).some(
      (w) => w.start.time === '2026-09-05T10:00',
    ),
  );
});
void test('shorter rounds fit later in the day', () => {
  const f = forecast(),
    now = new Date('2026-09-05T21:05:00Z');
  assert.equal(playingWindows(f, '2026-09-05', 18, 'any', now).length, 0);
  assert.ok(playingWindows(f, '2026-09-05', 9, 'any', now).length > 0);
});
void test('morning and afternoon apply to starts, not forecast availability', () => {
  assert.ok(
    playingWindows(forecast(), '2026-09-05', 9, 'am', morning).every(
      (w) => Number(w.start.time.slice(11, 13)) < 12,
    ),
  );
  assert.ok(
    playingWindows(forecast(), '2026-09-05', 9, 'pm', morning).every(
      (w) => Number(w.start.time.slice(11, 13)) >= 12,
    ),
  );
});
void test('dangerous conditions and missing daylight cannot earn a good score', () => {
  for (const patch of [
    { code: 95 },
    { code: 71 },
    { gust: 45 },
    { temperature: 30 },
    { daylight: false },
  ])
    assert.equal(hourScore({ ...baseHour, ...patch }), 0);
  assert.ok(
    hourScore({ ...baseHour, wind: 22, rain: 70 }) < hourScore(baseHour),
  );
});
void test('local date respects timezone and formats noon correctly', () => {
  assert.equal(
    localNow('America/Denver', new Date('2026-09-06T02:00:00Z')),
    '2026-09-05T20:00',
  );
  assert.equal(hourLabel('2026-09-05T12:30'), '12:30 PM');
  assert.equal(hourLabel('2026-09-05T00:00'), '12 AM');
});
void test('rates are taken from an identified table row, not arbitrary page prices', () => {
  const html =
    '<p>Special $10</p><table><tr><th>Adult</th><td>$65</td><td><b>$78</b></td></tr><tr><td>Senior</td><td>$52</td></tr></table>';
  assert.deepEqual(extractRate(html, 'Adult'), { min: 65, max: 78 });
  assert.equal(extractRate('<p>Adult $65 $78</p>', 'Adult'), undefined);
  assert.equal(
    extractRate(
      '<tr><td>Adult</td><td>sold out</td><td>$78</td></tr>',
      'Adult',
    ),
    undefined,
  );
});
void test('robots policy honors specific agents, longest paths, empty groups, and anchors', () => {
  assert.equal(
    robotsAllows(
      'User-agent: *\nDisallow: /private\nAllow: /private/rates',
      '/private/rates',
    ),
    true,
  );
  assert.equal(robotsAllows('User-agent: *\nDisallow: /', '/rates'), false);
  assert.equal(
    robotsAllows(
      'User-agent: *\nDisallow: /\nUser-agent: FairwayOS\nAllow: /rates',
      '/rates',
    ),
    true,
  );
  assert.equal(
    robotsAllows(
      'User-agent: *\nDisallow:\nUser-agent: OtherBot\nDisallow: /',
      '/rates',
    ),
    true,
  );
  assert.equal(
    robotsAllows('User-agent: *\nDisallow: /*.pdf$', '/file.pdf'),
    false,
  );
  assert.equal(
    robotsAllows('User-agent: *\nDisallow: /*.pdf$', '/file.pdf/info'),
    true,
  );
});
void test('pricing outside its season or freshness window is hidden', () => {
  const c = COURSES[0];
  assert.equal(publishedPrice(c, '2026-09-10'), undefined);
  const stale = {
    ...c,
    price: {
      ...c.price!,
      source: { ...c.price!.source, checkedAt: '2020-01-01T00:00:00Z' },
    },
  };
  assert.equal(publishedPrice(stale, '2026-09-05'), undefined);
});
void test('missing tee sheet remains unknown and never becomes sold out', async () => {
  const result = await getCourseSignals(
    COURSES.find((c) => c.id === 'arrowhead')!,
    '2026-09-05',
  );
  assert.equal(result.availability.state, 'unknown');
  assert.equal(result.availability.checkedAt, null);
  assert.deepEqual(result.availability.times, []);
  assert.ok(result.availability.bookingUrl);
});
void test('coordinates and external links reject invalid input', () => {
  assert.ok(validCoordinates(0, 0));
  assert.ok(!validCoordinates(91, NaN));
  assert.equal(milesBetween(DENVER, DENVER), 0);
  assert.ok(milesBetween(DENVER, COURSES[0]) < 20);
  assert.equal(safeWebsite('javascript:alert(1)'), undefined);
  assert.equal(safeWebsite('https://user:password@example.com'), undefined);
});
void test('concurrent provider calls coalesce and failures can be retried', async () => {
  let calls = 0;
  const get = () =>
    cached('test:coalescing', 1000, async () => {
      calls++;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return 3;
    });
  assert.deepEqual(await Promise.all([get(), get(), get()]), [3, 3, 3]);
  assert.equal(calls, 1);
  await assert.rejects(
    cached('test:failure', 1000, async () => {
      throw new Error('down');
    }),
  );
  assert.equal(await cached('test:failure', 1000, async () => 4), 4);
});
