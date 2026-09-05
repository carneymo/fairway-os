import type { Forecast, Hour, Window, Course } from './types';

export function localNow(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  return parts.replace(' ', 'T');
}
export function hourLabel(time: string) {
  const hour = Number(time.slice(11, 13)),
    minute = time.slice(14, 16);
  return `${hour % 12 || 12}${minute !== '00' ? `:${minute}` : ''} ${hour < 12 ? 'AM' : 'PM'}`;
}
export function weatherLabel(code: number) {
  if (code >= 95) return 'Thunderstorms';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if (code >= 51) return 'Rain possible';
  if (code >= 45) return 'Fog';
  if (code >= 3) return 'Cloudy';
  if (code > 0) return 'Partly sunny';
  return 'Clear skies';
}
export function hourScore(h: Hour) {
  if (
    !h.daylight ||
    h.code >= 95 ||
    [56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(h.code) ||
    h.temperature < 35 ||
    h.gust >= 40
  )
    return 0;
  const tempPenalty =
    h.temperature < 60
      ? (60 - h.temperature) * 1.7
      : Math.max(0, h.temperature - 80) * 2;
  return Math.max(
    0,
    Math.round(
      100 -
        tempPenalty -
        Math.max(0, h.wind - 7) * 2 -
        Math.max(0, h.gust - 18) -
        h.rain * 0.55 -
        (h.code >= 51 ? 12 : 0),
    ),
  );
}
export function playingWindows(
  f: Forecast,
  date: string,
  holes: number,
  period = 'any',
  now = new Date(),
): Window[] {
  const duration = holes === 9 ? 2.5 : 4.5;
  const day = f.days.find((d) => d.date === date);
  if (!day) return [];
  const current = localNow(f.timezone, now);
  const sunset = Date.parse(day.sunset + 'Z');
  return f.hours
    .filter(
      (h) =>
        h.time.startsWith(date) &&
        h.time > current &&
        h.daylight &&
        (period === 'any' ||
          (period === 'am'
            ? Number(h.time.slice(11, 13)) < 12
            : Number(h.time.slice(11, 13)) >= 12)),
    )
    .flatMap((start) => {
      const startMs = Date.parse(start.time + 'Z');
      const endMs = startMs + duration * 3600000;
      if (endMs > sunset) return [];
      const hours = f.hours.filter(
        (h) =>
          Date.parse(h.time + 'Z') >= startMs &&
          Date.parse(h.time + 'Z') < endMs,
      );
      if (
        hours.length < Math.ceil(duration) ||
        hours.some((h) => hourScore(h) === 0)
      )
        return [];
      const score = Math.round(
        hours.reduce((sum, h) => sum + hourScore(h), 0) / hours.length,
      );
      const wind = Math.max(...hours.map((h) => h.wind)),
        rain = Math.max(...hours.map((h) => h.rain)),
        hot = Math.max(...hours.map((h) => h.temperature)),
        cold = Math.min(...hours.map((h) => h.temperature));
      const reason =
        rain >= 40
          ? 'Rain could interrupt the round. Keep an eye on the forecast.'
          : wind >= 15
            ? 'Expect wind to influence club selection and ball flight.'
            : hot >= 88
              ? 'A warm round. Bring water and plan for shade.'
              : cold < 50
                ? 'A cool start. Bring a layer and check for frost delays.'
                : 'Comfortable temperatures, manageable wind, and a low chance of rain.';
      return [
        {
          start,
          end: { ...start, time: new Date(endMs).toISOString().slice(0, 16) },
          score,
          reason,
          hours,
        },
      ];
    })
    .sort(
      (a, b) => b.score - a.score || a.start.time.localeCompare(b.start.time),
    );
}
export function outlook(score?: number) {
  return score === undefined
    ? 'Let’s find your next golf day.'
    : score >= 80
      ? 'A good day to get out.'
      : score >= 60
        ? 'There’s a window worth playing.'
        : 'Pick your window carefully.';
}
export function courseReason(course: Course, best?: Window) {
  if (
    best &&
    course.exposure === 'open' &&
    Math.max(...best.hours.map((h) => h.wind)) >= 12
  )
    return 'The open layout will feel the wind. Consider a calmer start.';
  if (course.price && course.price.max < 90)
    return 'Worth a look for a round with a little room in the budget.';
  return course.character + '.';
}
