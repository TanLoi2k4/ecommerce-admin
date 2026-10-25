import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Loader2, MessageSquare, Send } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { extractApiError } from '../../utils/apiError';
import { formatDateTime } from '../../utils/format';
import { getKeycloakIdFromToken } from '../../utils/jwt';
import { formatReportContextSummary, parseReportContext } from '../../utils/reportContext';
import { tokenStorage } from '../../utils/tokenStorage';
import type { ChatMessageDto, SupportChatMessage } from '../../types/chat';
import { REPORT_TYPE_LABELS, type ReportType } from '../../types/report';

function mapMessage(dto: ChatMessageDto, currentUserId: string | null): SupportChatMessage {
  const typeUpper = (dto.type ?? 'TEXT').toUpperCase();
  const attachment = dto.attachments?.[0];
  let type: SupportChatMessage['type'] = 'text';
  if (typeUpper === 'IMAGE') type = 'image';
  else if (typeUpper === 'FILE') type = 'file';
  else if (typeUpper === 'SYSTEM') type = 'system';
  else if (typeUpper === 'REPORT_CONTEXT') type = 'report';

  return {
    id: String(dto.id),
    senderKeycloakId: dto.senderKeycloakId,
    senderRole: dto.senderRole,
    content: dto.content ?? '',
    type,
    imageUrl: type === 'image' ? attachment?.fileUrl : undefined,
    fileUrl: type === 'file' ? attachment?.fileUrl : undefined,
    fileName: type === 'file' ? attachment?.fileUrl?.split('/').pop() : undefined,
    isMine: Boolean(currentUserId && dto.senderKeycloakId === currentUserId),
    isRead: Boolean(dto.isRead ?? dto.read ?? false),
    createdAt: dto.sentAt,
  };
}

interface SupportChatPanelProps {
  roomCode: string;
  reporterName?: string | null;
}

export function SupportChatPanel({ roomCode, reporterName }: SupportChatPanelProps) {
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = getKeycloakIdFromToken(tokenStorage.getAccessToken());

  const mergeMessages = useCallback((incoming: SupportChatMessage[]) => {
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      let changed = false;
      for (const msg of incoming) {
        const existing = byId.get(msg.id);
        if (
          !existing ||
          existing.content !== msg.content ||
          existing.isRead !== msg.isRead ||
          existing.type !== msg.type ||
          existing.imageUrl !== msg.imageUrl ||
          existing.fileUrl !== msg.fileUrl
        ) {
          byId.set(msg.id, msg);
          changed = true;
        }
      }
      if (!changed && byId.size === prev.length) return prev;
      return [...byId.values()].sort((a, b) => Number(a.id) - Number(b.id));
    });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const page = await chatService.getMessages(roomCode, 0, 50);
      const list = (page?.content ?? [])
        .map((dto) => mapMessage(dto, currentUserId))
        .reverse();
      setMessages(list);
      setError(null);
      isNearBottomRef.current = true;
      await chatService.markRead(roomCode);
    } catch (err) {
      setError(extractApiError(err, 'Không thể tải tin nhắn hỗ trợ'));
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, currentUserId]);

  useEffect(() => {
    setIsLoading(true);
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const page = await chatService.getMessages(roomCode, 0, 50);
          const list = (page?.content ?? [])
            .map((dto) => mapMessage(dto, currentUserId))
            .reverse();
          mergeMessages(list);
          const hasUnreadFromOther = list.some(
            (m) => !m.isMine && m.type !== 'system' && m.type !== 'report' && !m.isRead
          );
          if (hasUnreadFromOther) {
            await chatService.markRead(roomCode);
          }
        } catch {
          // ignore polling errors
        }
      })();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [roomCode, currentUserId, mergeMessages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !isNearBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleListScroll = () => {
    const el = listRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const sent = await chatService.sendMessage(roomCode, content);
      isNearBottomRef.current = true;
      mergeMessages([mapMessage(sent, currentUserId)]);
      setInput('');
    } catch (err) {
      setError(extractApiError(err, 'Không gửi được tin nhắn'));
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const sent = await chatService.sendMessage(roomCode, '', 'IMAGE', [file]);
      isNearBottomRef.current = true;
      mergeMessages([mapMessage(sent, currentUserId)]);
    } catch (err) {
      setError(extractApiError(err, 'Không gửi được ảnh'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[480px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            Chat hỗ trợ{reporterName ? ` · ${reporterName}` : ''}
          </p>
          <p className="truncate font-mono text-xs text-gray-400">{roomCode}</p>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div
        ref={listRef}
        onScroll={handleListScroll}
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Chưa có tin nhắn trong phòng hỗ trợ.</p>
        ) : (
          messages.map((msg) => {
            if (msg.type === 'system' || msg.type === 'report') {
              const ctx = msg.type === 'report' ? parseReportContext(msg.content) : null;
              return (
                <div key={msg.id} className="flex justify-center">
                  <div
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-center text-xs ${
                      msg.type === 'report'
                        ? 'border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700/80 dark:text-gray-300'
                    }`}
                  >
                    {ctx ? (
                      <div className="space-y-1 text-left">
                        <p className="font-medium">
                          {ctx.reportId != null ? `Khiếu nại #${ctx.reportId}` : 'Thông tin khiếu nại'}
                          {ctx.type && ctx.type in REPORT_TYPE_LABELS
                            ? ` · ${REPORT_TYPE_LABELS[ctx.type as ReportType]}`
                            : ''}
                        </p>
                        {ctx.targetName && (
                          <p>
                            {ctx.type === 'OTHER' || !ctx.type
                              ? 'Người bị tố cáo'
                              : 'Đối tượng'}
                            : {ctx.targetName}
                          </p>
                        )}
                        {ctx.reason && <p>{ctx.reason}</p>}
                        {ctx.description && (
                          <p className="whitespace-pre-wrap opacity-90">{ctx.description}</p>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {msg.type === 'report' ? formatReportContextSummary(msg.content) : msg.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                    msg.isMine
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  {!msg.isMine && (
                    <p className="mb-1 text-[11px] font-medium opacity-70">
                      {msg.senderRole === 'VENDOR'
                        ? 'Nhà bán'
                        : msg.senderRole === 'CUSTOMER' || msg.senderRole === 'BUYER'
                          ? 'Khách hàng'
                          : 'Người dùng'}
                    </p>
                  )}
                  {msg.type === 'image' && msg.imageUrl ? (
                    <a href={msg.imageUrl} target="_blank" rel="noreferrer">
                      <img
                        src={msg.imageUrl}
                        alt="Ảnh đính kèm"
                        className="max-h-56 max-w-full rounded-lg object-cover"
                      />
                    </a>
                  ) : msg.type === 'file' && msg.fileUrl ? (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`underline ${msg.isMine ? 'text-white/90' : 'text-primary-600'}`}
                    >
                      {msg.fileName ?? 'Tải tệp đính kèm'}
                    </a>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <p className={`mt-1 text-[10px] ${msg.isMine ? 'text-white/70' : 'text-gray-400'}`}>
                    {formatDateTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleImageSelect(e)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
            title="Gửi ảnh"
          >
            <Image className="h-5 w-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
            placeholder="Nhập tin nhắn hỗ trợ..."
            className="max-h-28 min-h-[40px] flex-1 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending || !input.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
