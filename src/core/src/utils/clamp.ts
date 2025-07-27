/**
 * Clamps a value within the bounds of specified minimum and maximum.
 * Given a number less than min, return min.
 * Given a number greater than max, return max
 * @param num
 * @param min
 * @param max
 * @returns number
 */
export const clamp = (num: number, min: number, max: number): number =>
  Math.max(min, Math.min(num, max));
