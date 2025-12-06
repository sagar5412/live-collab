// Type declarations for y-websocket
declare module "y-websocket/bin/utils" {
  import { WebSocket } from "ws";
  import { IncomingMessage } from "http";

  export interface WSSharedDocOptions {
    docName?: string;
    gc?: boolean;
  }

  export function setupWSConnection(
    conn: WebSocket,
    req: IncomingMessage,
    options?: WSSharedDocOptions
  ): void;

  export function getYDoc(docName: string, gc?: boolean): any;
}
