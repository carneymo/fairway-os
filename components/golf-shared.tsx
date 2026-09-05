/* oxlint-disable nextjs/no-html-link-for-pages -- Native document navigation avoids the beta client router that left deployed links inert. */
'use client';
import { useEffect, useState } from 'react';
import { readJson } from '@/lib/golf/client';
import Image from 'next/image';
import {
  ArrowUpRight,
  CloudSun,
  Heart,
  MapPin,
  Sun,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/combobox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { Location, Forecast, Course } from '@/lib/golf/types';
import { DENVER, validCoordinates } from '@/lib/golf/courses';
import { hourLabel, weatherLabel } from '@/lib/golf/recommendations';

export function Header({
  location = DENVER,
  onLocation,
  active = 'day',
}: {
  location?: Location;
  onLocation?: () => void;
  active?: string;
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="/">
          <Image
            src="/assets/logo/fairwayos-emblem.png"
            alt=""
            width={30}
            height={39}
            unoptimized
          />
          Fairway<span>OS</span>
        </a>
        <nav aria-label="Main navigation">
          <a className={active === 'day' ? 'active' : ''} href="/">
            Your golf day
          </a>
          <a className={active === 'courses' ? 'active' : ''} href="/#courses">
            Explore courses
          </a>
          <a className={active === 'saved' ? 'active' : ''} href="/saved">
            Saved courses
          </a>
        </nav>
        {onLocation ? (
          <button className="header-location" onClick={onLocation}>
            <MapPin size={16} />
            <span>{location.name}</span>
          </button>
        ) : (
          <a className="header-location" href="/">
            <MapPin size={16} />
            <span>{location.name}</span>
          </a>
        )}
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <a className="brand" href="/">
        Fairway<span>OS</span>
      </a>
      <p>Find your kind of golf.</p>
      <div className="footer-links">
        <a href="/about">About & data sources</a>
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Weather by Open-Meteo <ArrowUpRight size={13} />
        </a>
        <a href="https://www.weather.gov/" target="_blank" rel="noreferrer">
          National Weather Service <ArrowUpRight size={13} />
        </a>
      </div>
    </footer>
  );
}
export function Picker({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (s: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger id={id} aria-label={label} className="golf-select">
        <SelectValue>
          {options.find((o) => o.value === value)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function WeatherIcon({
  code,
  size = 24,
}: {
  code: number;
  size?: number;
}) {
  const Icon =
    code >= 95
      ? CloudLightning
      : [71, 73, 75, 77, 85, 86].includes(code)
        ? Snowflake
        : code >= 51
          ? CloudRain
          : code > 0
            ? CloudSun
            : Sun;
  return <Icon size={size} strokeWidth={1.5} aria-label={weatherLabel(code)} />;
}
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- This horizontal forecast needs a keyboard-scrollable focus target. */
export function ForecastStrip({
  forecast,
  date,
}: {
  forecast: Forecast;
  date: string;
}) {
  const hours = forecast.hours.filter(
    (h) => h.time.startsWith(date) && h.daylight,
  );
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to scroll the hourly forecast.
    <section
      className="forecast-scroll"
      tabIndex={0}
      aria-label="Hourly forecast; scroll for more hours"
    >
      <div className="forecast-strip">
        {hours.map((h) => (
          <div className="forecast-hour" key={h.time}>
            <span>{hourLabel(h.time)}</span>
            <WeatherIcon code={h.code} />
            <strong>{Math.round(h.temperature)}°</strong>
            <small>
              <Wind size={12} />
              {Math.round(h.wind)} mph
            </small>
            <small>{h.rain}% rain</small>
          </div>
        ))}
      </div>
    </section>
  );
}
/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('fairway:favorites') ?? '[]');
      if (Array.isArray(raw))
        setIds(raw.filter((x): x is string => typeof x === 'string'));
    } catch {
      /* Storage is optional. */
    }
  }, []);
  function toggle(id: string) {
    setIds((previous) => {
      const next = previous.includes(id)
        ? previous.filter((x) => x !== id)
        : [...previous, id];
      try {
        localStorage.setItem('fairway:favorites', JSON.stringify(next));
      } catch {
        /* Current visit still works. */
      }
      return next;
    });
  }
  return { ids, toggle };
}
export function Favorite({
  course,
  selected,
  toggle,
}: {
  course: Course;
  selected: boolean;
  toggle: (s: string) => void;
}) {
  return (
    <Button
      className={`favorite ${selected ? 'is-saved' : ''}`}
      variant="ghost"
      size="icon"
      aria-label={`${selected ? 'Unsave' : 'Save'} ${course.name}`}
      aria-pressed={selected}
      onClick={() => {
        try {
          const snapshots = JSON.parse(
            localStorage.getItem('fairway:course-snapshots') ?? '{}',
          );
          if (selected) delete snapshots[course.id];
          else snapshots[course.id] = course;
          localStorage.setItem(
            'fairway:course-snapshots',
            JSON.stringify(snapshots),
          );
        } catch {}
        toggle(course.id);
      }}
    >
      <Heart size={19} fill={selected ? 'currentColor' : 'none'} />
    </Button>
  );
}
export function LocationEditor({
  open,
  onChoose,
  onClose,
}: {
  open: boolean;
  onChoose: (l: Location) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(''),
    [results, setResults] = useState<Location[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBusy(true);
      setError('');
      readJson<Location[]>(
        `/api/locations?q=${encodeURIComponent(query)}`,
        controller.signal,
      )
        .then(setResults)
        .catch((e) => {
          if (e.name !== 'AbortError') setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setBusy(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);
  function device() {
    if (!navigator.geolocation) {
      setError(
        'Your browser does not support location. Search for a city instead.',
      );
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        onChoose({
          name: 'Your location',
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: 'device',
        });
      },
      () => {
        setBusy(false);
        setError('Location wasn’t shared. Search for a city or use Denver.');
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className="location-editor"
        finalFocus={() =>
          document.querySelector<HTMLButtonElement>('.header-location')
        }
      >
        <div className="location-heading">
          <DialogTitle>Where would you like to play?</DialogTitle>
          <DialogDescription>Search a city or ZIP code.</DialogDescription>
        </div>
        <Combobox
          items={results}
          filter={null}
          itemToStringLabel={(l: Location) => l.name}
          onInputValueChange={setQuery}
          onValueChange={(l: Location | null) => {
            if (l && validCoordinates(l.latitude, l.longitude)) onChoose(l);
          }}
        >
          <ComboboxInput
            aria-label="City or ZIP code"
            placeholder="Denver, Boulder, San Diego…"
            className="location-input"
          />
          <ComboboxContent>
            <ComboboxList>
              {(l: Location) => (
                <ComboboxItem key={`${l.latitude}:${l.longitude}`} value={l}>
                  {l.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <div className="location-actions">
          <Button variant="outline" onClick={device} disabled={busy}>
            <Navigation size={15} />
            Use my location
          </Button>
          <Button variant="ghost" onClick={() => onChoose(DENVER)}>
            Use Denver
          </Button>
        </div>
        <p aria-live="polite" className="small">
          {error ||
            (busy
              ? 'Finding your location…'
              : query.length >= 2 && results.length === 0
                ? 'No matching places yet. Try a nearby city.'
                : 'Approximate location is used by default. Your choice stays on this device.')}
        </p>
      </DialogContent>
    </Dialog>
  );
}
