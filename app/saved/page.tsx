/* oxlint-disable nextjs/no-html-link-for-pages -- Native document navigation avoids the beta client router that left deployed links inert. */
'use client';
import { useEffect, useState } from 'react';
import { CourseVisual, PhotoCredit } from '@/components/course-visual';
import { Heart, ArrowUpRight } from 'lucide-react';
import { COURSES } from '@/lib/golf/courses';
import type { Course } from '@/lib/golf/types';
import {
  Header,
  Footer,
  Favorite,
  useFavorites,
} from '@/components/golf-shared';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
export default function Saved() {
  const { ids, toggle } = useFavorites();
  const [snapshots, setSnapshots] = useState<Course[]>([]);
  useEffect(() => {
    try {
      const v = JSON.parse(
        localStorage.getItem('fairway:course-snapshots') ?? '{}',
      );
      setSnapshots(Object.values(v));
    } catch {}
  }, []);
  const courses = [
    ...COURSES,
    ...snapshots.filter((c) => !COURSES.some((n) => n.id === c.id)),
  ].filter((c) => ids.includes(c.id));
  return (
    <>
      <Header active="saved" />
      <main className="shell saved-page" id="main">
        <p className="eyebrow">THE PLACES YOU KEEP COMING BACK TO</p>
        <h1>Your kind of golf.</h1>
        <p className="lead-copy">
          Keep the courses you’d like to play close at hand. Saved on this
          device.
        </p>
        {courses.length ? (
          <div className="course-grid">
            {courses.map((c) => (
              <article className="course-card" key={c.id}>
                <div className="image-wrap">
                  <a
                    className="course-image"
                    href={`/courses/${c.id}?lat=${c.latitude}&lon=${c.longitude}`}
                  >
                    <CourseVisual course={c} />
                  </a>
                  <Favorite course={c} selected toggle={toggle} />
                </div>
                <PhotoCredit course={c} />
                <div className="course-body">
                  <p className="course-location">{c.city}</p>
                  <h3>{c.name}</h3>
                  <p>{c.character}</p>
                  <a
                    className="text-link"
                    href={`/courses/${c.id}?lat=${c.latitude}&lon=${c.longitude}`}
                  >
                    Plan a round <ArrowUpRight size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty className="empty-state">
            <Heart size={32} />
            <EmptyHeader>
              <EmptyTitle>A place for your favorites.</EmptyTitle>
              <EmptyDescription>
                Tap the heart on a course to keep it here for your next golf
                day.
              </EmptyDescription>
            </EmptyHeader>
            <a className="button" href="/#courses">
              Find a course to save
            </a>
          </Empty>
        )}
      </main>
      <Footer />
    </>
  );
}
