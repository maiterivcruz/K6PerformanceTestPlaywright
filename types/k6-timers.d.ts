/**
 * Type definitions for k6/timers
 * Provides timer utilities compatible with the Web API.
 */
declare module 'k6/timers' {
  /**
   * Schedules a function to be called after a delay (in milliseconds).
   * Returns a timer ID that can be used with clearTimeout.
   */
  export function setTimeout(fn: () => void, delay?: number): number;

  /**
   * Cancels a timeout previously scheduled with setTimeout.
   */
  export function clearTimeout(id: number): void;

  /**
   * Repeatedly calls a function with a fixed time delay (in milliseconds).
   * Returns an interval ID that can be used with clearInterval.
   */
  export function setInterval(fn: () => void, interval: number): number;

  /**
   * Cancels a repeated action previously scheduled with setInterval.
   */
  export function clearInterval(id: number): void;
}
