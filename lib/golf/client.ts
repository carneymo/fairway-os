export async function readJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const deadline = AbortSignal.timeout(35000);
  const response = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof (data as { error?: unknown })?.error === 'string'
        ? (data as { error: string }).error
        : 'Something went wrong. Please try again.',
    );
  return data as T;
}
