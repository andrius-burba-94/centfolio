export function sumMoney(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
