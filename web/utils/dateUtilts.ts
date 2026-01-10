export function wrapAdBc(year: number): string {
  return `${year < 0 ? 'BC' : 'AD'}${Math.abs(year)}`;
}
