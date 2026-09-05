import { DENVER, validCoordinates } from '@/lib/golf/courses';
export async function GET(request: Request) {
  const cf = (
    request as Request & {
      cf?: {
        city?: string;
        regionCode?: string;
        country?: string;
        latitude?: string;
        longitude?: string;
        timezone?: string;
      };
    }
  ).cf;
  const latitude = cf?.latitude ? Number(cf.latitude) : NaN,
    longitude = cf?.longitude ? Number(cf.longitude) : NaN;
  const location = validCoordinates(latitude, longitude)
    ? {
        name: [cf?.city ?? 'Your area', cf?.regionCode ?? cf?.country]
          .filter(Boolean)
          .join(', '),
        latitude,
        longitude,
        timezone: cf?.timezone ?? 'UTC',
        source: 'ip',
      }
    : DENVER;
  return Response.json(location, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
