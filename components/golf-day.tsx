/* oxlint-disable nextjs/no-html-link-for-pages -- Native document navigation avoids the beta client router that left deployed links inert. */
'use client';
import { useEffect, useMemo, useState } from 'react';
import { readJson } from '@/lib/golf/client';
import Image from 'next/image';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  ArrowRight,
  MapPin,
  Flag,
  ArrowUpRight,
  Wind,
  Clock3,
  CalendarDays,
  Info,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  COURSES,
  DENVER,
  milesBetween,
  validCoordinates,
} from '@/lib/golf/courses';
import {
  localNow,
  playingWindows,
  hourLabel,
  outlook,
  courseReason,
} from '@/lib/golf/recommendations';
import { publishedPrice } from '@/lib/golf/pricing';
import type { Course, Forecast, Location } from '@/lib/golf/types';
import {
  Header,
  Footer,
  Picker,
  WeatherIcon,
  ForecastStrip,
  Favorite,
  useFavorites,
  LocationEditor,
} from './golf-shared';

function datePlus(date: string, offset: number) {
  return new Date(Date.parse(date + 'T12:00:00Z') + offset * 86400000)
    .toISOString()
    .slice(0, 10);
}
function priceText(c: Course) {
  return c.price ? `$${c.price.min}–${c.price.max}` : 'Check course rates';
}
export default function GolfDay() {
  const [location, setLocation] = useState<Location>(DENVER),
    [ready, setReady] = useState(false),
    [editLocation, setEditLocation] = useState(false);
  const [forecast, setForecast] = useState<Forecast | null>(null),
    [weatherError, setWeatherError] = useState(''),
    [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>(
      COURSES.map((c) => ({ ...c, distance: milesBetween(DENVER, c) })),
    ),
    [courseLoading, setCourseLoading] = useState(false),
    [coverage, setCoverage] = useState(
      'A curated selection around Denver; more courses are on the way.',
    );
  const [offset, setOffset] = useState('0'),
    [holes, setHoles] = useState('18'),
    [period, setPeriod] = useState('any'),
    [sort, setSort] = useState('recommended'),
    [retry, setRetry] = useState(0),
    [compare, setCompare] = useState<string[]>([]),
    [showCompare, setShowCompare] = useState(false);
  const { ids: favoriteIds, toggle } = useFavorites();
  useEffect(() => {
    const controller = new AbortController();
    try {
      const saved = JSON.parse(
        localStorage.getItem('fairway:location') ?? 'null',
      );
      if (
        saved &&
        validCoordinates(saved.latitude, saved.longitude) &&
        typeof saved.name === 'string' &&
        typeof saved.timezone === 'string'
      ) {
        new Intl.DateTimeFormat('en', { timeZone: saved.timezone });
        setLocation(saved);
        setReady(true);
        return;
      }
    } catch {
      /* Use IP or Denver. */
    }
    readJson<Location>('/api/location', controller.signal)
      .then(setLocation)
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setReady(true);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setLoading(true);
    setForecast(null);
    setWeatherError('');
    setCourseLoading(true);
    setCourses([]);
    setCompare([]);
    setShowCompare(false);
    const query = `lat=${location.latitude}&lon=${location.longitude}`;
    readJson<Forecast>(`/api/weather?${query}`, controller.signal)
      .then(setForecast)
      .catch((e) => {
        if (e.name !== 'AbortError') setWeatherError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    readJson<{ courses: Course[]; message: string }>(
      `/api/courses?${query}`,
      controller.signal,
    )
      .then((data) => {
        setCourses(data.courses);
        setCoverage(data.message);
      })
      .catch((e) => {
        if (e.name !== 'AbortError')
          setCoverage('Course discovery is unavailable. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCourseLoading(false);
      });
    return () => controller.abort();
  }, [ready, location.latitude, location.longitude, retry]);
  // Re-evaluate time-sensitive recommendations while a tab stays open.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setRetry((v) => v + 1), 15 * 60000);
    return () => clearInterval(timer);
  }, []);
  const today = localNow(forecast?.timezone ?? location.timezone, now).slice(
      0,
      10,
    ),
    date = datePlus(today, Number(offset));
  const windows = useMemo(
    () =>
      forecast
        ? playingWindows(forecast, date, Number(holes), period, now)
        : [],
    [forecast, date, holes, period, now],
  );
  const best = windows[0],
    day = forecast?.days.find((d) => d.date === date);
  const tomorrowBest = forecast
    ? playingWindows(
        forecast,
        datePlus(today, 1),
        Number(holes),
        period,
        now,
      )[0]
    : undefined;
  const [forecastExpanded, setForecastExpanded] = useState(false);
  const sorted = useMemo(
    () =>
      courses
        .map((c) => ({ ...c, price: publishedPrice(c, date) }))
        .sort((a, b) =>
          sort === 'distance'
            ? (a.distance ?? 999) - (b.distance ?? 999)
            : sort === 'price'
              ? (a.price?.max ?? Infinity) - (b.price?.max ?? Infinity)
              : (a.exposure === 'open' && best && best.start.wind > 12
                  ? 15
                  : 0) +
                (a.distance ?? 0) * 0.3 -
                ((b.exposure === 'open' && best && best.start.wind > 12
                  ? 15
                  : 0) +
                  (b.distance ?? 0) * 0.3),
        ),
    [courses, sort, best, date],
  );
  const selected = sorted.filter((c) => compare.includes(c.id));
  function chooseLocation(next: Location) {
    setLocation(next);
    setOffset('0');
    setEditLocation(false);
    setReady(true);
    try {
      localStorage.setItem('fairway:location', JSON.stringify(next));
    } catch {
      /* Device persistence is optional. */
    }
  }
  function toggleCompare(id: string) {
    setCompare((previous) =>
      previous.includes(id)
        ? previous.filter((x) => x !== id)
        : previous.length < 3
          ? [...previous, id]
          : previous,
    );
  }
  const dayLabel =
    offset === '0'
      ? 'Today'
      : offset === '1'
        ? 'Tomorrow'
        : new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
          });
  const linkFor = (c: Course) =>
    `/courses/${c.id}?date=${date}&holes=${holes}${c.id.startsWith('osm-') ? `&lat=${location.latitude}&lon=${location.longitude}` : ''}`;
  return (
    <>
      <Header
        location={location}
        onLocation={() => setEditLocation((v) => !v)}
      />
      <main className="shell" id="main">
        <LocationEditor
          open={editLocation}
          onChoose={chooseLocation}
          onClose={() => setEditLocation(false)}
        />
        <Tabs
          value={offset}
          onValueChange={(v) => setOffset(String(v))}
          className="golf-day-tabs"
        >
          <section className="day-hero">
            <div className="hero-copy">
              <p className="eyebrow">
                {dayLabel.toUpperCase()} · {location.name.toUpperCase()}
              </p>
              <h1>
                {loading
                  ? 'Your next great golf day starts here.'
                  : weatherError
                    ? 'A little fresh air is calling.'
                    : best
                      ? outlook(best.score)
                      : offset === '0'
                        ? 'Let’s look ahead to your next round.'
                        : 'A day to keep an eye on.'}
              </h1>
              <p className="hero-subtitle">
                {loading
                  ? 'Find your kind of golf.'
                  : best
                    ? `${hourLabel(best.start.time)} looks like your best start.`
                    : weatherError
                      ? 'Find a course. Check the sky. Make a day of it.'
                      : 'No full-round window fits the selected conditions.'}
              </p>
              <a className="button gold" href="#courses">
                Find a place to play <ArrowRight size={18} />
              </a>
            </div>
            <aside className="hero-weather" aria-live="polite">
              {loading ? (
                <>
                  <Skeleton className="h-10 w-32 bg-white/20" />
                  <p>Checking the forecast…</p>
                </>
              ) : best ? (
                <>
                  <div className="weather-now">
                    <WeatherIcon code={best.start.code} size={44} />
                    <strong>
                      {Math.round(best.start.temperature)}°<span>F</span>
                    </strong>
                    <span className="weather-score">
                      {best.score >= 80
                        ? 'Looking good'
                        : best.score >= 60
                          ? 'Worth a look'
                          : 'Plan carefully'}
                    </span>
                  </div>
                  <p>At your recommended start</p>
                  <div className="weather-facts">
                    <span>
                      <Wind size={17} />
                      {Math.round(best.start.wind)} mph wind
                    </span>
                    <span>{best.start.rain}% rain chance</span>
                  </div>
                  <div className="hero-window">
                    <Clock3 size={20} />
                    <div>
                      <strong>
                        {hourLabel(best.start.time)} –{' '}
                        {hourLabel(best.end.time)}
                      </strong>
                      <p>Room for {holes} holes before sunset</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <CalendarDays size={32} />
                  <strong>
                    {weatherError
                      ? 'Forecast unavailable'
                      : tomorrowBest && offset === '0'
                        ? 'Tomorrow could be your day'
                        : 'Keep your plans flexible'}
                  </strong>
                  <p>
                    {weatherError
                      ? 'Course discovery and booking links are still available.'
                      : tomorrowBest && offset === '0'
                        ? `Try a ${hourLabel(tomorrowBest.start.time)} start tomorrow.`
                        : 'Try 9 holes or another day. Weather windows are not tee-time availability.'}
                  </p>
                  {tomorrowBest && offset === '0' ? (
                    <Button
                      className="hero-link"
                      variant="ghost"
                      onClick={() => setOffset('1')}
                    >
                      Look at tomorrow <ArrowRight size={16} />
                    </Button>
                  ) : weatherError ? (
                    <Button
                      className="hero-link"
                      variant="ghost"
                      onClick={() => setRetry((v) => v + 1)}
                    >
                      <RefreshCw size={15} />
                      Try forecast again
                    </Button>
                  ) : null}
                </>
              )}
            </aside>
          </section>
          <div className="day-toolbar">
            <TabsList className="date-tabs" aria-label="Day to play">
              {[
                'Today',
                'Tomorrow',
                new Date(datePlus(today, 2) + 'T12:00:00').toLocaleDateString(
                  'en-US',
                  { weekday: 'short' },
                ),
              ].map((label, i) => (
                <TabsTrigger key={i} value={String(i)}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="round-controls">
              <Picker
                label="Round length"
                value={holes}
                onChange={setHoles}
                options={[
                  { value: '18', label: '18 holes' },
                  { value: '9', label: '9 holes' },
                ]}
              />
              <Picker
                label="Preferred start time"
                value={period}
                onChange={setPeriod}
                options={[
                  { value: 'any', label: 'Any time' },
                  { value: 'am', label: 'Morning' },
                  { value: 'pm', label: 'Afternoon' },
                ]}
              />
            </div>
            <span className="area-label">
              <MapPin size={15} />
              {location.source === 'default'
                ? 'Denver fallback'
                : 'Around your location'}{' '}
              · 35 mi
            </span>
          </div>
          <TabsContent value={offset}>
            <section className="day-insight" aria-label="Golf day advice">
              <div className="insight-icon">
                <Flag size={22} strokeWidth={1.5} />
              </div>
              <div>
                <h3>
                  {best
                    ? 'A little planning. A better round.'
                    : loading
                      ? 'Finding your window…'
                      : 'Make room for a different plan.'}
                </h3>
                <p>
                  {best
                    ? best.reason
                    : loading
                      ? 'We’re checking temperature, rain, wind, and daylight.'
                      : weatherError ||
                        'There isn’t a suitable full-round window for these choices. Shorten your round or look at another day.'}
                </p>
                {best && (
                  <span className="small">
                    Weather guidance for{' '}
                    {holes === '18' ? 'a 4½-hour' : 'a 2½-hour'} round. Confirm
                    course conditions and tee times separately.
                  </span>
                )}
              </div>
              {forecast && (
                <Button
                  variant="ghost"
                  className="text-action"
                  aria-expanded={forecastExpanded}
                  onClick={() => setForecastExpanded((v) => !v)}
                >
                  {forecastExpanded ? 'Hide forecast' : 'See the whole day'}{' '}
                  <ArrowRight size={16} />
                </Button>
              )}
            </section>
            {forecast && forecastExpanded && (
              <section className="forecast-panel">
                <div className="row-between">
                  <h3>{dayLabel}, hour by hour</h3>
                  <span className="small">
                    {day
                      ? `${forecast.daylightApproximate ? 'Play until' : 'Sunset'} ${hourLabel(day.sunset)}`
                      : ''}{' '}
                    · {forecast.timezone}
                  </span>
                </div>
                <ForecastStrip forecast={forecast} date={date} />
                <p className="small">
                  Forecast fetched{' '}
                  {new Date(forecast.fetchedAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: forecast.timezone,
                  })}{' '}
                  local time ·{' '}
                  <a href={forecast.source} target="_blank" rel="noreferrer">
                    {forecast.sourceName ?? 'Open-Meteo'}
                  </a>
                </p>
              </section>
            )}
            <section id="courses">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">A ROUND THAT FITS YOUR DAY</p>
                  <h2>Somewhere you’ll want to play.</h2>
                </div>
                <Picker
                  label="Sort courses"
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: 'recommended', label: 'Best fit for the day' },
                    { value: 'distance', label: 'Closest to you' },
                    { value: 'price', label: 'Published price' },
                  ]}
                />
              </div>
              <p className="coverage-note">
                {coverage} Distances are straight-line estimates.
              </p>
              {courseLoading ? (
                <div
                  className="course-grid"
                  aria-label="Finding nearby courses"
                >
                  {[1, 2, 3].map((x) => (
                    <Skeleton
                      key={x}
                      className="h-96 rounded-xl bg-[#e7e3d8]"
                    />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <Empty className="empty-state">
                  <EmptyHeader>
                    <EmptyTitle>No courses to show here yet</EmptyTitle>
                    <EmptyDescription>{coverage}</EmptyDescription>
                  </EmptyHeader>
                  <Button
                    className="button"
                    onClick={() => chooseLocation(DENVER)}
                  >
                    Explore Denver
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setRetry((v) => v + 1)}
                  >
                    Try again
                  </Button>
                </Empty>
              ) : (
                <div className="course-grid">
                  {sorted.map((c, i) => (
                    <article className="course-card" key={c.id}>
                      <div className="image-wrap">
                        <a
                          href={linkFor(c)}
                          className={`course-image ${!c.image ? 'no-image' : ''}`}
                        >
                          {c.image ? (
                            <Image
                              width={640}
                              height={380}
                              unoptimized
                              src={c.image}
                              alt={`${c.name} illustrative course view`}
                              loading={i < 3 ? 'eager' : 'lazy'}
                            />
                          ) : (
                            <span>
                              <Flag size={36} />
                              <span>Explore the course</span>
                            </span>
                          )}
                          <span className="image-tag">{c.character}</span>
                        </a>
                        <Favorite
                          course={c}
                          selected={favoriteIds.includes(c.id)}
                          toggle={toggle}
                        />
                      </div>
                      <div className="course-body">
                        <p className="course-location">
                          <MapPin size={14} />
                          {c.city}
                          <span>· {c.distance?.toFixed(1)} mi</span>
                        </p>
                        <a href={linkFor(c)}>
                          <h3>{c.name}</h3>
                        </a>
                        <p>{c.tags.slice(0, 2).join(' · ')}</p>
                        <p className="course-reason">
                          <Check size={15} />
                          {courseReason(c, best)}
                        </p>
                        <div className="price-line">
                          <strong>{priceText(c)}</strong>
                          {c.price && <span>published · 18 holes</span>}
                        </div>
                        <div className="course-bottom">
                          <label
                            className="compare-label"
                            htmlFor={`compare-${c.id}`}
                          >
                            <Checkbox
                              id={`compare-${c.id}`}
                              checked={compare.includes(c.id)}
                              disabled={
                                !compare.includes(c.id) && compare.length >= 3
                              }
                              onCheckedChange={() => toggleCompare(c.id)}
                            />
                            Compare
                          </label>
                          <a href={linkFor(c)}>
                            Explore course <ArrowUpRight size={17} />
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            {compare.length > 0 && (
              <section
                className="comparison"
                aria-label="Compare selected courses"
              >
                <div className="row-between">
                  <div>
                    <strong>{compare.length} of 3 courses selected</strong>
                    <p className="small">
                      Compare the things that shape your round.
                    </p>
                  </div>
                  <div className="inline-actions">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCompare([]);
                        setShowCompare(false);
                      }}
                      aria-label="Clear comparison"
                    >
                      <X size={18} />
                      Clear
                    </Button>
                    <Button
                      className="button"
                      onClick={() => setShowCompare((v) => !v)}
                      disabled={compare.length < 2}
                    >
                      {showCompare ? 'Hide comparison' : 'Compare courses'}
                    </Button>
                  </div>
                </div>
                {showCompare && (
                  <div className="table-scroll">
                    <Table>
                      <caption className="sr-only">Course comparison</caption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>For your day</TableHead>
                          {selected.map((c) => (
                            <TableHead key={c.id}>{c.name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          [
                            'Distance',
                            ...selected.map(
                              (c) => `${c.distance?.toFixed(1)} mi`,
                            ),
                          ],
                          ['Character', ...selected.map((c) => c.character)],
                          [
                            'Published 18-hole price',
                            ...selected.map(priceText),
                          ],
                          [
                            'Wind exposure',
                            ...selected.map((c) =>
                              c.exposure === 'open'
                                ? 'Open layout'
                                : c.exposure === 'mixed'
                                  ? 'Mixed terrain'
                                  : 'Not verified',
                            ),
                          ],
                          [
                            'Tee times',
                            ...selected.map(() => 'Confirm with course'),
                          ],
                        ].map((row) => (
                          <TableRow key={row[0]}>
                            {row.map((cell, i) =>
                              i === 0 ? (
                                <TableHead key={i} scope="row">
                                  {cell}
                                </TableHead>
                              ) : (
                                <TableCell key={i}>{cell}</TableCell>
                              ),
                            )}
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableHead>Take a closer look</TableHead>
                          {selected.map((c) => (
                            <TableCell key={c.id}>
                              <a className="text-link" href={linkFor(c)}>
                                View course →
                              </a>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            )}
            {forecast &&
              offset === '0' &&
              tomorrowBest &&
              (!best || tomorrowBest.score > best.score + 8) && (
                <section className="tomorrow-note">
                  <CalendarDays size={25} />
                  <div>
                    <h3>There’s always tomorrow.</h3>
                    <p>
                      A {hourLabel(tomorrowBest.start.time)} start tomorrow
                      looks {best ? 'more comfortable' : 'promising'} for{' '}
                      {holes} holes.
                    </p>
                  </div>
                  <Button
                    className="button outline"
                    onClick={() => {
                      setOffset('1');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Plan tomorrow <ArrowRight size={16} />
                  </Button>
                </section>
              )}
            <div className="trust-note">
              <Info size={16} />
              <p>
                Good golf days start with good information. Prices are published
                guidance; the course confirms availability, conditions, and your
                final price. <a href="/about">How FairwayOS works</a>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </>
  );
}
