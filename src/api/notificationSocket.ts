import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { PersonalNotificationResponse } from '../types/notification';

type NotificationHandler = (notification: PersonalNotificationResponse) => void;
type TokenProvider = () => string | null;

let notificationClient: Client | null = null;
let notificationSubscription: StompSubscription | null = null;

function wsUrl(): string {
  const base = import.meta.env.VITE_WS_URL as string | undefined;
  if (base) return `${base.replace(/\/$/, '')}/ws`;
  return `${window.location.origin}/ws`;
}

function parseNotificationPayload(payload: unknown): PersonalNotificationResponse | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  if (typeof raw.id !== 'number' || typeof raw.title !== 'string') return null;

  const type = typeof raw.type === 'string' ? raw.type : 'SYSTEM';
  return {
    id: raw.id,
    type: type as PersonalNotificationResponse['type'],
    title: raw.title,
    content: String(raw.content ?? ''),
    link: raw.link != null ? String(raw.link) : null,
    metadata: raw.metadata != null ? String(raw.metadata) : null,
    isRead: Boolean(raw.isRead ?? raw.read ?? false),
    read: Boolean(raw.isRead ?? raw.read ?? false),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export function connectNotificationSocket(
  getToken: TokenProvider,
  onNotification: NotificationHandler
): () => void {
  disconnectNotificationSocket();

  const token = getToken();
  if (!token) return () => undefined;

  notificationClient = new Client({
    webSocketFactory: () => new SockJS(wsUrl()),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    beforeConnect: () => {
      const latestToken = getToken();
      notificationClient!.connectHeaders = latestToken
        ? { Authorization: `Bearer ${latestToken}` }
        : {};
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      notificationSubscription = notificationClient!.subscribe(
        '/user/queue/notifications',
        (msg: IMessage) => {
          try {
            const dto = parseNotificationPayload(JSON.parse(msg.body));
            if (dto) onNotification(dto);
          } catch {
            // ignore malformed payloads
          }
        }
      );
    },
  });

  notificationClient.activate();

  return () => disconnectNotificationSocket();
}

export function isNotificationSocketConnected(): boolean {
  return Boolean(notificationClient?.connected);
}

export function disconnectNotificationSocket(): void {
  if (notificationSubscription) {
    notificationSubscription.unsubscribe();
    notificationSubscription = null;
  }
  if (notificationClient) {
    notificationClient.deactivate();
    notificationClient = null;
  }
}
