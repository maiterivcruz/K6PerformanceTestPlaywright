/**
 * Type definitions for k6/experimental/websockets
 * Provides a browser-compatible WebSocket API for k6 scripts.
 */
declare module 'k6/experimental/websockets' {
  export interface Event {
    readonly type: string;
  }

  export interface MessageEvent extends Event {
    readonly data: string | ArrayBuffer;
    readonly origin: string;
  }

  export interface CloseEvent extends Event {
    readonly code: number;
    readonly reason: string;
    readonly wasClean: boolean;
  }

  export interface ErrorEvent extends Event {
    readonly message: string;
  }

  export class WebSocket {
    static readonly CONNECTING: 0;
    static readonly OPEN: 1;
    static readonly CLOSING: 2;
    static readonly CLOSED: 3;

    readonly readyState: 0 | 1 | 2 | 3;
    readonly url: string;
    readonly protocol: string;
    readonly bufferedAmount: number;
    readonly extensions: string;

    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: ErrorEvent) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;

    constructor(url: string, protocols?: string | string[], params?: Record<string, unknown>);

    /**
     * Transmits data to the server over the WebSocket connection.
     */
    send(data: string | ArrayBuffer): void;

    /**
     * Closes the WebSocket connection.
     */
    close(code?: number, reason?: string): void;

    /**
     * Registers an event listener for the given event type.
     */
    addEventListener(
      type: 'open' | 'message' | 'error' | 'close',
      listener: (event: Event | MessageEvent | ErrorEvent | CloseEvent) => void
    ): void;
  }
}
