import { getNwsForecast } from './nws.ts';
import { cached, fetchBounded } from './http.ts';
import type { Forecast } from './types.ts';
type WeatherPayload = {
  timezone: string;
  utc_offset_seconds: number;
  hourly: Record<string, number[] | string[]>;
  daily: Record<string, number[] | string[]>;
};
async function getOpenMeteoForecast(
  lat: number,
  lon: number,
): Promise<Forecast> {
  // ~1 km cache buckets prevent arbitrary coordinate precision from fragmenting the cache.
  const latitude = lat.toFixed(2),
    longitude = lon.toFixed(2);
  return cached(`weather:${latitude}:${longitude}`, 15 * 60_000, async () => {
    const key = process.env.OPEN_METEO_API_KEY;
    const url = new URL(
      key
        ? 'https://customer-api.open-meteo.com/v1/forecast'
        : 'https://api.open-meteo.com/v1/forecast',
    );
    url.search = new URLSearchParams({
      latitude,
      longitude,
      hourly:
        'temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m,is_day',
      daily: 'sunrise,sunset,temperature_2m_max,temperature_2m_min',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      timezone: 'auto',
      forecast_days: '3',
      ...(key ? { apikey: key } : {}),
    }).toString();
    const data = JSON.parse(await fetchBounded(url.href)) as WeatherPayload;
    if (
      !data.timezone ||
      !Array.isArray(data.hourly?.time) ||
      !Array.isArray(data.daily?.time)
    )
      throw new Error('Invalid forecast');
    const numeric = (name: string, i: number) => {
      const v = data.hourly[name]?.[i];
      if (typeof v !== 'number' || !Number.isFinite(v))
        throw new Error(`Missing weather field ${name}`);
      return v;
    };
    return {
      timezone: data.timezone,
      utcOffset: data.utc_offset_seconds,
      fetchedAt: new Date().toISOString(),
      source: 'https://open-meteo.com/',
      hours: data.hourly.time.map((time, i) => ({
        time: String(time),
        temperature: numeric('temperature_2m', i),
        wind: numeric('wind_speed_10m', i),
        gust: numeric('wind_gusts_10m', i),
        rain: numeric('precipitation_probability', i),
        code: numeric('weather_code', i),
        daylight: numeric('is_day', i) === 1,
      })),
      days: data.daily.time.map((date, i) => ({
        date: String(date),
        sunrise: String(data.daily.sunrise[i]),
        sunset: String(data.daily.sunset[i]),
        high: Number(data.daily.temperature_2m_max[i]),
        low: Number(data.daily.temperature_2m_min[i]),
      })),
    };
  });
}

// A shared 429 should not send every course/location request back to the same
// throttled endpoint. Successful provider fallbacks share the normal cache TTL.
let openMeteoRetryAfter = 0;
export async function getForecast(lat: number, lon: number): Promise<Forecast> {
  const latitude = lat.toFixed(2),
    longitude = lon.toFixed(2);
  return cached(`forecast:${latitude}:${longitude}`, 15 * 60_000, async () => {
    if (Date.now() >= openMeteoRetryAfter) {
      try {
        return await getOpenMeteoForecast(lat, lon);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        if (message === 'Upstream returned 429')
          openMeteoRetryAfter = Date.now() + 10 * 60_000;
        console.warn(
          JSON.stringify({
            event: 'weather_provider_fallback',
            provider: 'open-meteo',
            message,
          }),
        );
      }
    }
    return getNwsForecast(latitude, longitude);
  });
}
