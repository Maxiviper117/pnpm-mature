export async function mapWithConcurrency<TValue, TResult>(
  values: TValue[],
  concurrency: number,
  worker: (value: TValue, index: number) => Promise<TResult>,
): Promise<TResult[]> {
  const results = new Array<TResult>(values.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= values.length) {
        return;
      }

      const value = values[currentIndex]!;
      results[currentIndex] = await worker(value, currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, values.length)) }, () => runWorker()),
  );

  return results;
}
