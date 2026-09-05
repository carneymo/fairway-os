import type { Course, Location } from './types';
import { landscape } from './imagery.ts';
export const DENVER: Location = {
  name: 'Denver, CO',
  latitude: 39.7392,
  longitude: -104.9903,
  timezone: 'America/Denver',
  source: 'default',
};
const checkedAt = '2026-09-05T20:00:00Z';
const source = (url: string) => ({
  label: 'Official course website',
  url,
  checkedAt,
});
export const COURSES: Course[] = [
  {
    id: 'fossil-trace',
    name: 'Fossil Trace Golf Club',
    photo: landscape(
      'sandstone-foothills',
      'buff sandstone outcrops beside a winding fairway in dry foothills',
    ),
    city: 'Golden, CO',
    latitude: 39.7373,
    longitude: -105.2166,
    holes: 18,
    par: 72,
    character: 'A round to remember',
    description:
      'Sandstone outcrops, remnants of an old clay mine, and a Jim Engh layout tucked into the Golden foothills. A distinctive choice when the round itself is the occasion.',
    tags: ['Foothill scenery', 'Creative shotmaking', 'Public'],
    amenities: ['Practice range', 'Restaurant', 'Rental clubs'],
    exposure: 'mixed',
    website: 'https://fossiltrace.com/',
    bookingUrl: 'https://fossiltrace.cps.golf/',
    phone: '303-277-8750',
    address: '3050 Illinois St, Golden, CO 80401',
    source: source('https://fossiltrace.com/'),
    price: {
      min: 140,
      max: 175,
      note: 'Published peak-season standard 18-hole rates through Sept 9, 2026, including cart and range balls. Short-notice rates may be lower.',
      source: source('https://fossiltrace.com/rates/'),
    },
    notices: [
      {
        text: 'Fall aeration is scheduled September 8–9; sandy greens may remain through September 16.',
        from: '2026-09-01',
        until: '2026-09-16',
        url: 'https://fossiltrace.com/rates/',
      },
      {
        text: 'A 17-hole experience begins September 10 during irrigation work. Check the course for revised rates and the project schedule.',
        from: '2026-09-01',
        until: '2027-03-31',
        url: 'https://fossiltrace.com/rates/',
      },
    ],
  },
  {
    id: 'legacy-ridge',
    name: 'Legacy Ridge Golf Course',
    photo: landscape(
      'rolling-front-range',
      'rolling fairways, scattered trees, and a distant mountain horizon',
    ),
    photosUrl: 'https://www.westyweddings.com/legacy-ridge',
    city: 'Westminster, CO',
    latitude: 39.8931,
    longitude: -105.0425,
    holes: 18,
    par: 72,
    character: 'Room to find your rhythm',
    description:
      'Rolling terrain and Front Range views make this municipal course an appealing everyday escape. Pick your tees thoughtfully and leave time for a warm-up.',
    tags: ['Rolling fairways', 'Mountain views', 'Public'],
    amenities: ['Practice range', 'Restaurant', 'Rental clubs'],
    exposure: 'mixed',
    website: 'https://www.westminsterco.gov/213/Legacy-Ridge',
    bookingUrl:
      'https://cityofwestminster.cps.golf/onlineresweb/search-teetime?TeeOffTimeMax=23&TeeOffTimeMin=0',
    phone: '303-438-8997',
    address: '10801 Legacy Ridge Parkway, Westminster, CO 80031',
    source: source('https://www.westminsterco.gov/213/Legacy-Ridge'),
    price: {
      min: 65,
      max: 78,
      note: 'Published weekday–weekend adult 18-hole green fees. Carts and tax are extra.',
      source: source('https://www.westminsterco.gov/216/Rates'),
    },
    notices: [
      {
        text: 'Allow extra travel time for Legacy Ridge Parkway construction, expected through November 2.',
        from: '2026-08-03',
        until: '2026-11-02',
        url: 'https://www.westminsterco.gov/210/Tee-Times',
      },
    ],
  },
  {
    id: 'arrowhead',
    name: 'Arrowhead Golf Club',
    photo: landscape(
      'red-rock-foothills',
      'red sandstone formations beside a green fairway',
    ),
    photosUrl: 'https://arcisgolf.com/clubs/arrowhead-golf-club/golf-course',
    city: 'Littleton, CO',
    latitude: 39.4447,
    longitude: -105.0798,
    holes: 18,
    par: 70,
    character: 'Take the scenic route',
    description:
      'A foothills round framed by red sandstone, elevation changes, and wildlife. The Robert Trent Jones Sr. and Jr. design rewards a little extra thought before each shot.',
    tags: ['Red rock scenery', 'Elevation changes', 'Public'],
    amenities: ['Restaurant', 'Golf shop', 'Instruction'],
    exposure: 'mixed',
    website: 'https://arcisgolf.com/clubs/arrowhead-golf-club/home',
    bookingUrl: 'https://arrowheadpp.ezlinksgolf.com/',
    phone: '303-973-9614',
    address: '10850 Sundown Trail, Littleton, CO 80125',
    source: source('https://arcisgolf.com/clubs/arrowhead-golf-club/home'),
  },
  {
    id: 'walnut-creek',
    name: 'Walnut Creek Golf Preserve',
    photo: landscape(
      'open-prairie-preserve',
      'an open prairie fairway bordered by golden native grasses',
    ),
    photosUrl: 'https://www.westyweddings.com/walnut-creek/',
    city: 'Westminster, CO',
    latitude: 39.8904,
    longitude: -105.1329,
    holes: 18,
    par: 72,
    character: 'A little more wide-open',
    description:
      'An open landscape and long mountain horizons give this public preserve a spacious feel. Wind is part of the experience; a calmer window is especially worth seeking out.',
    tags: ['Open landscape', 'Wind in play', 'Public'],
    amenities: ['Practice range', 'Restaurant', 'Rental clubs'],
    exposure: 'open',
    website: 'https://www.westminsterco.gov/222/Walnut-Creek',
    bookingUrl:
      'https://cityofwestminster.cps.golf/onlineresweb/search-teetime?TeeOffTimeMax=23&TeeOffTimeMin=0',
    phone: '303-469-2974',
    address: '10555 Westmoor Drive, Westminster, CO 80031',
    source: source('https://www.westminsterco.gov/225/Rates'),
    price: {
      min: 65,
      max: 78,
      note: 'Published adult 18-hole green fees. Cart is an additional $22 per person plus tax; weekends and holidays differ.',
      source: source('https://www.westminsterco.gov/225/Rates'),
    },
  },
  {
    id: 'indian-peaks',
    name: 'Indian Peaks Golf Course',
    photo: landscape(
      'mountain-meadow',
      'a meadow fairway with mature trees and distant mountain ridges',
    ),
    photosUrl: 'https://indianpeaksgolf.com/the-course/',
    city: 'Lafayette, CO',
    latitude: 39.9974,
    longitude: -105.1278,
    holes: 18,
    par: 72,
    character: 'Make a day of it',
    description:
      'A public Lafayette course with mountain views, a practice range, and a bar and grill for the conversation after the last putt.',
    tags: ['Mountain views', 'Practice & play', 'Public'],
    amenities: ['Practice range', 'Bar & grill', 'Instruction'],
    exposure: 'open',
    website: 'https://indianpeaksgolf.com/',
    bookingUrl: 'https://indianpeaks.cps.golf/',
    phone: '303-666-4706',
    address: '2300 Indian Peaks Trail, Lafayette, CO 80026',
    source: source('https://indianpeaksgolf.com/golf-tee-times/'),
  },
  {
    id: 'broadlands',
    name: 'The Broadlands Golf Course',
    photo: landscape(
      'parkland-fairway',
      'a parkland fairway framed by mature leafy trees',
    ),
    photosUrl: 'https://www.thebroadlandsgc.com/golf/course',
    city: 'Broomfield, CO',
    latitude: 39.9582,
    longitude: -105.0454,
    holes: 18,
    character: 'Golf, then a good lunch',
    description:
      'An 18-hole public layout with a full practice facility and a clubhouse grille serving barbecue. A straightforward choice for combining a round with time together.',
    tags: ['Practice & play', 'Clubhouse BBQ', 'Public'],
    amenities: ['Practice range', 'Restaurant', 'Instruction'],
    exposure: 'mixed',
    website: 'https://www.thebroadlandsgc.com/',
    bookingUrl: 'https://www.thebroadlandsgc.com/golf/tee-times',
    phone: '303-466-8285',
    address: '4380 West 144th Ave, Broomfield, CO 80020',
    source: source('https://www.thebroadlandsgc.com/'),
  },
];
export function milesBetween(
  a: Pick<Location, 'latitude' | 'longitude'>,
  b: Pick<Location, 'latitude' | 'longitude'>,
) {
  const rad = Math.PI / 180,
    dlat = (b.latitude - a.latitude) * rad,
    dlon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(dlon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function validCoordinates(lat: unknown, lon: unknown) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  );
}
