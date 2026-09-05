import { cached, fetchBounded } from './http.ts';
import type { Forecast, Hour } from './types.ts';

type Period = {
  startTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  probabilityOfPrecipitation: { value: number | null };
  windSpeed: string;
  shortForecast: string;
};
type GustSeries = {
  uom: string;
  values: { validTime: string; value: number | null }[];
};

function durationMs(duration: string) {
  const match =
    /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(
      duration,
    );
  if (!match) throw new Error('Invalid NWS interval');
  return (
    (Number(match[1] ?? 0) * 86400 +
      Number(match[2] ?? 0) * 3600 +
      Number(match[3] ?? 0) * 60 +
      Number(match[4] ?? 0)) *
    1000
  );
}

function weatherCode(description: string) {
  if (/thunder|tornado|hurricane/i.test(description)) return 95;
  if (/snow|sleet|ice|freezing|hail/i.test(description)) return 71;
  if (/rain|shower|drizzle/i.test(description)) return 61;
  if (/fog|haze|smoke|dust/i.test(description)) return 45;
  if (/mostly cloudy|cloudy|overcast/i.test(description)) return 3;
  if (/partly|mostly/i.test(description)) return 2;
  if (/sunny|clear/i.test(description)) return 0;
  return 3;
}

// Keep only hours with complete safety inputs. Missing rain or gust values must
// never be interpreted as calm/dry weather when recommending a full round.
export function normalizeNws(
  timezone: string,
  periods: Period[],
  gusts: GustSeries,
): Forecast {
  const factor =
    gusts.uom === 'wmoUnit:km_h-1'
      ? 1 / 1.609344
      : gusts.uom === 'wmoUnit:m_s-1'
        ? 2.236936
        : gusts.uom === 'wmoUnit:mi_h-1'
          ? 1
          : null;
  if (factor === null) throw new Error('Unsupported NWS gust units');
  const intervals = gusts.values.map((v) => {
    const [start, duration] = v.validTime.split('/');
    const from = Date.parse(start);
    return { from, until: from + durationMs(duration), value: v.value };
  });
  const hours: Hour[] = [];
  for (const p of periods) {
    const instant = Date.parse(p.startTime);
    const gust = intervals.find(
      (v) => v.from <= instant && instant < v.until,
    )?.value;
    const rain = p.probabilityOfPrecipitation?.value;
    const speeds = p.windSpeed.match(/\d+(?:\.\d+)?/g)?.map(Number);
    const wind =
      p.windSpeed === 'Calm'
        ? 0
        : speeds?.length && p.windSpeed.endsWith('mph')
          ? Math.max(...speeds)
          : NaN;
    if (
      !Number.isFinite(instant) ||
      !Number.isFinite(p.temperature) ||
      !['F', 'C'].includes(p.temperatureUnit) ||
      typeof gust !== 'number' ||
      !Number.isFinite(gust) ||
      typeof rain !== 'number' ||
      !Number.isFinite(rain) ||
      !Number.isFinite(wind)
    )
      continue;
    hours.push({
      time: p.startTime.slice(0, 16),
      temperature:
        p.temperatureUnit === 'C' ? p.temperature * 1.8 + 32 : p.temperature,
      wind,
      gust: Math.max(wind, gust * factor),
      rain,
      code: weatherCode(p.shortForecast),
      daylight: p.isDaytime,
    });
  }
  if (!hours.length) throw new Error('NWS has no complete forecast hours');
  const dates = [...new Set(hours.map((h) => h.time.slice(0, 10)))].slice(0, 3);
  const days = dates.map((date) => {
    const dayHours = hours.filter((h) => h.time.startsWith(date));
    const daylight = dayHours.filter((h) => h.daylight);
    return {
      date,
      // NWS supplies daytime flags, not astronomical sunrise/sunset. Ending at
      // the start of its last daytime hour leaves a conservative daylight buffer.
      sunrise: daylight[0]?.time ?? `${date}T00:00`,
      sunset: daylight.at(-1)?.time ?? `${date}T00:00`,
      high: Math.max(...dayHours.map((h) => h.temperature)),
      low: Math.min(...dayHours.map((h) => h.temperature)),
    };
  });
  return {
    timezone,
    utcOffset:
      (Date.parse(periods[0].startTime.slice(0, 19) + 'Z') -
        Date.parse(periods[0].startTime)) /
      1000,
    fetchedAt: new Date().toISOString(),
    source: 'https://www.weather.gov/',
    sourceName: 'National Weather Service',
    daylightApproximate: true,
    hours: hours.filter((h) => dates.includes(h.time.slice(0, 10))),
    days,
  };
}

function nwsUrl(value: string) {
  const url = new URL(value);
  if (
    url.origin !== 'https://api.weather.gov' ||
    !url.pathname.startsWith('/gridpoints/')
  )
    throw new Error('Invalid NWS grid URL');
  return url.href;
}

export async function getNwsForecast(
  latitude: string,
  longitude: string,
): Promise<Forecast> {
  const point = await cached(
    `nws-point:${latitude}:${longitude}`,
    86400000,
    async () => {
      const data = JSON.parse(
        await fetchBounded(
          `https://api.weather.gov/points/${latitude},${longitude}`,
        ),
      );
      const p = data.properties;
      new Intl.DateTimeFormat('en', { timeZone: p.timeZone });
      return {
        timezone: String(p.timeZone),
        hourly: nwsUrl(p.forecastHourly),
        grid: nwsUrl(p.forecastGridData),
      };
    },
  );
  const [hourly, grid] = await Promise.all([
    fetchBounded(point.hourly),
    fetchBounded(point.grid),
  ]);
  return normalizeNws(
    point.timezone,
    JSON.parse(hourly).properties.periods,
    JSON.parse(grid).properties.windGust,
  );
}
