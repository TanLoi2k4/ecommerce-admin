import axios from 'axios';
import type { ApiError } from '../types';

export function extractApiError(error: unknown, fallback = 'Đã xảy ra lỗi'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
