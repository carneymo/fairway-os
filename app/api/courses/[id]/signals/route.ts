import { COURSES } from '@/lib/golf/courses';
import { getCourseSignals } from '@/lib/golf/sources';
import { apiError } from '@/lib/golf/http';
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params,
    course = COURSES.find((c) => c.id === id);
  if (!course) return apiError('Course not found.', 404);
  const date = new URL(request.url).searchParams.get('date') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)))
    return apiError('Choose a valid date.', 400);
  return Response.json(await getCourseSignals(course, date), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
