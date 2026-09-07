import { useEffect, useRef } from "react";

import { DEALLAKAY_API_URL } from "@/src/constants/config";
import { getAuthToken } from "@/src/api/client";
import type { Message } from "@/src/api/messages";

interface WsEvent {
  event: "message";
  data: Message;
  conversation_id: string;
}

/** Connects to DealLakay's existing WebSocket (routers/social.py's /ws) and
 * calls onMessage for every real-time message event — no new realtime
 * infrastructure, just a client for what already powers the website. */
export function useDealLakayWebSocket(onMessage: (evt: WsEvent) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;

    (async () => {
      const token = await getAuthToken();
      if (!token || !DEALLAKAY_API_URL || cancelled) return;

      const wsUrl = DEALLAKAY_API_URL.replace(/^http/, "ws").replace(/\/api\/?$/, "") + `/api/ws?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed?.event === "message") onMessageRef.current(parsed);
        } catch {
          /* ignore malformed frames */
        }
      };
    })();

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, []);
}
