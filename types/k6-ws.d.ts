/**
 * Type definitions for k6/ws
 * Provides WebSocket support for k6 performance tests using a callback-based API.
 */
declare module 'k6/ws' {
  export interface Params {
    headers?: Record<string, string>;
    tags?: Record<string, string>;
    jar?: object;
    compression?: string;
  }

  export interface ConnectResponse {
    status: number;
    headers: Record<string, string>;
    url: string;
    timings: {
      connecting: number;
      handshaking: number;
      sending: number;
      waiting: number;
      receiving: number;
      duration: number;
    };
    error: string;
    error_code: number;
  }

  export interface Socket {
    /**
     * Registers an event handler for the given event.
     */
    on(event: 'open' | 'message' | 'ping' | 'pong' | 'close' | 'error', callback: (...args: unknown[]) => void): void;

    /**
     * Sends a string message over the WebSocket connection.
     */
    send(data: string): void;

    /**
     * Sends a ping message to the server.
     */
    ping(): void;

    /**
     * Schedules a function to run after a given delay (in milliseconds).
     */
    setTimeout(fn: () => void, delay: number): void;

    /**
     * Schedules a function to run repeatedly every given interval (in milliseconds).
     */
    setInterval(fn: () => void, interval: number): void;

    /**
     * Closes the WebSocket connection with an optional status code.
     */
    close(code?: number): void;
  }

  /**
   * Opens a WebSocket connection and runs the given callback function.
   */
  export function connect(
    url: string,
    params: Params | null,
    callback: (socket: Socket) => void
  ): ConnectResponse;
}
