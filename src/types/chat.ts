export interface ChatMessageAttachment {
  fileUrl: string;
  fileType?: string;
}

export interface ChatMessageDto {
  id: number;
  senderKeycloakId: string;
  senderRole: string;
  content: string;
  type: string;
  sentAt: string;
  isRead?: boolean;
  read?: boolean;
  attachments?: ChatMessageAttachment[];
}

export interface SupportChatMessage {
  id: string;
  senderKeycloakId: string;
  senderRole: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'report';
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  isMine: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface ReportContextPayload {
  reportId?: number;
  type?: string;
  targetId?: number | null;
  targetKeycloakId?: string | null;
  targetName?: string | null;
  reason?: string;
  description?: string;
}
