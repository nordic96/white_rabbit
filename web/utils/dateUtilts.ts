export function wrapAdBc(year: number): string {
  return `${Math.abs(year)} ${year < 0 ? 'BC' : 'AD'}`;
}
