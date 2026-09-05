import { cached, fetchBounded } from './http.ts';
import type { Course, CourseSignals } from './types';
import { publishedPrice } from './pricing.ts';

// Only these reviewed, public information pages are fetched. User-supplied URLs are never fetched.
const RATE_SOURCES: Record<string, { url: string; row: string; note: string }> =
  {
    'legacy-ridge': {
      url: 'https://www.westminsterco.gov/216/Rates',
      row: 'Adult',
      note: 'Published weekday–weekend adult 18-hole green fees. Carts and tax are extra; confirm your total when booking.',
    },
    'walnut-creek': {
      url: 'https://www.westminsterco.gov/225/Rates',
      row: 'Adult',
      note: 'Published weekday–weekend adult 18-hole green fees. Carts and tax are extra; confirm your total when booking.',
    },
    broadlands: {
      url: 'https://www.thebroadlandsgc.com/golf/rates',
      row: 'Non-Resident',
      note: 'Published non-resident 18-hole green fees. Dynamic prices may differ; cart and tax are extra.',
    },
  };

export function textFromHtml(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#36;/g, '$')
    .replace(/\s+/g, ' ')
    .trim();
}
export function extractRate(
  html: string,
  label: string,
): { min: number; max: number } | undefined {
  // Require one table row with the expected label, then the first two money cells.
  const rows = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rows) {
    const cells = (row.match(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi) ?? []).map(
      textFromHtml,
    );
    if (cells[0]?.toLowerCase() !== label.toLowerCase()) continue;
    const prices = cells
      .slice(1, 3)
      .map((c) => /^\s*\$([\d]+(?:\.\d{1,2})?)/.exec(c)?.[1])
      .map(Number);
    if (
      prices.length === 2 &&
      prices.every((p) => Number.isFinite(p) && p >= 5 && p <= 1000)
    )
      return { min: Math.min(...prices), max: Math.max(...prices) };
  }
}
export function robotsAllows(text: string, path: string) {
  const groups: {
    agents: string[];
    rules: { allow: boolean; pattern: string }[];
  }[] = [];
  let group = {
    agents: [] as string[],
    rules: [] as { allow: boolean; pattern: string }[],
  };
  let hasDirective = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const field = line.slice(0, colon).toLowerCase(),
      value = line.slice(colon + 1).trim();
    if (field === 'user-agent') {
      if (hasDirective) {
        groups.push(group);
        group = { agents: [], rules: [] };
        hasDirective = false;
      }
      group.agents.push(value.toLowerCase());
    } else if (
      (field === 'allow' || field === 'disallow') &&
      group.agents.length
    ) {
      hasDirective = true;
      if (value) group.rules.push({ allow: field === 'allow', pattern: value });
    }
  }
  groups.push(group);
  const specific = groups.filter((g) =>
    g.agents.some((a) => a !== '*' && 'fairwayos'.startsWith(a)),
  );
  const chosen = specific.length
    ? specific
    : groups.filter((g) => g.agents.includes('*'));
  const matches = chosen
    .flatMap((g) => g.rules)
    .filter((r) => {
      const pattern = r.pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\\\$$/, '$');
      return new RegExp('^' + pattern).test(path);
    })
    .sort(
      (a, b) =>
        b.pattern.length - a.pattern.length ||
        Number(b.allow) - Number(a.allow),
    );
  return matches[0]?.allow ?? true;
}
async function publicPage(url: string) {
  const parsed = new URL(url);
  const allowed = await cached(
    `robots:${parsed.origin}:${parsed.pathname}`,
    24 * 3600_000,
    async () => {
      try {
        return robotsAllows(
          await fetchBounded(parsed.origin + '/robots.txt', {}, 100_000),
          parsed.pathname,
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'Upstream returned 404')
          return true;
        throw error;
      }
    },
  );
  if (!allowed) throw new Error('Public collection disallowed by source');
  return fetchBounded(url);
}
export async function getCourseSignals(
  course: Course,
  date: string,
): Promise<CourseSignals> {
  const result: CourseSignals = {
    availability: {
      state: 'unknown',
      checkedAt: null,
      times: [],
      bookingUrl: course.bookingUrl,
      message:
        'The course has the current tee sheet. Choose your date, group size, and start time on its booking site.',
    },
    price: publishedPrice(course, date),
    notices: (course.notices ?? [])
      .filter((n) => date >= n.from && date <= n.until)
      .map((n) => n.text),
    checkedAt: null,
  };
  const config = RATE_SOURCES[course.id];
  if (!config) return result;
  try {
    const collected = await cached(
      `rates:${course.id}`,
      6 * 3600_000,
      async () => {
        const price = extractRate(await publicPage(config.url), config.row);
        if (!price)
          throw new Error('Rate table changed or contains no matching price');
        return { ...price, checkedAt: new Date().toISOString() };
      },
    );
    result.price = {
      min: collected.min,
      max: collected.max,
      note: config.note,
      source: {
        label: 'Official published rates',
        url: config.url,
        checkedAt: collected.checkedAt,
      },
    };
    result.checkedAt = collected.checkedAt;
    result.sourceUrl = config.url;
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'course_source_unavailable',
        courseId: course.id,
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
  }
  return result;
}
