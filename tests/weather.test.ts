import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNws } from '../lib/golf/nws.ts';
import { getForecast } from '../lib/golf/weather.ts';
import { hourScore, playingWindows } from '../lib/golf/recommendations.ts';

const periods = Array.from({ length: 24 }, (_, hour) => ({
  startTime: `2026-09-06T${String(hour).padStart(2, '0')}:00:00-06:00`,
  isDaytime: hour >= 7 && hour < 19,
  temperature: 72,
  temperatureUnit: 'F',
  probabilityOfPrecipitation: { value: 10 },
  windSpeed: '5 to 10 mph',
  shortForecast: 'Mostly Sunny',
}));
const gusts = {
  uom: 'wmoUnit:km_h-1',
  values: [{ validTime: '2026-09-06T00:00:00-06:00/P1D', value: 24.14016 }],
};

void test('NWS preserves local hours, converts gusts, and uses a conservative daylight cutoff', () => {
  const forecast = normalizeNws('America/Denver', periods, gusts);
  assert.equal(forecast.utcOffset, -21600);
  assert.equal(forecast.hours[10].time, '2026-09-06T10:00');
  assert.equal(forecast.hours[10].wind, 10);
  assert.ok(Math.abs(forecast.hours[10].gust - 15) < 0.001);
  assert.equal(forecast.days[0].sunset, '2026-09-06T18:00');
  assert.equal(forecast.daylightApproximate, true);
  const windows = playingWindows(
    forecast,
    '2026-09-06',
    18,
    'any',
    new Date('2026-09-05T20:00Z'),
  );
  assert.ok(windows.length > 0);
  assert.ok(windows.every((w) => w.end.time <= forecast.days[0].sunset));
});

void test('NWS incomplete safety inputs never become safe playing hours', () => {
  const incomplete = periods.map((p, i) =>
    i === 10 ? { ...p, probabilityOfPrecipitation: { value: null } } : p,
  );
  const forecast = normalizeNws('America/Denver', incomplete, gusts);
  assert.ok(!forecast.hours.some((h) => h.time === '2026-09-06T10:00'));
  const hazards = normalizeNws(
    'America/Denver',
    periods.map((p) => ({
      ...p,
      shortForecast: 'Slight Chance Thunderstorms',
    })),
    gusts,
  );
  assert.ok(hazards.hours.every((h) => hourScore(h) === 0));
  assert.throws(() =>
    normalizeNws('America/Denver', periods, { ...gusts, values: [] }),
  );
});

void test('a rate-limited provider falls back to NWS and caches the complete forecast', async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url =
      input instanceof Request
        ? input.url
        : input instanceof URL
          ? input.href
          : input;
    calls.push(url);
    if (url.startsWith('https://api.open-meteo.com/'))
      return new Response('', { status: 429 });
    if (url.startsWith('https://api.weather.gov/points/'))
      return Response.json({
        properties: {
          timeZone: 'America/Denver',
          forecastHourly:
            'https://api.weather.gov/gridpoints/BOU/63,62/forecast/hourly',
          forecastGridData: 'https://api.weather.gov/gridpoints/BOU/63,62',
        },
      });
    return Response.json({
      properties: url.endsWith('/hourly') ? { periods } : { windGust: gusts },
    });
  };
  try {
    const forecast = await getForecast(39.74, -104.99);
    assert.equal(forecast.sourceName, 'National Weather Service');
    assert.equal(forecast.hours.length, 24);
    assert.equal(calls.length, 4);
    assert.deepEqual(await getForecast(39.74, -104.99), forecast);
    assert.equal(calls.length, 4);
  } finally {
    globalThis.fetch = original;
  }
});
