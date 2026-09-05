/* oxlint-disable nextjs/no-html-link-for-pages -- Native document navigation avoids the beta client router that left deployed links inert. */
'use client';
import { useEffect, useState } from 'react';
import { readJson } from '@/lib/golf/client';
import {
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  Flag,
  Check,
  Info,
  Wind,
  Clock3,
  Phone,
  Copy,
  RefreshCw,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Header,
  Footer,
  ForecastStrip,
  Picker,
  WeatherIcon,
  useFavorites,
  Favorite,
} from './golf-shared';
import {
  localNow,
  playingWindows,
  hourLabel,
} from '@/lib/golf/recommendations';
import type { Course, CourseSignals, Forecast } from '@/lib/golf/types';

export default function CourseDetail({
  course,
  initialDate,
  initialHoles,
}: {
  course: Course;
  initialDate?: string;
  initialHoles: string;
}) {
  const [forecast, setForecast] = useState<Forecast | null>(null),
    [weatherError, setWeatherError] = useState(''),
    [retry, setRetry] = useState(0),
    [loading, setLoading] = useState(true);
  const [date, setDate] = useState(
    initialDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(initialDate) &&
      Number.isFinite(Date.parse(initialDate))
      ? initialDate
      : localNow('America/Denver').slice(0, 10),
  );
  const [holes, setHoles] = useState(initialHoles),
    [players, setPlayers] = useState('1'),
    [period, setPeriod] = useState('any'),
    [selectedStart, setSelectedStart] = useState(''),
    [copied, setCopied] = useState('');
  const [signals, setSignals] = useState<CourseSignals | null>(null),
    [signalsLoading, setSignalsLoading] = useState(true);
  const { ids, toggle } = useFavorites();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setRetry((value) => value + 1), 15 * 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setForecast(null);
    setWeatherError('');
    readJson<Forecast>(
      `/api/weather?lat=${course.latitude}&lon=${course.longitude}`,
      controller.signal,
    )
      .then((f) => {
        setForecast(f);
        setDate((d) =>
          f.days.some((day) => day.date === d) ? d : f.days[0].date,
        );
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setWeatherError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [course.latitude, course.longitude, retry]);
  useEffect(() => {
    setSelectedStart('');
    setSignals(null);
    if (course.id.startsWith('osm-')) {
      setSignalsLoading(false);
      return;
    }
    const controller = new AbortController();
    setSignalsLoading(true);
    readJson<CourseSignals>(
      `/api/courses/${course.id}/signals?date=${date}`,
      controller.signal,
    )
      .then(setSignals)
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setSignalsLoading(false);
      });
    return () => controller.abort();
  }, [course.id, date]);
  const windows = forecast
      ? playingWindows(forecast, date, Number(holes), period, now)
      : [],
    best = windows[0];
  const activeStart = windows.some((w) => w.start.time === selectedStart)
    ? selectedStart
    : best?.start.time;
  const chosen = windows.find((w) => w.start.time === activeStart);
  const day = forecast?.days.find((d) => d.date === date);
  const price = signals?.price;
  const bookingUrl =
    signals?.availability.bookingUrl ?? course.bookingUrl ?? course.website;
  const notices =
    signals?.notices ??
    (course.notices ?? [])
      .filter((n) => date >= n.from && date <= n.until)
      .map((n) => n.text);
  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(
        `${course.name}\n${dateLabel}${activeStart ? ` at ${hourLabel(activeStart)}` : ''} (${forecast?.timezone ?? 'course local time'})\n${holes} holes · ${players} player${players === '1' ? '' : 's'}\nWeather-based plan; tee time not reserved.\nBook directly: ${bookingUrl ?? course.source.url}`,
      );
      setCopied('Plan copied');
    } catch {
      setCopied('Copy unavailable. Your plan is shown below.');
    }
    setTimeout(() => setCopied(''), 4000);
  }
  return (
    <>
      <Header
        active="courses"
        location={{
          name: course.city,
          latitude: course.latitude,
          longitude: course.longitude,
          timezone: forecast?.timezone ?? 'America/Denver',
          source: 'search',
        }}
      />
      <main className="shell course-detail" id="main">
        <a className="back-link" href="/#courses">
          <ArrowLeft size={16} />
          Back to your golf day
        </a>
        <section
          className={`detail-hero ${course.image ? '' : 'without-photo'}`}
          style={
            course.image
              ? {
                  backgroundImage: `linear-gradient(90deg,rgba(8,38,29,.86),rgba(8,38,29,.12)),url('${course.image}')`,
                }
              : undefined
          }
        >
          <div>
            <p className="eyebrow">
              {course.city.toUpperCase()} ·{' '}
              {course.tags.includes('Public')
                ? 'PUBLIC GOLF'
                : 'COURSE DISCOVERY'}
            </p>
            <h1>{course.name}</h1>
            <p>{course.character}.</p>
            <div className="detail-hero-facts">
              <span>
                <Flag size={17} />
                {course.holes
                  ? `${course.holes} holes`
                  : 'Course details at source'}
              </span>
              {course.par && <span>Par {course.par}</span>}
              <span>{course.tags[0]}</span>
            </div>
          </div>
          <Favorite
            course={course}
            selected={ids.includes(course.id)}
            toggle={toggle}
          />
          {course.image && (
            <span className="illustration-caption">
              Illustrative course image from the FairwayOS design collection
            </span>
          )}
        </section>
        <div className="detail-layout">
          <div className="detail-main">
            <section className="editorial-section">
              <p className="eyebrow">THE KIND OF ROUND YOU’RE LOOKING FOR</p>
              <h2>{course.character}.</h2>
              <p className="lead-copy">{course.description}</p>
              <div className="tag-row">
                {course.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </section>
            {notices.length > 0 && (
              <section className="course-notices" aria-label="Course notices">
                <h3>
                  <Info size={21} />
                  Before you go
                </h3>
                {notices.map((n) => (
                  <p key={n}>{n}</p>
                ))}
                <a
                  href={course.notices?.[0]?.url ?? course.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the course notice <ArrowUpRight size={14} />
                </a>
                <span className="small">
                  Published information, reviewed September 5, 2026. Confirm
                  current status with the course.
                </span>
              </section>
            )}
            <section className="editorial-section">
              <div className="row-between">
                <div>
                  <p className="eyebrow">THE WEATHER AT THIS COURSE</p>
                  <h2>A window for your round.</h2>
                </div>
                {forecast && <span className="small">{forecast.timezone}</span>}
              </div>
              {loading ? (
                <Skeleton className="h-32 w-full mt-6" />
              ) : weatherError ? (
                <div className="inline-error">
                  <p>{weatherError}</p>
                  <Button
                    variant="outline"
                    onClick={() => setRetry((v) => v + 1)}
                  >
                    <RefreshCw size={15} />
                    Retry forecast
                  </Button>
                </div>
              ) : best ? (
                <>
                  <div className="window-summary">
                    <WeatherIcon code={best.start.code} size={36} />
                    <div>
                      <strong>
                        {hourLabel(best.start.time)} is a promising start.
                      </strong>
                      <p>{best.reason}</p>
                    </div>
                  </div>
                  {course.exposure === 'open' && (
                    <p className="wind-note">
                      <Wind size={17} />
                      This is an open layout. Wind can have a bigger influence
                      on your round.
                    </p>
                  )}
                  <ForecastStrip forecast={forecast!} date={date} />
                  <p className="small">
                    Forecast fetched{' '}
                    {new Date(forecast!.fetchedAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: forecast!.timezone,
                    })}{' '}
                    · {forecast?.daylightApproximate ? 'Play until' : 'Sunset'}{' '}
                    {day ? hourLabel(day.sunset) : 'unknown'}. Conditions on the
                    ground and course opening status are not verified.
                  </p>
                </>
              ) : (
                <div className="inline-error">
                  <h3>No full-round weather window for these choices.</h3>
                  <p>
                    Try 9 holes, another start period, or another day.
                    Thunderstorms, snow, strong gusts, and insufficient daylight
                    exclude a window.
                  </p>
                </div>
              )}
            </section>
            <section className="editorial-section">
              <p className="eyebrow">MAKE YOURSELF AT HOME</p>
              <h2>The rest of your round.</h2>
              <div className="amenity-grid">
                {course.amenities.length ? (
                  course.amenities.map((a) => (
                    <span key={a}>
                      <Check size={17} />
                      {a}
                    </span>
                  ))
                ) : (
                  <p>
                    Check the course website for facilities and visitor
                    information.
                  </p>
                )}
              </div>
              <div className="location-block">
                <MapPin size={24} />
                <div>
                  <strong>{course.address ?? course.city}</strong>
                  <p>Leave time to check in and warm up.</p>
                  <a
                    className="text-link"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${course.latitude},${course.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions <ArrowUpRight size={15} />
                  </a>
                </div>
              </div>
              {course.phone && (
                <a className="phone-link" href={`tel:${course.phone}`}>
                  <Phone size={16} />
                  {course.phone}
                </a>
              )}
            </section>
            <details className="source-details">
              <summary>Sources & confidence</summary>
              <p>
                Course facts:{' '}
                <a href={course.source.url} target="_blank" rel="noreferrer">
                  {course.source.label}
                </a>
                , checked{' '}
                {new Date(course.source.checkedAt).toLocaleDateString()}.
              </p>
              <p>
                Course character is FairwayOS editorial guidance. Weather is a
                forecast, not a measurement of course conditions.
              </p>
              {price && (
                <p>
                  Rates:{' '}
                  <a href={price.source.url} target="_blank" rel="noreferrer">
                    Official rate page
                  </a>
                  , checked{' '}
                  {new Date(price.source.checkedAt).toLocaleDateString()}.
                </p>
              )}
              <p>
                Exact tee-time inventory is not currently available for this
                course in FairwayOS. A booking link does not establish that the
                course is open or has available slots.
              </p>
            </details>
          </div>
          <aside className="booking-panel" id="plan">
            <p className="eyebrow">FROM A GOOD IDEA TO THE FIRST TEE</p>
            <h2>Make it a golf day.</h2>
            <div className="booking-price">
              {signalsLoading ? (
                <Skeleton className="h-8 w-36" />
              ) : price ? (
                <>
                  <strong>
                    ${price.min}–${price.max}
                  </strong>
                  <span>published 18-hole green fees</span>
                </>
              ) : (
                <>
                  <strong>Check today’s rate</strong>
                  <span>Prices are confirmed by the course</span>
                </>
              )}
            </div>
            {price && <p className="price-note">{price.note}</p>}
            <div className="booking-controls">
              <label htmlFor="booking-day">
                Day
                <Picker
                  id="booking-day"
                  label="Day to play"
                  value={date}
                  onChange={setDate}
                  options={
                    forecast
                      ? forecast.days.map((d, i) => ({
                          value: d.date,
                          label:
                            i === 0
                              ? 'Today'
                              : i === 1
                                ? 'Tomorrow'
                                : new Date(
                                    d.date + 'T12:00:00Z',
                                  ).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                    timeZone: 'UTC',
                                  }),
                        }))
                      : [{ value: date, label: dateLabel }]
                  }
                />
              </label>
              <div>
                <label htmlFor="booking-round">
                  Round
                  <Picker
                    id="booking-round"
                    label="Round length"
                    value={holes}
                    onChange={setHoles}
                    options={[
                      { value: '18', label: '18 holes' },
                      { value: '9', label: '9 holes' },
                    ]}
                  />
                </label>
                <label htmlFor="booking-players">
                  Group
                  <Picker
                    id="booking-players"
                    label="Number of players"
                    value={players}
                    onChange={setPlayers}
                    options={[1, 2, 3, 4].map((n) => ({
                      value: String(n),
                      label: `${n} player${n > 1 ? 's' : ''}`,
                    }))}
                  />
                </label>
              </div>
              <label htmlFor="booking-period">
                When
                <Picker
                  id="booking-period"
                  label="Preferred start period"
                  value={period}
                  onChange={setPeriod}
                  options={[
                    { value: 'any', label: 'Any time' },
                    { value: 'am', label: 'Morning' },
                    { value: 'pm', label: 'Afternoon' },
                  ]}
                />
              </label>
            </div>
            {windows.length > 0 && (
              <div className="suggested-times">
                <strong>Suggested starts</strong>
                <span>Based on weather · not available tee times</span>
                <div>
                  {windows
                    .slice(0, 3)
                    .sort((a, b) => a.start.time.localeCompare(b.start.time))
                    .map((w) => (
                      <Button
                        variant="outline"
                        className={
                          activeStart === w.start.time ? 'chosen-time' : ''
                        }
                        key={w.start.time}
                        onClick={() => setSelectedStart(w.start.time)}
                        aria-pressed={activeStart === w.start.time}
                      >
                        {hourLabel(w.start.time)}
                      </Button>
                    ))}
                </div>
              </div>
            )}
            <div className="your-plan">
              <CalendarDays size={19} />
              <div>
                <strong>{dateLabel}</strong>
                <p>
                  {holes} holes · {players} player{players === '1' ? '' : 's'}
                  {activeStart ? ` · ${hourLabel(activeStart)}` : ''}
                </p>
                {chosen && (
                  <span>Estimated finish {hourLabel(chosen.end.time)}</span>
                )}
              </div>
            </div>
            {bookingUrl ? (
              <a
                className="button booking-cta"
                href={bookingUrl}
                target="_blank"
                rel="noreferrer"
              >
                {course.id.startsWith('osm-')
                  ? 'Visit course website'
                  : 'Check tee times at the course'}
                <ArrowUpRight size={18} />
              </a>
            ) : (
              <a
                className="button booking-cta"
                href={course.source.url}
                target="_blank"
                rel="noreferrer"
              >
                View course listing <ArrowUpRight size={18} />
              </a>
            )}
            <p className="handoff-note">
              Choose this date, group, and time on the course’s website. You’ll
              confirm availability, price, and the reservation there.
            </p>
            <Button variant="ghost" className="copy-plan" onClick={copyPlan}>
              <Copy size={15} />
              {copied || 'Copy my round plan'}
            </Button>
            <span className="sr-only" aria-live="polite">
              {copied}
            </span>
            <div className="booking-confidence">
              <Clock3 size={15} />
              <span>Tee-time availability: confirm with course</span>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
