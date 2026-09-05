import { COURSES, milesBetween, validCoordinates } from './courses';
import { cached, fetchBounded, safeWebsite } from './http';
import type { Course } from './types';
type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};
type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type: string;
    osm_id: number;
    osm_key: string;
    osm_value: string;
    name?: string;
    city?: string;
    extra?: Record<string, string>;
  };
};
async function openCourseElements(
  lat: number,
  lon: number,
): Promise<OsmElement[]> {
  try {
    const query = new URLSearchParams({
      lat: lat.toFixed(2),
      lon: lon.toFixed(2),
      radius: '57',
      osm_tag: 'leisure:golf_course',
      limit: '40',
    });
    const data = JSON.parse(
      await fetchBounded(`https://photon.komoot.io/reverse?${query}`),
    ) as { features: PhotonFeature[] };
    if (!Array.isArray(data.features))
      throw new Error('Invalid open course response');
    return data.features.flatMap((f) => {
      const p = f.properties,
        [longitude, latitude] = f.geometry?.coordinates ?? [];
      const type = (
        { N: 'node', W: 'way', R: 'relation' } as Record<string, string>
      )[p?.osm_type];
      if (
        !type ||
        !p.name ||
        !Number.isInteger(p.osm_id) ||
        p.osm_key !== 'leisure' ||
        p.osm_value !== 'golf_course' ||
        !validCoordinates(latitude, longitude)
      )
        return [];
      return [
        {
          type,
          id: p.osm_id,
          lat: latitude,
          lon: longitude,
          tags: { ...p.extra, name: p.name, 'addr:city': p.city ?? 'Nearby' },
        },
      ];
    });
  } catch {
    const query = `[out:json][timeout:7];nwr["leisure"="golf_course"]["name"](around:56327,${lat.toFixed(2)},${lon.toFixed(2)});out center tags 60;`;
    const payload = JSON.parse(
      await fetchBounded('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
      }),
    ) as { elements: OsmElement[] };
    if (!Array.isArray(payload.elements))
      throw new Error('Invalid course response');
    return payload.elements;
  }
}
export async function discoverCourses(lat: number, lon: number) {
  const nearby = COURSES.map((c) => ({
    ...c,
    distance: milesBetween({ latitude: lat, longitude: lon }, c),
  })).filter((c) => c.distance <= 35);
  if (nearby.length >= 3)
    return {
      courses: nearby,
      coverage: 'curated',
      message: 'A curated selection around you; more courses are on the way.',
    };
  try {
    const live = await cached(
      `osm:${lat.toFixed(2)}:${lon.toFixed(2)}`,
      6 * 3600_000,
      async () => {
        const elements = await openCourseElements(lat, lon);
        return elements.flatMap((e): Course[] => {
          const tags = e.tags ?? {},
            latitude = e.lat ?? e.center?.lat,
            longitude = e.lon ?? e.center?.lon;
          if (
            !tags.name ||
            latitude === undefined ||
            longitude === undefined ||
            ['private', 'no'].includes(tags.access) ||
            tags.golf === 'driving_range'
          )
            return [];
          const website = safeWebsite(tags.website ?? tags['contact:website']);
          return [
            {
              id: `osm-${e.type}-${e.id}`,
              name: tags.name,
              city: tags['addr:city'] ?? 'Nearby',
              latitude,
              longitude,
              holes: /^\d+$/.test(tags['golf:holes'] ?? '')
                ? Number(tags['golf:holes'])
                : undefined,
              character: 'A course to discover',
              description:
                'Found in OpenStreetMap. Check the course website for visitor access, course details, current conditions, and booking.',
              tags: ['OpenStreetMap listing'],
              amenities: [],
              website,
              bookingUrl: website,
              exposure: 'unknown',
              source: {
                label: 'OpenStreetMap contributors',
                url: `https://www.openstreetmap.org/${e.type}/${e.id}`,
                checkedAt: new Date().toISOString(),
              },
            },
          ];
        });
      },
    );
    const combined = [
      ...nearby,
      ...live.filter((c) => !nearby.some((n) => milesBetween(n, c) < 0.5)),
    ]
      .map((c) => ({
        ...c,
        distance: milesBetween({ latitude: lat, longitude: lon }, c),
      }))
      .filter((c) => c.distance <= 35)
      .sort((a, b) => a.distance - b.distance);
    return {
      courses: combined,
      coverage: 'open-data',
      message:
        'OpenStreetMap listings. Visitor access and tee times need confirmation with each course.',
    };
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'course_discovery_failed',
        provider: 'overpass',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
    return {
      courses: nearby,
      coverage: 'limited',
      message:
        'Nearby course discovery is temporarily unavailable. Try again or explore Denver.',
    };
  }
}
