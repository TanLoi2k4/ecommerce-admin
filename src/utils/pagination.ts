import type { PaginatedResult, SpringPage } from '../types';

export function mapSpringPage<T>(page: SpringPage<T>, uiPage?: number): PaginatedResult<T> {
  return {
    data: page.content,
    total: page.totalElements,
    page: uiPage ?? page.number + 1,
    totalPages: page.totalPages,
  };
}

export function toSpringPage(uiPage: number): number {
  return Math.max(0, uiPage - 1);
}
