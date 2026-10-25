import type { ReportContextPayload } from '../types/chat';
import { REPORT_TYPE_LABELS, type ReportType } from '../types/report';

export function parseReportContext(content: string): ReportContextPayload | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as ReportContextPayload;
  } catch {
    return null;
  }
}

export function formatReportContextSummary(content: string): string {
  const ctx = parseReportContext(content);
  if (!ctx) return content;

  const typeLabel =
    ctx.type && ctx.type in REPORT_TYPE_LABELS
      ? REPORT_TYPE_LABELS[ctx.type as ReportType]
      : ctx.type;

  const parts = [
    ctx.reportId != null ? `Khiếu nại #${ctx.reportId}` : null,
    typeLabel,
    ctx.targetName
      ? ctx.targetName
      : ctx.targetId != null
        ? `Mục tiêu #${ctx.targetId}`
        : null,
    ctx.reason,
  ].filter(Boolean);

  return parts.join(' · ') || content;
}
