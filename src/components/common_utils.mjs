export const zip = (...arr) =>
  Array(Math.max(...arr.map((a) => a.length)))
    .fill()
    .map((_, i) => arr.map((a) => a[i]));

export const range = (start, stop, step) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
