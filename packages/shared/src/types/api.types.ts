// ================================
// Types liés aux réponses API
// ================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  meta?: PaginationMeta;
  request_id?: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

// Helper pour créer une réponse succès
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  meta?: PaginationMeta,
): ApiResponse<T> => ({
  success: true,
  data,
  message,
  meta,
});

// Helper pour créer une réponse erreur
export const createErrorResponse = (
  code: string,
  message: string,
  field?: string,
): ApiResponse => ({
  success: false,
  error: { code, message, field },
});
