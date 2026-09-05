import { notFound } from 'next/navigation';
import { COURSES } from '@/lib/golf/courses';
import { discoverCourses } from '@/lib/golf/discovery';
import { validCoordinates } from '@/lib/golf/courses';
import CourseDetail from '@/components/course-detail';
export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params,
    query = await searchParams;
  let course = COURSES.find((c) => c.id === id);
  if (
    !course &&
    /^osm-(node|way|relation)-\d+$/.test(id) &&
    typeof query.lat === 'string' &&
    typeof query.lon === 'string'
  ) {
    const lat = Number(query.lat),
      lon = Number(query.lon);
    if (validCoordinates(lat, lon))
      course = (await discoverCourses(lat, lon)).courses.find(
        (c) => c.id === id,
      );
  }
  if (!course) notFound();
  return (
    <CourseDetail
      course={course}
      initialDate={typeof query.date === 'string' ? query.date : undefined}
      initialHoles={query.holes === '9' ? '9' : '18'}
    />
  );
}
