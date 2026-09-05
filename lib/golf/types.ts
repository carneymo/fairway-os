export type Location = {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  source: 'default' | 'ip' | 'search' | 'device';
};
export type Source = { label: string; url: string; checkedAt: string };
export type CoursePhoto = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  position?: string;
} & (
  | { kind: 'illustration' }
  | {
      kind: 'photograph';
      author: string;
      sourceUrl: string;
      license: string;
      licenseUrl: string;
      takenAt?: string;
    }
);
export type Course = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  photo?: CoursePhoto;
  photosUrl?: string;
  holes?: number;
  par?: number;
  character: string;
  description: string;
  tags: string[];
  amenities: string[];
  website?: string;
  bookingUrl?: string;
  phone?: string;
  address?: string;
  source: Source;
  distance?: number;
  exposure: 'open' | 'mixed' | 'unknown';
  price?: { min: number; max: number; note: string; source: Source };
  notices?: { text: string; from: string; until: string; url: string }[];
};
export type Hour = {
  time: string;
  temperature: number;
  wind: number;
  gust: number;
  rain: number;
  code: number;
  daylight: boolean;
};
export type Forecast = {
  sourceName?: string;
  daylightApproximate?: boolean;
  timezone: string;
  utcOffset: number;
  fetchedAt: string;
  source: string;
  hours: Hour[];
  days: {
    date: string;
    sunrise: string;
    sunset: string;
    high: number;
    low: number;
  }[];
};
export type Window = {
  start: Hour;
  end: Hour;
  score: number;
  reason: string;
  hours: Hour[];
};
export type TeeTime = {
  time: string;
  players: number;
  holes: number;
  price?: number;
  bookingUrl: string;
};
export type Availability = {
  state: 'live' | 'unknown' | 'unavailable';
  checkedAt: string | null;
  times: TeeTime[];
  bookingUrl?: string;
  sourceUrl?: string;
  message: string;
};
export type CourseSignals = {
  availability: Availability;
  price?: Course['price'];
  notices: string[];
  checkedAt: string | null;
  sourceUrl?: string;
};
// Account ownership can be added without changing discovery or provider contracts.
export type GolferProfile = {
  favoriteCourseIds: string[];
  handedness?: 'left' | 'right';
  preferredHoles?: 9 | 18;
};
