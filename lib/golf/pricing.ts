import type { Course } from './types';
export function publishedPrice(course: Course, date: string) {
  const price = course.price;
  if (
    !price ||
    Date.now() - Date.parse(price.source.checkedAt) > 30 * 86400_000
  )
    return undefined;
  if (
    course.id === 'fossil-trace' &&
    (date < '2026-05-08' || date > '2026-09-09')
  )
    return undefined;
  return price;
}
