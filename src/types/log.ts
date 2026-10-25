export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogResponse {
  id: number;
  userId?: number;
  username?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  level: LogLevel;
  message: string;
  additionalData?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface LogStats {
  totalLogs: number;
  recentLogs: number;
  logsByLevel: Record<LogLevel, number>;
  since: string;
}

export interface LogQueryParams {
  page?: number;
  size?: number;
  userId?: number;
  action?: string;
  resourceType?: string;
  level?: LogLevel;
  startDate?: string;
  endDate?: string;
}
