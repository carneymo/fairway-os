import { apiError, coordinates } from '@/lib/golf/http';
import { discoverCourses } from '@/lib/golf/discovery';
export async function GET(request: Request) {
  try {
    const p = coordinates(request);
    return Response.json(await discoverCourses(p.lat, p.lon), {
      headers: { 'Cache-Control': 'public, max-age=600' },
    });
  } catch {
    return apiError('Valid latitude and longitude are required.', 400);
  }
}
