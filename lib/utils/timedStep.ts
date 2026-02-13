/**
 * Structured timing diagnostics for request-path steps.
 * Logs duration on success and rethrows on failure.
 */

export async function timedStep<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`[TIMING] ${label}: ${Date.now() - start}ms`);
    return result;
  } catch (err) {
    console.error(`[TIMING ERROR] ${label}:`, err);
    throw err;
  }
}
