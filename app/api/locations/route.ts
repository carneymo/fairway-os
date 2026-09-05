import { apiError, cached, fetchBounded } from '@/lib/golf/http';
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 100)
    return apiError('Enter a city or ZIP code.', 400);
  try {
    const results = await cached(
      `geo:${query.toLowerCase()}`,
      3600_000,
      async () => {
        const data = JSON.parse(
          await fetchBounded(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`,
          ),
        ) as {
          results?: {
            name: string;
            admin1?: string;
            country_code: string;
            latitude: number;
            longitude: number;
            timezone: string;
          }[];
        };
        return (data.results ?? []).map((r) => ({
          name: [r.name, r.admin1, r.country_code].filter(Boolean).join(', '),
          latitude: r.latitude,
          longitude: r.longitude,
          timezone: r.timezone,
          source: 'search',
        }));
      },
    );
    return Response.json(results);
  } catch {
    return apiError(
      'Location search is unavailable. Try your device location or Denver.',
    );
  }
}
