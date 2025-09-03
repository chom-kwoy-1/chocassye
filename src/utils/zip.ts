export function* range(
  start: number,
  end?: number,
  step: number = 1,
): Generator<number> {
  // Handle the case where only 'stop' is provided
  if (end === undefined) {
    end = start;
    start = 0;
  }

  // Handle positive and negative steps
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      yield i;
    }
  } else if (step < 0) {
    for (let i = start; i > end; i += step) {
      yield i;
    }
  }
}

export function zip<T extends unknown[][]>(
  ...args: T
): { [K in keyof T]: T[K] extends (infer V)[] ? V : never }[] {
  const minLength = Math.min(...args.map((arr) => arr.length));
  // @ts-expect-error This is too much for ts
  return range(minLength)
    .map((i) => args.map((arr) => arr[i]))
    .toArray();
}
