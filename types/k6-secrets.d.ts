/**
 * Type definitions for k6/experimental/secrets
 * Provides access to secrets stored in the k6 Secret Store.
 */
declare module 'k6/experimental/secrets' {
  /**
   * Retrieves the value of a secret by name.
   * Returns undefined if the secret does not exist.
   */
  export function get(secretName: string): string | undefined;
}
