import { apiError, coordinates } from '@/lib/golf/http';
import { getForecast } from '@/lib/golf/weather';
export async function GET(request: Request) {
  let point;
  try {
    point = coordinates(request);
  } catch {
    return apiError('Valid latitude and longitude are required.', 400);
  }
  try {
    return Response.json(await getForecast(point.lat, point.lon), {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'weather_unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
    return apiError(
      'The forecast is taking a break. You can still explore courses and check their tee times.',
    );
  }
}
