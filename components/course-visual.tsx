'use client';
/* oxlint-disable nextjs/no-img-element -- Pre-generated local WebP variants provide srcset without depending on runtime image transformation. */
import { useState } from 'react';
import { Flag } from 'lucide-react';
import type { Course } from '@/lib/golf/types';

export function CourseVisual({
  course,
  hero = false,
  eager = false,
}: {
  course: Course;
  hero?: boolean;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const photo = course.photo;
  if (!photo || failed)
    return (
      <div
        className={`course-visual course-visual-fallback ${hero ? 'hero-visual' : ''}`}
      >
        {!hero && (
          <>
            <Flag size={24} strokeWidth={1.5} />
            <span className="eyebrow">COURSE GUIDE</span>
            <strong>{course.city}</strong>
            <span>{course.tags.slice(0, 2).join(' · ')}</span>
          </>
        )}
      </div>
    );
  return (
    <img
      className={`course-visual ${hero ? 'hero-visual' : ''}`}
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={
        hero
          ? '(min-width: 1450px) 1372px, 100vw'
          : '(min-width: 1100px) 440px, (min-width: 700px) 50vw, 100vw'
      }
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      loading={hero || eager ? 'eager' : 'lazy'}
      fetchPriority={hero ? 'high' : 'auto'}
      decoding="async"
      style={{ objectPosition: photo.position ?? 'center' }}
      onError={() => setFailed(true)}
    />
  );
}

export function PhotoCredit({ course }: { course: Course }) {
  if (!course.photo) return null;
  if (course.photo.kind === 'illustration')
    return (
      <div className="photo-credit illustration-credit">
        <span>Illustrative landscape</span> · AI-generated, not an actual course
        photo
      </div>
    );
  return (
    <div className="photo-credit">
      Photo:{' '}
      <a href={course.photo.sourceUrl} target="_blank" rel="noreferrer">
        {course.photo.author}
      </a>
      {' · '}
      <a href={course.photo.licenseUrl} target="_blank" rel="noreferrer">
        {course.photo.license}
      </a>
      {course.photo.takenAt && <> · {course.photo.takenAt.slice(0, 4)}</>}
    </div>
  );
}
